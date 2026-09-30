const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function main() {
  console.log('Connecting to VPS...');
  await ssh.connect({
    host: '203.215.160.44',
    username: 'issac',
    password: 'btdev',
    readyTimeout: 30000,
  });
  console.log('Connected successfully!\n');

  console.log('Listing databases...');
  const res = await ssh.execCommand('echo "btdev" | sudo -S mysql -e "SHOW DATABASES;"');
  console.log(`STDOUT:\n${res.stdout.trim()}`);
  if (res.stderr.trim()) {
    console.log(`STDERR:\n${res.stderr.trim()}`);
  }

  ssh.dispose();
}

main().catch(err => {
  console.error('Connection failed:', err);
});
