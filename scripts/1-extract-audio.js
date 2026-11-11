/**
 * 1-extract-audio.js
 * Extrae el audio del primer video .mp4 encontrado en public/source_videos/
 * y lo guarda como audio_temp.wav en la raíz del proyecto.
 * Usa ffmpeg a través de fluent-ffmpeg + @ffmpeg-installer/ffmpeg.
 */

const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const SOURCE_DIR = path.resolve("public/source_videos");
const OUTPUT_FILE = path.resolve("audio_temp.wav");

function findFirstMp4(dir) {
  if (!fs.existsSync(dir)) {
    return null;
  }
  const files = fs.readdirSync(dir);
  const mp4 = files.find((f) => f.toLowerCase().endsWith(".mp4"));
  return mp4 ? path.join(dir, mp4) : null;
}

const inputVideo = findFirstMp4(SOURCE_DIR);

if (!inputVideo) {
  console.error(
    "❌ No se encontró ningún video .mp4 en public/source_videos/.\n" +
    "   Coloca tu video largo ahí y vuelve a ejecutar este script."
  );
  process.exit(1);
}

console.log(`📥 Video fuente encontrado: ${inputVideo}`);
console.log("🎧 Extrayendo audio a audio_temp.wav...");

ffmpeg(inputVideo)
  .noVideo()
  .audioCodec("pcm_s16le")
  .audioFrequency(16000)
  .audioChannels(1)
  .format("wav")
  .on("start", (commandLine) => {
    console.log(`   Ejecutando: ${commandLine}`);
  })
  .on("progress", (progress) => {
    process.stdout.write(
      `   Procesando... ${Math.round(progress.percent || 0)}%\r`
    );
  })
  .on("end", () => {
    console.log("\n✅ Audio extraído correctamente: audio_temp.wav");
    console.log("   Siguiente paso: node scripts/2-transcribe.js");
  })
  .on("error", (err) => {
    console.error("\n❌ Error extrayendo audio:", err.message);
    process.exit(1);
  })
  .save(OUTPUT_FILE);
