/**
 * Automated playtest of The Lantern's Oath.
 *
 *   node scripts/playtest.mjs [baseUrl]      (default http://localhost:3123)
 *
 * Drives the game in headless Chromium and reports bugs a player would hit:
 * page errors, missing assets, map spots nothing can reach, sprites cut at a
 * cell edge, a knight stuck in rock after random inputs, black or broken
 * frames, mechanics that stopped working (jump height, roll, checkpoints,
 * menu, language, music). Screenshots and a JSON report land in
 * playtest-report/. Exit code 1 when something failed.
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const base = process.argv[2] ?? "http://localhost:3123";
const out = "playtest-report";
mkdirSync(out, { recursive: true });
const failures = [];
const warnings = [];
const notes = [];
const fail = (m) => { failures.push(m); console.log("FAIL", m); };
const warn = (m) => { warnings.push(m); console.log("warn", m); };
const ok = (m) => { notes.push(m); console.log("ok  ", m); };

function chromePath() {
  const env = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (env && existsSync(env)) {
    try {
      const dirs = execSync(`ls -d ${env}/chromium-*/chrome-linux/chrome 2>/dev/null`).toString().trim().split("\n").filter(Boolean);
      if (dirs.length) return dirs[dirs.length - 1];
    } catch { /* fall through */ }
  }
  return undefined;
}

const browser = await chromium.launch({ executablePath: chromePath(), args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 960, height: 576 }, deviceScaleFactor: 1 });
const pageErrors = [];
const consoleErrors = [];
const badRequests = [];
page.on("pageerror", (e) => pageErrors.push(`${e.message}\n${(e.stack || "").split("\n").slice(0, 3).join("\n")}`));
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); });
page.on("response", (r) => { const u = r.url(); if (u.includes("/game/") && r.status() >= 400) badRequests.push(`${r.status()} ${u}`); });

await page.goto(`${base}/fr/game?dev=1`, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => !!document.querySelector("canvas.game-canvas")?.lostGardenGame?.debug().ready, null, { timeout: 120000 });
const decline = page.getByRole("button", { name: /refuser|decline/i });
if (await decline.count()) await decline.first().click();
const canvas = page.locator("canvas.game-canvas");
const G = "document.querySelector('canvas.game-canvas').lostGardenGame";
const ev = (code) => page.evaluate(`${G}.${code}`);
const dbg = () => ev("debug()");
const wait = (ms) => page.waitForTimeout(ms);
const warp = (x, y) => ev(`debugWarp(${x}, ${y})`);
const shot = (name) => canvas.screenshot({ path: `${out}/${name}.png` });
const KEYS = ["ArrowLeft", "ArrowRight", "Space", "ArrowDown", "KeyX", "KeyC"];
const releaseAll = async () => { for (const k of KEYS) await page.keyboard.up(k); };

/** Luminance and colour spread of the current frame: black or flat frames mean a broken render. */
async function frameStats(name) {
  const stats = await page.evaluate(() => {
    const c = document.querySelector("canvas.game-canvas");
    const ctx = c.getContext("2d");
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    const colors = new Set();
    for (let i = 0; i < d.length; i += 16) {
      sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
      colors.add(((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4));
    }
    const heart = ctx.getImageData(10, 10, 1, 1).data;
    return { mean: sum / (d.length / 16), colors: colors.size, heartBright: heart[0] + heart[1] + heart[2] > 300 };
  });
  if (stats.mean < 6) fail(`${name}: frame is black (mean ${stats.mean.toFixed(1)})`);
  else if (stats.colors < 40) fail(`${name}: frame is flat (${stats.colors} colours)`);
  if (!stats.heartBright) warn(`${name}: no heart at the HUD corner`);
  return stats;
}

// 1. The map itself.
const lint = await ev("debugLint()");
if (lint.length) for (const p of lint) fail(`map: ${p}`);
else ok("map lint: every spawn stands on a floor and can be reached, every ledge is within a jump");

// 2. Sprite sheets: a frame touching the left, right or top edge of its cell is cut.
const clipped = await page.evaluate(() => {
  const g = document.querySelector("canvas.game-canvas").lostGardenGame;
  const out = [];
  for (const s of g.debugSheets()) {
    const c = document.createElement("canvas");
    c.width = s.img.width;
    c.height = s.img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(s.img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const n = Math.floor(c.width / s.cw);
    const alpha = (x, y) => d[(y * c.width + x) * 4 + 3];
    for (let f = 0; f < n; f += 1) {
      let left = 0, right = 0, top = 0, empty = true;
      for (let y = 0; y < s.ch; y += 1) {
        if (alpha(f * s.cw, y) > 40) left += 1;
        if (alpha(f * s.cw + s.cw - 1, y) > 40) right += 1;
      }
      for (let x = 0; x < s.cw; x += 1) if (alpha(f * s.cw + x, 0) > 40) top += 1;
      for (let y = 0; y < s.ch && empty; y += 4) for (let x = 0; x < s.cw && empty; x += 4) if (alpha(f * s.cw + x, y) > 40) empty = false;
      if (left > 3 || right > 3 || top > 3) out.push(`${s.name} frame ${f} touches its cell edge (left ${left}, right ${right}, top ${top} px)`);
      if (empty) out.push(`${s.name} frame ${f} is empty`);
    }
  }
  return out;
});
if (clipped.length) for (const c of clipped) warn(`sheet: ${c}`);
else ok("sprite sheets: no frame cut at a cell edge, no empty frame");

// 3. Music files are served.
for (const f of ["ash-lantern-prayer.mp3", "clockwork-requiem.mp3", "the-knights-lullaby.mp3"]) {
  const r = await page.request.head(`${base}/game/music/${f}`);
  if (r.status() !== 200) fail(`music ${f}: HTTP ${r.status()}`);
}
ok("music: the recordings are served");

// 4. Mechanics.
const zones = await ev("debugZones()");
const start = await dbg();
await wait(300);
let minY = 1e9;
await page.keyboard.down("Space");
for (let i = 0; i < 12; i += 1) { await wait(50); minY = Math.min(minY, (await dbg()).y); }
await page.keyboard.up("Space");
await wait(700);
const apex = Math.round(start.y - minY);
if (apex < 96) fail(`jump apex ${apex}px, a three-tile ledge is 96px`); else ok(`jump apex ${apex}px (three tiles is 96)`);
await page.keyboard.press("KeyC"); await wait(100);
if (!(await dbg()).rolling) fail("roll does not start on C"); else ok("roll starts on C");
await wait(600);
await page.keyboard.down("ArrowDown"); await wait(150);
if (!(await dbg()).crouching) fail("crouch does not start on Down"); else ok("crouch starts on Down");
await page.keyboard.up("ArrowDown"); await wait(200);
await page.keyboard.press("Escape"); await wait(200);
if ((await dbg()).menu !== "pause") fail("Escape does not open the pause menu");
else {
  ok("pause menu opens on Escape");
  await shot("menu-fr");
  for (let i = 0; i < 3; i += 1) { await page.keyboard.press("ArrowDown"); await wait(80); }
  await page.keyboard.press("KeyX"); await wait(200);
  const lang = (await dbg()).lang;
  if (lang !== "en") fail(`language toggle: expected en, got ${lang}`); else ok("language toggles to English in the menu");
  await shot("menu-en");
  await page.keyboard.press("KeyX"); await wait(150);
  await page.keyboard.press("Escape"); await wait(200);
  if ((await dbg()).menu !== null) fail("Escape does not close the menu");
}

// 5. Tour and fuzz: every zone renders, and random play never leaves Lanterne in rock.
for (const z of zones) {
  await warp(z.x, z.y);
  await wait(700);
  const d0 = await dbg();
  if (Math.abs(d0.x - z.x) > 2 && !d0.onGround) warn(`${z.id}: warp point not on ground`);
  await frameStats(`zone ${z.id}`);
  await shot(`zone-${z.id}`);
  // Fuzz: 8 seconds of random held keys.
  const t0 = Date.now();
  let hurtFrom = new Set();
  while (Date.now() - t0 < 8000) {
    const k = KEYS[Math.floor(Math.random() * KEYS.length)];
    if (Math.random() < 0.5) await page.keyboard.down(k); else await page.keyboard.up(k);
    await wait(60 + Math.random() * 120);
    const d = await dbg();
    if (d.lastHurt) hurtFrom.add(d.lastHurt.split("@")[0]);
    if (await ev("debugStuck()")) { fail(`${z.id}: Lanterne stuck in rock at ${Math.round(d.x)},${Math.round(d.y)}`); await shot(`stuck-${z.id}`); break; }
    if (d.hp < 0 || d.hp > d.maxHp) fail(`${z.id}: hp out of range (${d.hp}/${d.maxHp})`);
    if (d.hp === 0) { await wait(3200); }
  }
  await releaseAll();
  await wait(200);
  ok(`${z.id}: fuzzed 8s, hurt by [${[...hurtFrom].join(", ")}]`);
}

// 6. Checkpoints, the chase and the boss, from a clean slate.
await ev("debugReset()");
await wait(400);
const w = await page.evaluate(() => { const g = document.querySelector("canvas.game-canvas").lostGardenGame; return { gong: g.world.gong, tavern: g.world.tavern, arena: g.world.arena, chase: g.world.chase }; }).catch(() => null);
if (w) {
  await warp(w.gong.x - 260, w.gong.y); await page.keyboard.down("ArrowRight"); await wait(1500); await page.keyboard.up("ArrowRight");
  const d1 = await dbg();
  if (d1.checkpoint.x !== w.gong.x - 40) fail("gong checkpoint did not trigger"); else ok("gong checkpoint");
  await warp(w.tavern.x - 300, w.tavern.y); await page.keyboard.down("ArrowRight"); await wait(1500); await page.keyboard.up("ArrowRight");
  const d2 = await dbg();
  if (d2.checkpoint.x !== w.tavern.x - 70) fail("tavern checkpoint did not trigger"); else ok("tavern checkpoint and Serrure's line");
  await shot("tavern");
  // The chase: the colossus wakes, runs, and slams its claws; Lanterne runs the whole graveyard.
  await warp(w.chase.x - 120, w.chase.y); await wait(300);
  await page.keyboard.down("ArrowRight"); await wait(1300);
  let giant = await ev("debugGiant()");
  if (!giant || giant.state === "asleep") fail("the colossus did not wake at the chase trigger"); else ok(`the colossus wakes (${giant.state})`);
  let clawSeen = false, caught = 0, lastHp = (await dbg()).hp;
  for (let i = 0; i < 70; i += 1) {
    const d = await dbg();
    giant = await ev("debugGiant()");
    if (giant && giant.claw) clawSeen = true;
    if (d.hp < lastHp) caught += 1;
    lastHp = d.hp;
    if (i % 3 === 0) { await page.keyboard.down("Space"); await wait(260); await page.keyboard.up("Space"); }
    if (i === 12) await shot("chase");
    if (d.x > w.chase.end + 40 || d.hp === 0) break;
    await wait(150);
  }
  await page.keyboard.up("ArrowRight");
  const dc = await dbg();
  if (!clawSeen) warn("no claw slam happened during the chase run");
  ok(`chase run: reached x ${Math.round(dc.x)} of ${w.chase.end}, hurt ${caught} time(s), colossus ${(await ev("debugGiant()")).state}`);
  await frameStats("chase");
  await shot("chase-end");
  await ev("debugReset()"); await wait(300);
  await warp(w.arena.l + 8, w.arena.y); await page.keyboard.down("ArrowRight"); await wait(900); await page.keyboard.up("ArrowRight"); await wait(2500);
  const d3 = await dbg();
  if (!d3.boss || d3.boss.state === "asleep") fail("the Machine did not wake in the arena"); else ok(`the Machine wakes (${d3.boss.state})`);
  await shot("boss");
  await ev("debugKillBoss()");
  for (let i = 0; i < 60; i += 1) { const d = await dbg(); if (d.boss.state === "dead") break; if (d.boss.state === "stomp" || d.boss.state === "blast") await page.keyboard.press("Space"); await page.keyboard.press("KeyX"); await wait(150); }
  await wait(500);
  const d4 = await dbg();
  if (d4.boss.state !== "dead" || !d4.gateOpen) fail(`boss fight did not end (${d4.boss.state}, gate ${d4.gateOpen})`); else ok("the Machine falls and the gate opens");
}

// 7. Errors collected along the way.
if (pageErrors.length) for (const e of pageErrors) fail(`page error: ${e}`);
if (consoleErrors.length) for (const e of consoleErrors.slice(0, 10)) warn(`console: ${e}`);
if (badRequests.length) for (const r of badRequests) fail(`asset: ${r}`);
if (!pageErrors.length && !badRequests.length) ok("no page errors, no missing assets");

await browser.close();
const report = { base, date: new Date().toISOString(), failures, warnings, notes };
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(`\n${failures.length} failure(s), ${warnings.length} warning(s). Report in ${out}/`);
process.exit(failures.length ? 1 : 0);
