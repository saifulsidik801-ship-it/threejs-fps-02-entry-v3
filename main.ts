// main.ts — SALTPIER: Pier 9 (threejs-fps-02). Node 22, standard library only.
// Hands the game in: copies game/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json with the kit's vendored buildDossier library.
// Defensive by design (the EMBERLINE lesson): the output directory is a mount point on the
// grader, so its CONTENTS are cleared file by file and the directory itself is NEVER removed.
// Paths are script-dir relative (fileURLToPath), never CWD-relative. $MAKEFUN_OUTPUT_DIR
// stands in for /output outside the grader. Run twice: both runs write identical bytes.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-threejs.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
// Clear /output contents file by file; never remove /output itself (grader mount point).
for (const name of readdirSync(out)) {
  const target = join(out, name);
  rmSync(target, { recursive: true, force: true });
}
const inputDir = process.env.MAKEFUN_INPUT_DIR ?? here;
const gameSrc = join(inputDir, 'game');
const shotsSrc = join(inputDir, 'screenshots');
if (!existsSync(gameSrc) || !statSync(gameSrc).isDirectory()) throw new Error('game/ missing beside main.ts');
cpSync(gameSrc, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsSrc)) cpSync(shotsSrc, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the
// others refuse an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in game/ or 48 MiB of game files, in all: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, game_max_files: 993, game_max_bytes: 50331648 }),
);
