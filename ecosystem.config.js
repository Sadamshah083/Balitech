module.exports = {
  apps: [
    {
      name: 'balitech',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: './',
      instances: '1',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ],
  deploy: {
    production: {
      user: 'u296893178',
      host: '191.101.79.102',
      port: '65002',
      ref: 'origin/main',
      repo: 'https://github.com/Sadamshah083/Balitech.git',
      path: '/home/u296893178/domains/balitech.org/public_html',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
