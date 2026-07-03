module.exports = {
  apps: [
    {
      name: "balitech-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3005",
      cwd: "/var/www/balitech-app",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      exp_backoff_restart_delay: 100,
      max_restarts: 20,
      min_uptime: "10s",
      restart_delay: 3000,
      kill_timeout: 8000,
      env: {
        NODE_ENV: "production",
        PORT: 3005,
      },
    },
  ],
};
