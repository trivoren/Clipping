/**
 * 1-download.js
 * Descarga un video de YouTube en máxima calidad MP4 usando yt-dlp-exec
 * y lo guarda en public/source_videos/podcast_malambo.mp4
 */

const ytDlp = require("yt-dlp-exec");
const fs = require("fs");
const path = require("path");

const YOUTUBE_URL = "https://www.youtube.com/watch?v=NMHxG-mt3J4";
const OUTPUT_DIR = path.resolve("public/source_videos");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "podcast_malambo.mp4");

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (fs.existsSync(OUTPUT_FILE)) {
    console.log(`✅ El video ya existe: ${OUTPUT_FILE}`);
    console.log("   Siguiente paso: node scripts/2-transcribe.js");
    return;
  }

  console.log("📥 Descargando video de YouTube en máxima calidad...");
  console.log(`   URL: ${YOUTUBE_URL}`);
  console.log(`   Destino: ${OUTPUT_FILE}`);

  try {
    await ytDlp(YOUTUBE_URL, {
      output: OUTPUT_FILE,
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      mergeOutputFormat: "mp4",
      quiet: false,
      noWarnings: true,
      extractorArgs: "youtube:player_client=android",
    });

    console.log(`\n✅ Video descargado correctamente: ${OUTPUT_FILE}`);
    const stats = fs.statSync(OUTPUT_FILE);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   Tamaño: ${sizeMB} MB`);
    console.log("   Siguiente paso: node scripts/2-transcribe.js");
  } catch (err) {
    console.error("❌ Error descargando el video:", err.message);
    process.exit(1);
  }
}

main();
