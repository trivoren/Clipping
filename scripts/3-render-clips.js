/**
 * 3-render-clips.js (EL SCRIPT MAESTRO)
 *
 * Lee data/transcripts/transcripcion.json, agrupa palabras en bloques
 * de 30-60 segundos, selecciona los 50 mejores bloques (priorizando
 * palabras clave de True Crime) y renderiza cada clip usando
 * la composición AutoClip de Remotion.
 *
 * Salida: out/clips_finales/clip_01.mp4 ... clip_50.mp4
 */

const fs = require("fs");
const path = require("path");
const { renderMedia, getCompositions } = require("@remotion/renderer");

const TRANSCRIPT_FILE = path.resolve("data/transcripts/transcripcion.json");
const OUTPUT_DIR = path.resolve("out/clips_finales");
const CLIPS_COUNT = 50;
const MIN_BLOCK_SEC = 30;
const MAX_BLOCK_SEC = 60;
const CONCURRENCY = 4;

// Palabras clave de True Crime para priorizar bloques
const KEYWORDS = [
  "muerte",
  "asesinato",
  "crimen",
  "policía",
  "policia",
  "miedo",
  "secreto",
  "nunca",
  "sangre",
  "asesino",
  "víctima",
  "víctima",
  "detective",
  "prisión",
  "cárcel",
  "juicio",
  "condena",
  "investigación",
  "misterio",
  "oscuridad",
  "noche",
  "sombra",
  "silencio",
  "grito",
  "llanto",
  "suplico",
  "perdón",
  "venganza",
];

if (!fs.existsSync(TRANSCRIPT_FILE)) {
  console.error(
    `❌ No se encontró ${TRANSCRIPT_FILE}.\n` +
    "   Ejecuta primero: node scripts/1-extract-audio.js && node scripts/2-transcribe.js"
  );
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const allWords = JSON.parse(fs.readFileSync(TRANSCRIPT_FILE, "utf-8"));

if (!Array.isArray(allWords) || allWords.length === 0) {
  console.error("❌ El archivo de transcripción está vacío o no es un array.");
  process.exit(1);
}

// ---------------------------------------------------------------
// Agrupar palabras en bloques lógicos de 30-60 segundos
// ---------------------------------------------------------------
function groupIntoBlocks(words, minSec, maxSec) {
  const blocks = [];
  let currentBlock = [];
  let blockStartMs = words[0].start;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    currentBlock.push(w);

    const blockDurationSec = (w.end - blockStartMs) / 1000;
    const isNextWordAvailable = i + 1 < words.length;
    const nextStartMs = isNextWordAvailable ? words[i + 1].start : w.end;
    const nextDurationSec = (nextStartMs - blockStartMs) / 1000;

    // Cerrar bloque si alcanzamos el máximo o si estamos cerca del mínimo
    // y la siguiente palabra superaría el máximo
    const shouldClose =
      blockDurationSec >= maxSec ||
      (blockDurationSec >= minSec &&
        (!isNextWordAvailable || nextDurationSec > maxSec));

    if (shouldClose) {
      blocks.push({
        startMs: blockStartMs,
        endMs: w.end,
        words: [...currentBlock],
      });
      currentBlock = [];
      if (isNextWordAvailable) {
        blockStartMs = words[i + 1].start;
      }
    }
  }

  // Agregar el bloque restante si hay palabras sobrantes
  if (currentBlock.length > 0) {
    blocks.push({
      startMs: blockStartMs,
      endMs: currentBlock[currentBlock.length - 1].end,
      words: currentBlock,
    });
  }

  return blocks;
}

// ---------------------------------------------------------------
// Puntuación de bloque: priorizar palabras clave de True Crime
// ---------------------------------------------------------------
function scoreBlock(block) {
  const text = block.words.map((w) => w.word).join(" ").toLowerCase();
  let score = block.words.length; // más palabras = más contexto

  for (const kw of KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      score += matches.length * 5; // bonus por cada palabra clave
    }
  }

  return score;
}

const blocks = groupIntoBlocks(allWords, MIN_BLOCK_SEC, MAX_BLOCK_SEC);

// Filtrar bloques muy cortos (< 20s) y ordenar por puntuación descendente
const validBlocks = blocks.filter((b) => (b.endMs - b.startMs) / 1000 >= 20);
validBlocks.sort((a, b) => scoreBlock(b) - scoreBlock(a));

// Seleccionar los 50 mejores bloques
const selectedBlocks = validBlocks.slice(0, CLIPS_COUNT);

console.log(`📊 Bloques totales detectados: ${blocks.length}`);
console.log(`🎯 Bloques válidos (>=20s): ${validBlocks.length}`);
console.log(`🎬 Clips a renderizar: ${selectedBlocks.length}`);

// ---------------------------------------------------------------
// Convertir captions al formato de AutoClipProps
// ---------------------------------------------------------------
function buildCaptions(blockWords, blockStartMs) {
  return blockWords.map((w) => ({
    text: w.word,
    startMs: w.start - blockStartMs, // relativo al inicio del clip
    endMs: w.end - blockStartMs,
    timestampMs: w.start - blockStartMs,
    confidence: 1.0,
  }));
}

// ---------------------------------------------------------------
// Renderizar un clip individual con Remotion
// ---------------------------------------------------------------
async function renderSingleClip(index, block) {
  const clipNumber = String(index + 1).padStart(2, "0");
  const outputFile = path.join(OUTPUT_DIR, `clip_${clipNumber}.mp4`);
  const startSec = block.startMs / 1000;
  const endSec = block.endMs / 1000;
  const durationSec = endSec - startSec;
  const fps = 30;

  // Obtener la composición AutoClip registrada
  const compositions = await getCompositions({
    entryPoint: path.resolve("./src/index.ts"),
  });

  const autoClipComp = compositions.find((c) => c.id === "AutoClip");

  if (!autoClipComp) {
    throw new Error(
      "❌ No se encontró la composición 'AutoClip' en src/index.ts"
    );
  }

  const captions = buildCaptions(block.words, block.startMs);

  const inputProps = {
    videoSrc: path.resolve("public/clips/test.mp4"), // se sobrescribe abajo si hay video fuente
    startTime: Math.round(startSec * fps), // en frames
    endTime: Math.round(endSec * fps), // en frames
    captions,
  };

  // Usar el primer video .mp4 de source_videos como fuente si existe
  const sourceDir = path.resolve("public/source_videos");
  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir);
    const mp4 = files.find((f) => f.toLowerCase().endsWith(".mp4"));
    if (mp4) {
      inputProps.videoSrc = path.resolve(sourceDir, mp4);
    }
  }

  console.log(
    `🎬 [${index + 1}/${selectedBlocks.length}] Renderizando clip_${clipNumber}.mp4 ...`
  );

  await renderMedia({
    composition: autoClipComp,
    serveUrl: new URL("http://localhost:3000"),
    codec: "h264",
    crf: 18,
    concurrency: CONCURRENCY,
    frameRate: fps,
    inputProps,
    output: outputFile,
    fromFrame: Math.round(startSec * fps),
    toFrame: Math.round(endSec * fps),
    imageFormat: "jpeg",
    encodeOptions: {
      crf: 18,
      preset: "slow",
    },
  });

  console.log(`   ✅ Guardado: ${outputFile} (${durationSec.toFixed(1)}s)`);
  return outputFile;
}

// ---------------------------------------------------------------
// Bucle principal de renderizado (con concurrencia limitada)
// ---------------------------------------------------------------
async function main() {
  console.log("\n🚀 Iniciando renderizado en lote...");
  console.log(`   Concurrencia: ${CONCURRENCY} clips simultáneos`);
  console.log(`   Códec: h264, CRF: 18`);

  const results = [];
  const errors = [];

  // Procesar en lotes de CONCURRENCY
  for (let i = 0; i < selectedBlocks.length; i += CONCURRENCY) {
    const batch = selectedBlocks.slice(i, i + CONCURRENCY);
    const batchPromises = batch.map((block, idx) =>
      renderSingleClip(i + idx, block).then(
        (file) => results.push(file),
        (err) => {
          console.error("   ❌ Error en clip:", err.message);
          errors.push(err);
        }
      )
    );

    await Promise.all(batchPromises);
  }

  console.log("\n==============================================");
  console.log(`✅ Renderizado completado: ${results.length}/${selectedBlocks.length} clips`);
  if (errors.length > 0) {
    console.error(`❌ Errores: ${errors.length}`);
  }
  console.log(`📂 Clips guardados en: ${OUTPUT_DIR}`);
  console.log("==============================================\n");

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
