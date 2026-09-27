#!/usr/bin/env node
/**
 * Build the self-hosted (VPS / Docker) bundle for wolf_idea_pitch.
 *
 * `next build` with `output: "standalone"` + `distDir: "dist"` (see
 * next.config.ts) emits `dist/standalone/` — a traced `server.js` plus the only
 * `node_modules` files the server needs, so the target machine never runs
 * `npm install`. Next.js deliberately leaves `public/` and `<distDir>/static`
 * out of that folder; this script copies them in so the folder is directly
 * runnable, and can pack it into a tarball.
 *
 * Usage:
 *   npm run bundle                  build + assemble dist/standalone
 *   npm run bundle -- --skip-build  assemble only (reuse an existing dist/)
 *   npm run bundle -- --tarball     also write dist/wolf-idea-pitch-standalone.tar.gz
 *
 * Runtime secrets are NOT bundled — pass them to the server (DEPLOYMENT.md
 * "Self-hosting (VPS / Docker)"). VERCEL is stripped from the build env on
 * purpose: that variable selects the Vercel branch of next.config.ts.
 */
import { spawnSync } from "node:child_process";
import { cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Must match DIST_DIR of the non-Vercel branch in next.config.ts.
const DIST = "dist";
const STANDALONE = join(DIST, "standalone");
const SERVER = join(STANDALONE, "server.js");
const TARBALL = join(DIST, "wolf-idea-pitch-standalone.tar.gz");

const flags = new Set(process.argv.slice(2));
const skipBuild = flags.has("--skip-build");
const wantTarball = flags.has("--tarball");

for (const flag of flags) {
  if (flag !== "--skip-build" && flag !== "--tarball") {
    console.error(`[bundle] unknown flag ${flag}`);
    console.error("[bundle] usage: npm run bundle [-- --skip-build] [-- --tarball]");
    process.exit(2);
  }
}

const log = (step, message) => console.log(`[bundle] ${step.padEnd(8)} ${message}`);

function fail(message) {
  console.error(`[bundle] FAILED   ${message}`);
  process.exit(1);
}

/** Run `next build` on the standalone branch, letting its output through. */
function build() {
  const env = { ...process.env };
  delete env.VERCEL; // keep next.config.ts on the standalone/dist branch
  log("build", "npm run build  (output: standalone, distDir: dist)");
  const result = spawnSync("npm run build", { cwd: root, env, stdio: "inherit", shell: true });
  if (result.status !== 0) {
    fail(`npm run build exited with ${result.status === null ? `signal ${result.signal}` : result.status}`);
  }
}

/** Replace a bundle sub-folder with a fresh copy of a project folder. */
async function copyInto(from, to) {
  const source = join(root, from);
  if (!existsSync(source)) fail(`${from} is missing — cannot assemble the bundle`);
  const target = join(root, to);
  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true, force: true });
  log("copy", `${from} -> ${to}`);
}

/** `tar` ships with Windows 10+ and every Linux/macOS box. */
function pack() {
  log("tarball", TARBALL);
  const result = spawnSync("tar", ["-czf", TARBALL, "-C", STANDALONE, "."], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.error || result.status !== 0) {
    const why = result.error?.message ?? result.stderr?.trim() ?? `exit ${result.status}`;
    fail(`tar failed (${why}) — rerun without --tarball, or pack ${STANDALONE} manually`);
  }
}

async function main() {
  if (!skipBuild) build();

  if (!existsSync(join(root, SERVER))) {
    fail(
      `${SERVER} was not produced — next.config.ts must keep ` +
        "`output: 'standalone'` + `distDir: 'dist'` for non-Vercel builds"
    );
  }

  // Not copied by Next.js on purpose (docs: "output" / self-hosting).
  await copyInto("public", join(STANDALONE, "public"));
  await copyInto(join(DIST, "static"), join(STANDALONE, DIST, "static"));

  if (wantTarball) pack();

  log("done", `runnable bundle at ${STANDALONE}`);
  console.log(`
[bundle] next steps
  local smoke test   node --env-file=.env.local ${SERVER.replace(/\\/g, "/")}
  on a VPS           cd ${STANDALONE} && PORT=3000 HOSTNAME=0.0.0.0 node server.js
  in Docker          docker build -t wolf-idea-pitch .  (see Dockerfile)
${wantTarball ? `[bundle] tarball            ${TARBALL.replace(/\\/g, "/")}\n` : ""}`);
}

await main();
