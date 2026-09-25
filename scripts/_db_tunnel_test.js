/**
 * Tests whether the build can actually read the live database over the tunnel.
 *
 *   node scripts/_db_tunnel_test.js
 *
 * Every data helper in src/lib swallows connection errors and returns static
 * fallback content, which is right for resilience but means a build that cannot
 * reach the database produces a site full of hardcoded copy without failing.
 * This runs the same connection the build uses and prints the raw error.
 */
const net = require("net");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const LOCAL_PORT = 3397;
const ssh = new NodeSSH();

function readRemoteDatabaseUrl(raw) {
  const line = raw
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("DATABASE_URL"));
  if (!line) throw new Error("DATABASE_URL missing from remote .env");
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
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

(async () => {
  await ssh.connect(SERVER);
  const env = await ssh.execCommand("cat .env", { cwd: SERVER.remoteDir });
  const liveUrl = readRemoteDatabaseUrl(env.stdout);
  const parsed = new URL(liveUrl);
  const remotePort = Number(parsed.port || 3306);

  console.log("\n1. what the server's own grants allow");
  const grants = await ssh.execCommand(
    `mysql -u ${parsed.username} -p'${decodeURIComponent(parsed.password)}' -e "SELECT user, host FROM mysql.user WHERE user='${parsed.username}'; SHOW GRANTS;" 2>&1 | head -20`
  );
  console.log(
    (grants.stdout || grants.stderr || "(no output)")
      .split("\n")
      .map((l) => "   " + l)
      .join("\n")
  );

  console.log("\n2. connecting the way the build does (tunnel -> TCP 127.0.0.1)");
  const server = await startTunnel(remotePort);
  parsed.hostname = "127.0.0.1";
  parsed.port = String(LOCAL_PORT);
  const tunnelUrl = parsed.toString();

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({ datasources: { db: { url: tunnelUrl } } });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("   SELECT 1 ....... ok");
    const n = await prisma.campaign.count();
    console.log(`   campaign.count() ok -> ${n} rows`);
    console.log("\n   The build CAN read live data.\n");
  } catch (e) {
    console.log("   FAILED: " + String(e.message || e).split("\n").slice(0, 6).join("\n   "));
    console.log(
      "\n   The build cannot read live data, so getPublicCampaigns() and the\n" +
        "   other helpers silently return their static fallbacks.\n"
    );
  } finally {
    await prisma.$disconnect();
    server.close();
    ssh.dispose();
  }
})().catch((e) => {
  console.error(e.message || e);
  try {
    ssh.dispose();
  } catch {}
  process.exit(1);
});
