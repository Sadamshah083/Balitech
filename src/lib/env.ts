export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Add JWT_SECRET="your-secret-key" to your .env file.'
    );
  }

  return secret;
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN?.trim() || "7d";
}

export function getJwtIssuer(): string {
  return process.env.JWT_ISSUER?.trim() || "balitech";
}

export function getJwtAudience(): string {
  return process.env.JWT_AUDIENCE?.trim() || "balitech-admin";
}
