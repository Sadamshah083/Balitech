/**
 * Upload globals.css and rebuild on the live server against its own DB.
 * Does not write to the database.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP } = require("./deploy-config");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    ...SERVER,
    keepaliveInterval: 8000,
    keepaliveCountMax: 60,
  });

  const remote = SERVER.remoteDir;
  const css = path.join(__dirname, "..", "src", "app", "globals.css");
  console.log("Uploading globals.css ...");
  await ssh.putFile(css, `${remote}/src/app/globals.css`);

  await ssh.execCommand("rm -rf .next.incoming", { cwd: remote });

  console.log("Building on server (live DB, no writes) ...");
  const build = await ssh.execCommand("NODE_OPTIONS='--max-old-space-size=4096' npm run build", {
    cwd: remote,
    execOptions: {
      onStdout: (c) => process.stdout.write(c.toString()),
      onStderr: (c) => process.stderr.write(c.toString()),
    },
  });
  if (build.code !== 0) {
    ssh.dispose();
    process.exit(build.code || 1);
  }

  console.log("\nRestarting app ...");
  const restart = await ssh.execCommand(
    `pm2 restart ${PM2_APP} --update-env && pm2 save`,
    { cwd: remote }
  );
  if (restart.stdout) console.log(restart.stdout);
  if (restart.stderr) console.error(restart.stderr);
  if (restart.code !== 0) {
    ssh.dispose();
    process.exit(restart.code || 1);
  }

  await ssh.execCommand("sleep 5", { cwd: remote });
  const check = await ssh.execCommand(
    'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3005/blog',
    { cwd: remote }
  );
  console.log(`/blog ${check.stdout.trim()}`);
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
