const { NodeSSH } = require("node-ssh");
const http = require("https");

const OLD = {
  host: "157.173.222.222",
  username: "root",
  password: "Bali@Tech123?",
  readyTimeout: 120000,
};

async function run(ssh, label, cmd, allowFail = false) {
  console.log("\n>>", label);
  const res = await ssh.execCommand(cmd);
  if (res.stdout) console.log(res.stdout.trim().slice(0, 4000));
  if (res.stderr) console.error(res.stderr.trim().slice(0, 2000));
  if (!allowFail && res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed (${res.code})`);
  }
  return res;
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, { rejectUnauthorized: true, headers: { "User-Agent": "balitech-cutover" } }, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body, headers: res.headers }));
      })
      .on("error", reject);
  });
}

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(OLD);

  await run(ssh, "start nginx", "systemctl start nginx && systemctl enable nginx && systemctl is-active nginx");
  await run(ssh, "ensure tunnel", "systemctl restart balitech-tunnel && sleep 2 && systemctl is-active balitech-tunnel");
  await run(
    ssh,
    "nginx test+reload",
    "ln -sfn /etc/nginx/sites-available/balitech /etc/nginx/sites-enabled/balitech && nginx -t && systemctl reload nginx"
  );
  await run(ssh, "stop old next", "pm2 stop balitech-app; pm2 save", true);
  await run(
    ssh,
    "local tunnel check",
    "curl -s -o /dev/null -w 't:%{http_code} ' http://127.0.0.1:3006/; curl -s http://127.0.0.1:3006/blog | grep -oE '/blog/[a-z0-9-]+' | sort -u | head -12"
  );

  ssh.dispose();

  const home = await fetch("https://balitech.org/");
  const blog = await fetch("https://balitech.org/blog");
  const slugs = [
    ...new Set(
      [...blog.body.matchAll(/\/blog\/([a-z0-9-]+)/g)]
        .map((m) => m[1])
        .filter((s) => s !== "category" && s !== "tag")
    ),
  ];
  console.log(
    JSON.stringify(
      {
        home: home.status,
        blog: blog.status,
        posts: slugs.length,
        sample: slugs.slice(0, 8),
        fallback: /scales-us-campaign/.test(blog.body),
        poweredBy: String(home.headers["x-powered-by"] || ""),
      },
      null,
      2
    )
  );
  console.log("\nLIVE_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
