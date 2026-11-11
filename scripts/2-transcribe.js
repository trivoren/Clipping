/**
 * 2-transcribe.js (GROQ API - Versión en la nube)
 *
 * Extrae el audio del video con ffmpeg, lo divide en chunks de 10 minutos
 * (porque Groq tiene un límite de 25MB por archivo), transcribe cada chunk
 * con whisper-large-v3-turbo vía API de Groq, y unifica todos los resultados
 * en data/transcripts/transcripcion.json.
 *
 * Estructura de salida (formato que espera AutoClip.tsx):
 *   [{ word: string, start: number, end: number }]  // start/end en milisegundos
 */

require("dotenv").config();
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs");
const path = require("path");
const { createWriteStream } = require("fs");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffmpegInstaller.path);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error(
    "❌ GROQ_API_KEY no definida en .env\n" +
    "   Crea un archivo .env con: GROQ_API_KEY=tu_clave_aquí"
  );
  process.exit(1);
}

const VIDEO_FILE = path.resolve("public/source_videos/podcast_malambo.mp4");
const AUDIO_FILE = path.resolve("audio_temp.wav");
const CHUNKS_DIR = path.resolve("data/chunks");
const OUTPUT_DIR = path.resolve("data/transcripts");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "transcripcion.json");

// Configuración de Groq
const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";
const CHUNK_DURATION_SEC = 600; // 10 minutos por chunk

async function main() {
  // Paso 0: Verificar video fuente
  if (!fs.existsSync(VIDEO_FILE)) {
    console.error(
      `❌ No se encontró el video: ${VIDEO_FILE}.\n` +
      "   Ejecuta primero: node scripts/1-download.js"
    );
    process.exit(1);
  }

  fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Paso 1: Extraer audio con ffmpeg (WAV 16kHz mono)
  console.log("🎧 Extrayendo audio del video con ffmpeg...");
  await new Promise((resolve, reject) => {
    ffmpeg(VIDEO_FILE)
      .noVideo()
      .audioCodec("pcm_s16le")
      .audioFrequency(16000)
      .audioChannels(1)
      .format("wav")
      .on("start", (cmd) => console.log(`   Ejecutando: ${cmd}`))
      .on("progress", (p) =>
        process.stdout.write(
          `   Procesando audio... ${Math.round(p.percent || 0)}%\r`
        )
      )
      .on("end", () => {
        console.log("\n✅ Audio extraído: audio_temp.wav");
        resolve();
      })
      .on("error", (err) => {
        console.error("\n❌ Error extrayendo audio:", err.message);
        reject(err);
      })
      .save(AUDIO_FILE);
  });

  // Obtener duración total del audio
  const audioDurationSec = await getAudioDuration(AUDIO_FILE);
  console.log(`   Duración total: ${(audioDurationSec / 60).toFixed(1)} minutos`);

  // Paso 2: Dividir audio en chunks de 10 minutos
  console.log("\n✂️  Dividiendo audio en chunks de 10 minutos...");
  const chunkFiles = [];
  const totalChunks = Math.ceil(audioDurationSec / CHUNK_DURATION_SEC);

  for (let i = 0; i < totalChunks; i++) {
    const startSec = i * CHUNK_DURATION_SEC;
    const chunkFile = path.join(CHUNKS_DIR, `chunk_${String(i + 1).padStart(2, "0")}.wav`);
    chunkFiles.push({ file: chunkFile, startSec, index: i });

    await new Promise((resolve, reject) => {
      ffmpeg(AUDIO_FILE)
        .noVideo()
        .setStartTime(startSec)
        .setDuration(CHUNK_DURATION_SEC)
        .audioCodec("pcm_s16le")
        .audioFrequency(16000)
        .audioChannels(1)
        .format("wav")
        .on("end", () => {
          const sizeMB = (fs.statSync(chunkFile).size / (1024 * 1024)).toFixed(2);
          console.log(`   ✅ Chunk ${i + 1}/${totalChunks} creado (${sizeMB} MB)`);
          resolve();
        })
        .on("error", (err) => {
          console.error(`❌ Error creando chunk ${i + 1}:`, err.message);
          reject(err);
        })
        .save(chunkFile);
    });
  }

  // Paso 3: Transcribir cada chunk con Groq API
  console.log("\n🧠 Transcribiendo chunks con Groq (whisper-large-v3-turbo)...");
  const allWords = [];

  for (const { file, startSec, index } of chunkFiles) {
    const chunkOffsetMs = startSec * 1000;
    console.log(
      `   📤 Enviando chunk ${index + 1}/${totalChunks} a Groq...`
    );

    try {
      const result = await transcribeChunkWithGroq(file);
      const words = extractWordsFromGroqResponse(result, chunkOffsetMs);
      allWords.push(...words);
      console.log(`   ✅ Chunk ${index + 1}: ${words.length} palabras transcritas`);
    } catch (err) {
      console.error(`   ❌ Error en chunk ${index + 1}:`, err.message);
      throw err;
    }
  }

  // Paso 4: Ordenar y guardar JSON unificado
  allWords.sort((a, b) => a.start - b.start);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allWords, null, 2), "utf-8");

  console.log(`\n✅ Transcripción completa: ${allWords.length} palabras`);
  console.log(`   Guardado en: ${OUTPUT_FILE}`);
  console.log("   Siguiente paso: node scripts/3-render-30-clips.js");

  // Limpiar chunks temporales
  for (const { file } of chunkFiles) {
    try { fs.unlinkSync(file); } catch (_) {}
  }
  try { fs.rmdirSync(CHUNKS_DIR); } catch (_) {}
}

/**
 * Obtener duración de un archivo WAV en segundos.
 * WAV PCM 16kHz mono 16-bit = 32000 bytes/segundo.
 * Calculado desde el tamaño del archivo para evitar depender de ffprobe
 * (que en la versión instalada es muy antiguo).
 */
function getAudioDuration(filePath) {
  const stats = fs.statSync(filePath);
  const bytesPerSecond = 16000 * 2; // 16kHz * 2 bytes (16-bit mono)
  const wavHeader = 44; // encabezado WAV aproximado
  return Math.max(1, (stats.size - wavHeader) / bytesPerSecond);
}

/**
 * Transcribir un chunk de audio con la API de Groq
 */
async function transcribeChunkWithGroq(chunkFilePath) {
  const formData = new FormData();
  // Node.js nativo (undici) requiere Blob, no ReadStream
  const fileBuffer = fs.readFileSync(chunkFilePath);
  const fileBlob = new Blob([fileBuffer], { type: "audio/wav" });

  formData.append("file", fileBlob, "audio.wav");
  formData.append("model", GROQ_MODEL);
  formData.append("language", "es");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "word");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Extraer palabras con timestamps de la respuesta de Groq
 * y ajustar los tiempos con el offset del chunk
 */
function extractWordsFromGroqResponse(groqResponse, offsetMs) {
  const words = [];

  // Groq verbose_json con timestamp_granularities: ["word"] devuelve
  // un array de palabras en groqResponse.words
  const wordList = groqResponse.words || [];

  for (const w of wordList) {
    const text = (w.word || "").trim();
    // Groq devuelve start/end en segundos
    const startSec = w.start || 0;
    const endSec = w.end || 0;
    const startMs = Math.round(startSec * 1000) + offsetMs;
    const endMs = Math.round(endSec * 1000) + offsetMs;

    if (text) {
      words.push({ word: text, start: startMs, end: endMs });
    }
  }

  return words;
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
