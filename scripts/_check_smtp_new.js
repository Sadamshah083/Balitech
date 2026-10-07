/**
 * Check whether SMTP can work from the new guest (203.215.164.70:2233).
 * Does not print secrets.
 */
const net = require("net");
const tls = require("tls");
const { NodeSSH } = require("node-ssh");

function tcpProbe(host, port, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    const t = setTimeout(() => {
      s.destroy();
      resolve({ ok: false, detail: "timeout" });
    }, timeoutMs);
    s.on("connect", () => {
      clearTimeout(t);
      s.end();
      resolve({ ok: true, detail: "open" });
    });
    s.on("error", (e) => {
      clearTimeout(t);
      resolve({ ok: false, detail: e.code || e.message });
    });
  });
}

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: "203.215.164.70",
    port: 2233,
    username: "ubuntu",
    password: "balitech1",
    readyTimeout: 60000,
  });

  // Read SMTP settings without echoing secrets
  const envCheck = await ssh.execCommand(
    [
      "cd /var/www/balitech-app",
      "node -e \"",
      "require('dotenv').config({ path: '.env' });",
      "const keys=['SMTP_HOST','SMTP_PORT','SMTP_SECURE','SMTP_USER','SMTP_FROM','SMTP_TO'];",
      "const out={};",
      "for (const k of keys) {",
      "  const v=process.env[k];",
      "  if (!v) out[k]='MISSING';",
      "  else if (k==='SMTP_USER'||k==='SMTP_FROM'||k==='SMTP_TO') out[k]=v;",
      "  else out[k]=v;",
      "}",
      "out.SMTP_PASS=process.env.SMTP_PASS ? ('SET len='+String(process.env.SMTP_PASS).length) : 'MISSING';",
      "console.log(JSON.stringify(out,null,2));",
      "\"",
    ].join(" ")
  );

  // dotenv may not exist; fallback to parsing .env safely
  let smtpMeta = envCheck.stdout;
  if (envCheck.code !== 0 || !smtpMeta.includes("SMTP_HOST")) {
    const parse = await ssh.execCommand(
      `python3 - <<'PY'
from pathlib import Path
p=Path('/var/www/balitech-app/.env')
text=p.read_text(errors='ignore') if p.exists() else ''
keys=['SMTP_HOST','SMTP_PORT','SMTP_SECURE','SMTP_USER','SMTP_PASS','SMTP_FROM','SMTP_TO']
out={}
for line in text.splitlines():
    line=line.strip()
    if not line or line.startswith('#') or '=' not in line: continue
    k,v=line.split('=',1)
    k=k.strip(); v=v.strip().strip('"').strip("'")
    if k in keys: out[k]=v
for k in keys:
    if k not in out: out[k]=''
safe={k:('SET len='+str(len(out[k])) if k=='SMTP_PASS' and out[k] else (out[k] or 'MISSING')) for k in keys}
import json; print(json.dumps(safe, indent=2))
PY`
    );
    smtpMeta = parse.stdout || parse.stderr;
  }
  console.log("SMTP env on guest:\n" + (smtpMeta || "").trim());

  // Extract host/port for connectivity tests
  const hostMatch = /"SMTP_HOST"\s*:\s*"([^"]+)"/.exec(smtpMeta || "");
  const portMatch = /"SMTP_PORT"\s*:\s*"([^"]+)"/.exec(smtpMeta || "");
  const smtpHost = hostMatch?.[1];
  const smtpPort = Number(portMatch?.[1] || 0);

  if (!smtpHost || smtpHost === "MISSING" || !smtpPort) {
    console.log("\nRESULT: SMTP not configured on this server (.env missing host/port).");
    ssh.dispose();
    process.exitCode = 2;
    return;
  }

  // From guest: DNS + TCP to SMTP host on configured port + common ports
  const remoteProbe = await ssh.execCommand(
    [
      `getent hosts ${smtpHost} || dig +short ${smtpHost} || true`,
      `python3 - <<'PY'
import socket, json
host=${JSON.stringify(smtpHost)}
ports=sorted(set([${smtpPort}, 587, 465, 25]))
out=[]
for port in ports:
    s=socket.socket(); s.settimeout(8)
    try:
        s.connect((host, port)); out.append({"port":port,"ok":True,"detail":"open"})
    except Exception as e:
        out.append({"port":port,"ok":False,"detail":str(e)})
    finally:
        s.close()
print(json.dumps(out, indent=2))
PY`,
    ].join(" && ")
  );
  console.log("\nDNS + TCP from guest:\n" + (remoteProbe.stdout || remoteProbe.stderr || "").trim());

  // Optional: STARTTLS/banner check via openssl if available (no auth)
  const banner = await ssh.execCommand(
    smtpPort === 465
      ? `timeout 8 openssl s_client -connect ${smtpHost}:${smtpPort} -quiet </dev/null 2>/dev/null | head -5 || echo BANNER_FAIL`
      : `timeout 8 bash -lc 'exec 3<>/dev/tcp/${smtpHost}/${smtpPort}; head -1 <&3; echo QUIT >&3' 2>/dev/null || echo BANNER_FAIL`
  );
  console.log("\nSMTP banner:\n" + (banner.stdout || banner.stderr || "").trim().slice(0, 500));

  // Also probe from this Windows machine (not authoritative for server mail)
  const local = await tcpProbe(smtpHost, smtpPort);
  console.log(`\nLocal PC probe ${smtpHost}:${smtpPort}:`, local);

  const guestOk = /"ok": true/.test(remoteProbe.stdout || "");
  console.log(
    "\nRESULT:",
    guestOk
      ? `SMTP network path from new server looks OK (${smtpHost}:${smtpPort}). Auth depends on SMTP_USER/SMTP_PASS in guest .env.`
      : `SMTP blocked or unreachable from new server to ${smtpHost}:${smtpPort}.`
  );

  ssh.dispose();
  if (!guestOk) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
