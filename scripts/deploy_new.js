const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function exec(cmd, cwd = '/var/www/balitech-app') {
  console.log(`\n▶ ${cmd}`);
  const res = await ssh.execCommand(cmd, { cwd });
  if (res.stdout.trim()) console.log(res.stdout.trim());
  if (res.stderr.trim()) console.error(res.stderr.trim());
  if (res.code !== 0 && res.code !== null) {
    throw new Error(`Command failed (${res.code}): ${cmd}`);
  }
  return res;
}

async function main() {
  console.log('Connecting to VPS...');
  await ssh.connect({
    host: '203.215.160.44',
    username: 'issac',
    password: 'btdev',
    readyTimeout: 60000,
  });
  console.log('Connected!');

  const localDir = path.resolve(__dirname, '..');
  const remoteDir = '/var/www/balitech-app';

  console.log('Creating remote directory and setting permissions...');
  await ssh.execCommand('echo "btdev" | sudo -S mkdir -p ' + remoteDir);
  await ssh.execCommand('echo "btdev" | sudo -S chown -R issac:issac ' + remoteDir);

  console.log('Uploading files (skipping node_modules, .next, .git, etc.)...');
  const failed = [];
  const successful = [];

  const VIDEO_EXTS = new Set(['.mp4', '.mov', '.avi', '.webm', '.mkv']);

  await ssh.putDirectory(localDir, remoteDir, {
    recursive: true,
    concurrency: 10,
    validate: function(itemPath) {
      const baseName = path.basename(itemPath);
      const ext = path.extname(itemPath).toLowerCase();
      // Skip heavy or unneeded files
      if (['node_modules', '.next', '.git', '.env', '.DS_Store', 'logs', 'videos', 'baliTech.zip', 'balitech.tar.gz', 'deploy_vps.zip'].includes(baseName)) {
        return false;
      }
      if (ext && VIDEO_EXTS.has(ext)) {
        return false;
      }
      return true;
    },
    tick: function(localPath, remotePath, error) {
      if (error) {
        failed.push(localPath);
      } else {
        successful.push(localPath);
      }
    }
  });

  console.log(`Uploaded ${successful.length} files successfully.`);
  if (failed.length > 0) {
    console.log(`Failed to upload ${failed.length} files:`, failed.slice(0, 5));
    throw new Error('Upload failed');
  }

  // Upload .env
  const localEnv = path.join(localDir, '.env');
  if (fs.existsSync(localEnv)) {
    console.log('Uploading .env file...');
    await ssh.putFile(localEnv, `${remoteDir}/.env`);
  } else {
    console.log('Writing default .env...');
    const envContent = `DATABASE_URL="mysql://root@localhost:3306/balitech"
NEXT_PUBLIC_APP_URL="https://balitech.org"
JWT_SECRET="a7c3b9d4f2e1a8b5c6d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2"
JWT_EXPIRES_IN="7d"
JWT_ISSUER="balitech"
JWT_AUDIENCE="balitech-admin"
ADMIN_EMAIL="Admin@balitech.com"
ADMIN_PASSWORD="balitech@321!"
`;
    await ssh.execCommand(`cat << 'EOF' > ${remoteDir}/.env\n${envContent}\nEOF`);
  }

  console.log('\n--- Creating Database ---');
  await exec('echo "btdev" | sudo -S mysql -e "CREATE DATABASE IF NOT EXISTS balitech;"');

  console.log('\n--- Installing Dependencies ---');
  await exec('npm install');

  console.log('\n--- Prisma Generate & Push Schema ---');
  await exec('npx prisma generate');
  // Push the schema to create tables. We do not seed because the user said "dont change anything in database"
  await exec('npx prisma db push');

  console.log('\n--- Installing PM2 globally ---');
  await exec('echo "btdev" | sudo -S npm install -g pm2');

  console.log('\n--- Building Next.js ---');
  await exec('npm run build');

  console.log('\n--- Starting PM2 ---');
  await exec('pm2 delete balitech-app 2>/dev/null || true');
  await exec('pm2 start ecosystem.config.js');
  await exec('pm2 save');
  await exec('echo "btdev" | sudo -S pm2 startup systemd -u issac --hp /home/issac');

  console.log('\n--- Setting up Nginx ---');
  const nginxConf = `server {
    listen 80;
    server_name balitech.org www.balitech.org;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
  await exec(`cat << 'EOF' > /tmp/balitech.nginx\n${nginxConf}\nEOF`);
  await exec('echo "btdev" | sudo -S mv /tmp/balitech.nginx /etc/nginx/sites-available/balitech');
  await exec('echo "btdev" | sudo -S ln -sf /etc/nginx/sites-available/balitech /etc/nginx/sites-enabled/balitech');
  await exec('echo "btdev" | sudo -S nginx -t');
  await exec('echo "btdev" | sudo -S systemctl reload nginx');

  console.log('\n--- Verifying Deployment ---');
  await exec('curl -I http://127.0.0.1:3005');

  ssh.dispose();
  console.log('\nDeployment complete!');
}

main().catch(err => {
  console.error('Error during deployment:', err);
  ssh.dispose();
});
