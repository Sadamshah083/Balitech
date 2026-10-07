/**
 * Open an SSH local forward to the new guest and verify Next.js responses.
 */
const net = require("net");
const { NodeSSH } = require("node-ssh");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: "203.215.164.70",
    port: 2233,
    username: "ubuntu",
    password: "balitech1",
    readyTimeout: 60000,
    keepaliveInterval: 5000,
  });

  const localPort = 13005;
  const server = net.createServer((socket) => {
    ssh.connection.forwardOut("127.0.0.1", 0, "127.0.0.1", 3005, (err, stream) => {
      if (err) {
        socket.destroy();
        return;
      }
      socket.pipe(stream).pipe(socket);
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(localPort, "127.0.0.1", resolve);
  });

  const http = require("http");
  const get = (path) =>
    new Promise((resolve, reject) => {
      http
        .get({ host: "127.0.0.1", port: localPort, path }, (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => resolve({ status: res.statusCode, body }));
        })
        .on("error", reject);
    });

  const home = await get("/");
  const blog = await get("/blog");
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
        postCount: slugs.length,
        posts: slugs.slice(0, 20),
        fallback: /scales-us-campaign/.test(blog.body),
      },
      null,
      2
    )
  );

  server.close();
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
