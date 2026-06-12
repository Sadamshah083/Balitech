/**
 * Stub Engine.IO open handshake — silences dev-time polling from browser tools
 * that probe /api/socketio without a real Socket.IO server.
 */
function openHandshake() {
  const payload = JSON.stringify({
    sid: "balitech-dev-stub",
    upgrades: [],
    pingInterval: 25000,
    pingTimeout: 20000,
    maxPayload: 1000000,
  });

  return new Response(`0${payload}`, {
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  return openHandshake();
}

export async function POST() {
  return openHandshake();
}
