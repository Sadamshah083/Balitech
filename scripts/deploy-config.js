/**
 * Shared live-server connection details for the build/deploy scripts.
 * Override with BALITECH_SSH_HOST / BALITECH_SSH_USER / BALITECH_SSH_PASSWORD / BALITECH_SSH_PORT.
 */
const SERVER = {
  host: process.env.BALITECH_SSH_HOST || "203.215.164.70",
  port: Number(process.env.BALITECH_SSH_PORT || 2233),
  username: process.env.BALITECH_SSH_USER || "ubuntu",
  password: process.env.BALITECH_SSH_PASSWORD || "balitech1",
  readyTimeout: 60000,
  remoteDir: "/var/www/balitech-app",
};

/** pm2 process name from ecosystem.config.js. */
const PM2_APP = "balitech-app";

/** Next.js listen port inside the guest — do not change while the app is live. */
const APP_PORT = Number(process.env.BALITECH_APP_PORT || 3005);

/**
 * Dedicated public project port on the guest (nginx → APP_PORT).
 * Host must DNAT 203.215.164.70:PROJECT_PORT → guest:PROJECT_PORT.
 * Do not use 80/443/8080/2233 (other host services / SSH).
 */
const PROJECT_PORT = Number(process.env.BALITECH_PROJECT_PORT || 3080);

/** Written by build-live.js, required by deploy-live.js. */
const MARKER_FILE = "BUILD_SOURCE.json";

module.exports = { SERVER, PM2_APP, APP_PORT, PROJECT_PORT, MARKER_FILE };
