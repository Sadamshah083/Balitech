/**
 * Produces a production build for release, reading content from a database over
 * an SSH tunnel and never writing to it (PRISMA_READONLY aborts any mutation).
 *
 * Every page here is statically rendered, so whichever database the build reads
 * becomes the published content. Which one that is must therefore be explicit:
 *
 *   BALITECH_BUILD_DATA=live   prerender from the live database (default)
 *   BALITECH_BUILD_DATA=local  prerender from the local database
 *
 * Live is the default because the admin panel writes there: building from the
 * local copy published stale office hours and campaign names over what HR had
 * entered. After deploy, admin saves re-render pages from live on their own
 * (see src/lib/refresh-public-pages.ts). Use `local` only for a deliberate
 * preview of local content.
 *
 *   node scripts/build-live.js
 */
const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");
const { NodeSSH } = require("node-ssh");

const { SERVER, MARKER_FILE } = require("./deploy-config");

const LOCAL_PORT = 3399;
const ssh = new NodeSSH();

const DATA_SOURCE = (process.env.BALITECH_BUILD_DATA || "live").toLowerCase();
if (!["live", "local"].includes(DATA_SOURCE)) {
  console.error(`BALITECH_BUILD_DATA must be "live" or "local", got "${DATA_SOURCE}"`);
  process.exit(1);
}

function readLocalDatabaseUrl() {
  const line = fs
    .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("DATABASE_URL"));
  if (!line) throw new Error("DATABASE_URL missing from local .env");
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

function readRemoteDatabaseUrl(raw) {
  const line = raw
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("DATABASE_URL"));
  if (!line) throw new Error("DATABASE_URL missing from remote .env");
  const value = line.slice(line.indexOf("=") + 1).trim();
  return value.replace(/^["']|["']$/g, "");
}

/**
 * Points a connection string at the local end of the tunnel.
 *
 * `port` must be the port the tunnel listens on, not the port MySQL uses on the
 * server. Passing the remote port sends the build to 127.0.0.1:3306 — a local
 * MySQL, if one is running — which is how local rows ended up published as
 * "live" content while the tunnel went unused.
 */
function retargetToTunnel(url, localPort) {
  const parsed = new URL(url);
  const database = parsed.pathname;
  parsed.hostname = "127.0.0.1";
  parsed.port = String(localPort);
  return { url: parsed.toString(), database: database.replace(/^\//, "") };
}

/**
 * Confirms the build can actually read live rows before it starts.
 *
 * The data helpers in src/lib fall back to static content when the database is
 * unreachable, which keeps the site up but means a misconfigured build produces
 * a plausible-looking site full of hardcoded copy. Failing here instead makes
 * that impossible.
 */
function countRows(url) {
  /* Deliberately an *async* child process, for two separate reasons:
     instantiating PrismaClient in this process keeps the Windows query-engine
     DLL open and the build's `prisma generate` step then fails with EPERM, and
     spawnSync would block the event loop that the SSH tunnel needs to move
     bytes, so a tunnelled query could never complete. */
  const code = `
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    Promise.all([
      prisma.campaign.count(),
      prisma.office.count(),
      prisma.blog.count(),
    ])
      .then(([campaigns, offices, blogs]) => {
        process.stdout.write(JSON.stringify({ campaigns, offices, blogs }));
        return prisma.$disconnect();
      })
      .catch(async (error) => {
        process.stderr.write(String(error.message || error));
        await prisma.$disconnect();
        process.exit(1);
      });
  `;

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["-e", code], {
      env: { ...process.env, DATABASE_URL: url, PRISMA_READONLY: "1" },
    });

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));

    child.on("exit", (status) => {
      if (status !== 0) return reject(new Error(err.trim() || `exited ${status}`));
      try {
        resolve(JSON.parse(out.trim()));
      } catch {
        reject(new Error("unexpected output: " + out.slice(0, 200)));
      }
    });
  });
}

async function startTunnel(remotePort) {
  const server = net.createServer((socket) => {
    ssh.connection.forwardOut("127.0.0.1", 0, "127.0.0.1", remotePort, (err, stream) => {
      if (err) {
        socket.destroy();
        return;
      }
      socket.pipe(stream).pipe(socket);
      stream.on("error", () => socket.destroy());
      socket.on("error", () => stream.destroy());
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(LOCAL_PORT, "127.0.0.1", resolve);
  });

  return server;
}

async function main() {
  console.log(`Connecting to ${SERVER.host} ...`);
  await ssh.connect(SERVER);

  const env = await ssh.execCommand("cat .env", { cwd: SERVER.remoteDir });
  if (env.code !== 0) throw new Error("Could not read remote .env: " + env.stderr);

  const liveUrl = readRemoteDatabaseUrl(env.stdout);
  const remotePort = Number(new URL(liveUrl).port || 3306);
  const { url: tunnelUrl, database } = retargetToTunnel(liveUrl, LOCAL_PORT);

  const server = await startTunnel(remotePort);
  console.log(`Tunnel ready: 127.0.0.1:${LOCAL_PORT} -> live MySQL (database "${database}")`);

  let liveCounts;
  try {
    liveCounts = await countRows(tunnelUrl);
  } catch (error) {
    server.close();
    ssh.dispose();
    throw new Error(
      "Could not read the live database over the tunnel. Aborting, because the " +
        "build would otherwise fall back to static content and publish it as live:\n  " +
        (error.message || error)
    );
  }

  const buildUrl = DATA_SOURCE === "live" ? tunnelUrl : readLocalDatabaseUrl();
  const buildCounts = DATA_SOURCE === "live" ? liveCounts : await countRows(buildUrl);

  console.log(`\nPrerendering from the ${DATA_SOURCE.toUpperCase()} database`);
  console.log(
    `   publishing  ${buildCounts.campaigns} campaigns, ${buildCounts.offices} offices, ${buildCounts.blogs} blogs`
  );
  console.log(
    `   live holds  ${liveCounts.campaigns} campaigns, ${liveCounts.offices} offices, ${liveCounts.blogs} blogs`
  );

  /* Surfaced every build so the gap between the two can never go unnoticed
     again — publishing local rows as live content did exactly that. */
  if (DATA_SOURCE !== "live") {
    const gaps = [];
    if (buildCounts.offices !== liveCounts.offices) gaps.push("offices");
    if (buildCounts.blogs !== liveCounts.blogs) gaps.push("blogs");
    if (gaps.length) {
      console.log(
        `\n   Note: ${gaps.join(" and ")} differ between the two. This build publishes\n` +
          `   the LOCAL rows, overwriting what the admin panel saved to live until\n` +
          `   the next admin save or a build with BALITECH_BUILD_DATA=live.`
      );
    }
  }

  console.log("\nBuilding with PRISMA_READONLY=1 (writes will abort the build)\n");

  const code = await new Promise((resolve) => {
    const child = spawn("npm", ["run", "build"], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: buildUrl,
        PRISMA_READONLY: "1",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    });
    child.on("exit", resolve);
  });

  server.close();
  ssh.dispose();

  if (code !== 0) {
    console.error(`\nBuild failed (exit ${code}). Nothing was deployed.`);
    process.exit(code || 1);
  }

  // deploy_live.js refuses to ship a build without this marker, so a build that
  // skipped this script can never reach production.
  fs.writeFileSync(
    path.join(__dirname, "..", ".next", MARKER_FILE),
    JSON.stringify(
      {
        source: DATA_SOURCE === "live" ? "live-db" : "local-db",
        database,
        host: SERVER.host,
        builtAt: new Date().toISOString(),
        /* Recorded so a build's content can be traced back to what it read. */
        publishedRowCounts: buildCounts,
        liveRowCounts: liveCounts,
      },
      null,
      2
    )
  );

  console.log(`\nBuild complete from the ${DATA_SOURCE} database.`);
}

main().catch((error) => {
  console.error(error.message || error);
  try {
    ssh.dispose();
  } catch {}
  process.exit(1);
});
