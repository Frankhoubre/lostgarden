import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PRESS_DIR = path.join(ROOT, "public/press");
const LOGO_SRC = path.join(ROOT, "public/images/logo-lost-garden.png");

const EPISODE = {
  youtube: "https://youtu.be/eZ_JlaLDJ-8",
  tiktok: "https://www.tiktok.com/@frankhoubre/video/7647885636711501088",
  site: "https://lostgarden.world",
  press: "https://lostgarden.world/fr/press",
  contact: "frank.houbre@gmail.com",
};

const HD_STILLS = [
  "forest-machines.png",
  "lanterne-portrait.png",
  "rose-capsule.png",
  "tavern-knights.png",
];

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf8"));
}

function writeText(filename, content) {
  const target = path.join(PRESS_DIR, filename);
  fs.writeFileSync(target, content, "utf8");
  console.log(`wrote ${filename}`);
}

function ensurePressDir() {
  fs.mkdirSync(PRESS_DIR, { recursive: true });
}

function copyLogo() {
  fs.copyFileSync(LOGO_SRC, path.join(PRESS_DIR, "lost-garden-logo.png"));
  console.log("wrote lost-garden-logo.png");
}

function buildEpisodeLinks() {
  const content = `Lost Garden — Episode & project links
Updated: June 2026

Episode One (YouTube)
${EPISODE.youtube}

Episode One (TikTok)
${EPISODE.tiktok}

Official website
${EPISODE.site}

Press kit
${EPISODE.press}

Press contact
${EPISODE.contact}

Creator social
Instagram: https://www.instagram.com/frank.houbre
YouTube: https://www.youtube.com/@businessdynamite
TikTok: https://www.tiktok.com/@frankhoubre
`;
  writeText("lost-garden-episode-links.txt", content);
}

function buildPressRelease(locale, filename) {
  const dict = readJson(`messages/${locale}.json`);
  const pr = dict.press.pressRelease;
  const content = `${pr.headline}

${pr.dateline}

${pr.paragraphs.join("\n\n")}

"${pr.quote}"
— Frank Houbre

---
Press kit: ${EPISODE.press}
Contact: ${EPISODE.contact}
`;
  writeText(filename, content);
}

function buildSummary() {
  const fr = readJson("messages/fr.json").press;
  const content = `Lost Garden — Résumé court du projet
June 2026

Lost Garden est une série animée dark fantasy indépendante créée par Frank Houbre, produite en solo avec un workflow assisté par IA.

Points clés
• Format : épisode 1 complet, ~17 minutes
• Production : 1 créateur, écriture, direction artistique et montage par Frank Houbre
• Genre : dark fantasy, monde souterrain
• Angle : studio d'une seule personne, animation indépendante assistée par IA
• Réception : 65 000+ vues, 9 000+ likes TikTok, 430+ commentaires publics en quelques jours

Synopsis (épisode 1)
${fr.episode.synopsis}

Liens
YouTube: ${EPISODE.youtube}
TikTok: ${EPISODE.tiktok}
Press kit: ${EPISODE.press}
Contact: ${EPISODE.contact}
`;
  writeText("lost-garden-project-summary.txt", content);
}

function buildAudienceComments() {
  const comments = readJson("messages/fr.json").press.audience.comments;
  const lines = comments.map(
    (item, index) => `${index + 1}. ${item.author}\n"${item.text}"\n`,
  );
  const content = `Lost Garden — Sélection de commentaires publics (TikTok)
Source: @frankhoubre · June 2026
Positive audience reactions, curated for press use.

${lines.join("\n")}
---
Full reactions on press kit: ${EPISODE.press}#audience
`;
  writeText("lost-garden-audience-comments.txt", content);
}

function zipFiles(outputName, files, cwd = PRESS_DIR) {
  const existing = files.filter((file) => fs.existsSync(path.join(cwd, file)));
  if (existing.length === 0) {
    console.warn(`skip zip ${outputName}: no files`);
    return;
  }
  const zipPath = path.join(cwd, outputName);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  execSync(`zip -j "${zipPath}" ${existing.map((f) => `"${f}"`).join(" ")}`, {
    cwd,
    stdio: "inherit",
  });
  console.log(`wrote ${outputName}`);
}

function buildZips() {
  zipFiles("lost-garden-hd-images.zip", HD_STILLS);

  zipFiles("lost-garden-press-kit.zip", [
    "lost-garden-press-release.fr.txt",
    "lost-garden-press-release.en.txt",
    "lost-garden-project-summary.txt",
    "lost-garden-episode-links.txt",
    "lost-garden-audience-comments.txt",
    "lost-garden-logo.png",
    "frank-houbre-portrait.png",
    ...HD_STILLS,
  ]);
}

function main() {
  ensurePressDir();
  copyLogo();
  buildEpisodeLinks();
  buildPressRelease("fr", "lost-garden-press-release.fr.txt");
  buildPressRelease("en", "lost-garden-press-release.en.txt");
  buildSummary();
  buildAudienceComments();
  buildZips();
}

main();
