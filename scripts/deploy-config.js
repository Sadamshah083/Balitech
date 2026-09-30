/**
 * Shared live-server connection details for the build/deploy scripts.
 * Override with BALITECH_SSH_HOST / BALITECH_SSH_USER / BALITECH_SSH_PASSWORD.
 */
const SERVER = {
  host: process.env.BALITECH_SSH_HOST || "157.173.222.222",
  username: process.env.BALITECH_SSH_USER || "root",
  password: process.env.BALITECH_SSH_PASSWORD || "Bali@Tech123?",
  readyTimeout: 60000,
  remoteDir: "/var/www/balitech-app",
};

/** pm2 process name from ecosystem.config.js. */
const PM2_APP = "balitech-app";

/** Written by build-live.js, required by deploy-live.js. */
const MARKER_FILE = "BUILD_SOURCE.json";

module.exports = { SERVER, PM2_APP, MARKER_FILE };
