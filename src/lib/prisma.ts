import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbAvailable: boolean | undefined;
  dbCheckPromise: Promise<boolean> | undefined;
};

const WRITE_OPERATIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "executeRaw",
  "executeRawUnsafe",
]);

/**
 * Production pages are prerendered at build time, so a release build has to read
 * from the live database. PRISMA_READONLY makes that provably non-destructive by
 * refusing every mutating query for the duration of the build.
 */
function createPrismaClient() {
  const client = new PrismaClient({
    log: [],
  });

  if (process.env.PRISMA_READONLY !== "1") {
    return client;
  }

  return client.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (WRITE_OPERATIONS.has(operation)) {
          throw new Error(
            `PRISMA_READONLY: blocked ${model ?? "raw"}.${operation}`
          );
        }
        return query(args);
      },
    },
  }) as unknown as PrismaClient;
}

/** Ensures cached client includes all current schema models (avoids stale dev cache). */
function isPrismaClientReady(client: PrismaClient) {
  const delegate = client as PrismaClient & {
    blog?: { findMany: unknown };
    office?: { findMany: unknown };
    mediaItem?: { findMany: unknown };
  };

  return (
    typeof delegate.blog?.findMany === "function" &&
    typeof delegate.office?.findMany === "function" &&
    typeof delegate.mediaItem?.findMany === "function"
  );
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (cached && isPrismaClientReady(cached)) {
    return cached;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();

export function isMediaItemReady() {
  return typeof (prisma as PrismaClient & { mediaItem?: { findMany: unknown } })
    .mediaItem?.findMany === "function";
}

export function isOfficeReady() {
  return typeof (prisma as PrismaClient & { office?: { findMany: unknown } })
    .office?.findMany === "function";
}

export async function isDatabaseAvailable(): Promise<boolean> {
  if (globalForPrisma.dbAvailable === true) {
    return true;
  }

  if (!globalForPrisma.dbCheckPromise) {
    globalForPrisma.dbCheckPromise = prisma
      .$queryRaw`SELECT 1`
      .then(() => {
        globalForPrisma.dbAvailable = true;
        return true;
      })
      .catch(() => {
        globalForPrisma.dbAvailable = false;
        return false;
      })
      .finally(() => {
        globalForPrisma.dbCheckPromise = undefined;
      });
  }

  return globalForPrisma.dbCheckPromise;
}
