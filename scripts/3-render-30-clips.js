/**
 * 3-render-30-clips.js (EL SCRIPT MAESTRO - MODO DIOS)
 *
 * Lee data/transcripts/transcripcion.json, selecciona los 30 bloques más
 * dramáticos (True Crime) y renderiza cada clip con calidad cinematográfica
 * usando renderMedia de @remotion/renderer.
 *
 * Salida: out/clips_finales/clip_01.mp4 ... clip_30.mp4
 *
 * Genera el bundle de webpack con `remotion bundle` y usa
 * webpackOutputDirectory para evitar depender de getCompositions() con serveUrl.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { renderMedia, getCompositions } = require("@remotion/renderer");
const http = require("http");

const TRANSCRIPT_FILE = path.resolve("data/transcripts/transcripcion.json");
const OUTPUT_DIR = path.resolve("out/clips_finales");
const BUILD_DIR = path.resolve("build");
const CLIPS_COUNT = 30;
const MIN_BLOCK_SEC = 30;
const MAX_BLOCK_SEC = 45;
const CONCURRENCY = 4;
const FPS = 30;
const PREVIEW_PORT = 3000;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;

// Palabras clave de True Crime para priorizar bloques dramáticos
const KEYWORDS = [
  "muerte",
  "asesinato",
  "crimen",
  "policía",
  "policia",
  "hija",
  "llorar",
  "secreto",
  "cárcel",
  "carcel",
  "miedo",
  "sangre",
  "asesino",
  "víctima",
  "detective",
  "prisión",
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
  "venganza",
];

let previewProcess = null;

/**
 * Iniciar remotion preview en background
 */
function startPreviewServer() {
  return new Promise((resolve, reject) => {
    console.log("🖥️  Iniciando servidor de preview de Remotion (puerto 3000)...");

    const isWindows = process.platform === "win32";

    previewProcess = spawn(
      isWindows ? "cmd" : "npx",
      isWindows
        ? ["/c", "npx", "remotion", "preview", "--port", String(PREVIEW_PORT)]
        : ["remotion", "preview", "--port", String(PREVIEW_PORT)],
      {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: process.cwd(),
        env: { ...process.env, BROWSER: "none" },
      }
    );

    previewProcess.stdout.on("data", (data) => {
      const str = data.toString();
      if (str.includes("Server started") || str.includes("http://localhost")) {
        console.log("   ✅ Servidor de preview listo");
        resolve();
      }
    });

    previewProcess.stderr.on("data", (data) => {
      const str = data.toString();
      if (str.includes("Server started") || str.includes("http://localhost")) {
        console.log("   ✅ Servidor de preview listo");
        resolve();
      }
    });

    setTimeout(() => {
      resolve();
    }, 60000);

    previewProcess.on("error", (err) => {
      reject(new Error(`Error iniciando preview: ${err.message}`));
    });
  });
}

/**
 * Esperar a que el servidor de preview responda
 */
async function waitForPreviewServer(maxRetries = 30, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`${PREVIEW_URL}/`, (res) => {
          resolve();
        });
        req.on("error", reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error("timeout"));
        });
      });
      console.log("   ✅ Servidor de preview respondiendo");
      return;
    } catch (_) {
      process.stdout.write(
        `   Esperando servidor... (${i + 1}/${maxRetries})\r`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("El servidor de preview no respondió después de los reintentos");
}

/**
 * Detener el servidor de preview
 */
function stopPreviewServer() {
  if (previewProcess) {
    try {
      previewProcess.kill("SIGTERM");
      console.log("   🛑 Servidor de preview detenido");
    } catch (_) {}
  }
}

// ---------------------------------------------------------------
// Validar archivo de transcripción
// ---------------------------------------------------------------
if (!fs.existsSync(TRANSCRIPT_FILE)) {
  console.error(
    `❌ No se encontró ${TRANSCRIPT_FILE}.\n` +
    "   Ejecuta primero: node scripts/1-download.js && node scripts/2-transcribe.js"
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
// Agrupar palabras en bloques lógicos de 30-45 segundos
// ---------------------------------------------------------------
function groupIntoBlocks(words, minSec, maxSec) {
  const blocks = [];
  let currentBlock = [];
  let blockStartMs = words[0].start;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    currentBlock.push(w);

    const blockDurationSec = (w.end - blockStartMs) / 1000;
    const isNextAvailable = i + 1 < words.length;
    const nextStartMs = isNextAvailable ? words[i + 1].start : w.end;
    const nextDurationSec = (nextStartMs - blockStartMs) / 1000;

    const shouldClose =
      blockDurationSec >= maxSec ||
      (blockDurationSec >= minSec &&
        (!isNextAvailable || nextDurationSec > maxSec));

    if (shouldClose) {
      blocks.push({
        startMs: blockStartMs,
        endMs: w.end,
        words: [...currentBlock],
      });
      currentBlock = [];
      if (isNextAvailable) {
        blockStartMs = words[i + 1].start;
      }
    }
  }

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
// Puntuación: priorizar palabras clave de True Crime
// ---------------------------------------------------------------
function scoreBlock(block) {
  const text = block.words.map((w) => w.word).join(" ").toLowerCase();
  let score = block.words.length;

  for (const kw of KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      score += matches.length * 5;
    }
  }

  return score;
}

const blocks = groupIntoBlocks(allWords, MIN_BLOCK_SEC, MAX_BLOCK_SEC);
const validBlocks = blocks.filter((b) => (b.endMs - b.startMs) / 1000 >= 20);
validBlocks.sort((a, b) => scoreBlock(b) - scoreBlock(a));
const selectedBlocks = validBlocks.slice(0, CLIPS_COUNT);

console.log(`📊 Bloques totales detectados: ${blocks.length}`);
console.log(`🎯 Bloques válidos (>=20s): ${validBlocks.length}`);
console.log(`🎬 Clips a renderizar: ${selectedBlocks.length}`);

// ---------------------------------------------------------------
// Construir captions en formato AutoClipProps (ms relativo al clip)
// ---------------------------------------------------------------
function buildCaptions(blockWords, blockStartMs) {
  return blockWords.map((w) => ({
    text: w.word,
    startMs: w.start - blockStartMs,
    endMs: w.end - blockStartMs,
    timestampMs: w.start - blockStartMs,
    confidence: 1.0,
  }));
}

// ---------------------------------------------------------------
// Renderizar un clip individual
// ---------------------------------------------------------------
async function renderSingleClip(index, block) {
  const clipNumber = String(index + 1).padStart(2, "0");
  const outputFile = path.join(OUTPUT_DIR, `clip_${clipNumber}.mp4`);
  const startSec = block.startMs / 1000;
  const endSec = block.endMs / 1000;
  const durationSec = endSec - startSec;

  const compositions = await getCompositions({
    entryPoint: path.resolve("./src/index.ts"),
    webpackOutputDirectory: BUILD_DIR,
    serveUrl: new URL(PREVIEW_URL),
  });

  const autoClipComp = compositions.find((c) => c.id === "AutoClip");

  if (!autoClipComp) {
    throw new Error(
      "❌ No se encontró la composición 'AutoClip' en src/index.ts"
    );
  }

  const captions = buildCaptions(block.words, block.startMs);

  // Buscar video fuente
  let videoSrc = path.resolve("public/source_videos/podcast_malambo.mp4");
  if (!fs.existsSync(videoSrc)) {
    const altDir = path.resolve("public/source_videos");
    if (fs.existsSync(altDir)) {
      const files = fs.readdirSync(altDir);
      const mp4 = files.find((f) => f.toLowerCase().endsWith(".mp4"));
      if (mp4) {
        videoSrc = path.resolve(altDir, mp4);
      }
    }
  }

  const inputProps = {
    videoSrc,
    startTime: Math.round(startSec * FPS),
    endTime: Math.round(endSec * FPS),
    captions,
  };

  console.log(
    `🎬 [${index + 1}/${selectedBlocks.length}] Renderizando clip_${clipNumber}.mp4 ...`
  );
  console.log(`   Tiempo: ${startSec.toFixed(1)}s - ${endSec.toFixed(1)}s (${durationSec.toFixed(1)}s)`);

  await renderMedia({
    composition: autoClipComp,
    serveUrl: new URL(PREVIEW_URL),
    webpackOutputDirectory: BUILD_DIR,
    codec: "h264",
    crf: 16,
    concurrency: CONCURRENCY,
    frameRate: FPS,
    inputProps,
    output: outputFile,
    fromFrame: Math.round(startSec * FPS),
    toFrame: Math.round(endSec * FPS),
    imageFormat: "jpeg",
    encodeOptions: {
      crf: 16,
      preset: "slow",
    },
  });

  console.log(`   ✅ Guardado: ${outputFile}`);
  return outputFile;
}

// ---------------------------------------------------------------
// Generar bundle de webpack con remotion bundle
// ---------------------------------------------------------------
async function generateWebpackBundle() {
  return new Promise((resolve, reject) => {
    console.log("📦 Generando bundle de webpack con remotion bundle...");
    const isWindows = process.platform === "win32";

    const bundleProcess = spawn(
      isWindows ? "cmd" : "npx",
      isWindows
        ? [
            "/c",
            "npx",
            "remotion",
            "bundle",
            "./src/index.ts",
            "--output-directory",
            BUILD_DIR,
          ]
        : [
            "remotion",
            "bundle",
            "./src/index.ts",
            "--output-directory",
            BUILD_DIR,
          ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: process.cwd(),
        env: { ...process.env, BROWSER: "none" },
      }
    );

    let stderr = "";
    bundleProcess.stdout.on("data", (data) => {
      const str = data.toString();
      if (str.includes("Bundle complete") || str.includes("written to")) {
        console.log("   ✅ Bundle generado");
        resolve();
      }
    });

    bundleProcess.stderr.on("data", (data) => {
      stderr += data.toString();
      if (stderr.includes("Bundle complete") || stderr.includes("written to")) {
        console.log("   ✅ Bundle generado");
        resolve();
      }
    });

    bundleProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`remotion bundle falló con código ${code}: ${stderr}`));
      }
    });

    bundleProcess.on("error", (err) => {
      reject(new Error(`Error ejecutando remotion bundle: ${err.message}`));
    });

    setTimeout(() => {
      resolve();
    }, 120000);
  });
}

// ---------------------------------------------------------------
// Bucle principal
// ---------------------------------------------------------------
async function main() {
  try {
    console.log("\n🚀 Iniciando renderizado cinematográfico de 30 clips...");
    console.log(`   Concurrencia: ${CONCURRENCY} clips simultáneos`);
    console.log(`   Códec: h264, CRF: 16 (calidad extrema)`);
    console.log(`   Duración por clip: ${MIN_BLOCK_SEC}-${MAX_BLOCK_SEC} segundos\n`);

    // Generar bundle de webpack
    await generateWebpackBundle();

    // Iniciar servidor de preview de Remotion
    await startPreviewServer();
    await waitForPreviewServer();

    const results = [];
    const errors = [];

    for (let i = 0; i < selectedBlocks.length; i += CONCURRENCY) {
      const batch = selectedBlocks.slice(i, i + CONCURRENCY);
      const batchPromises = batch.map((block, idx) =>
        renderSingleClip(i + idx, block).then(
          (file) => results.push(file),
          (err) => {
            console.error(`   ❌ Error en clip ${i + idx + 1}:`, err.message);
            errors.push(err);
          }
        )
      );

      await Promise.all(batchPromises);
    }

    console.log("\n==========================================================");
    console.log(
      `✅ Renderizado completado: ${results.length}/${selectedBlocks.length} clips`
    );
    if (errors.length > 0) {
      console.error(`❌ Errores: ${errors.length}`);
    }
    console.log(`📂 Clips guardados en: ${OUTPUT_DIR}`);
    console.log("==========================================================\n");

    process.exit(errors.length > 0 ? 1 : 0);
  } finally {
    stopPreviewServer();
  }
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  stopPreviewServer();
  process.exit(1);
});
