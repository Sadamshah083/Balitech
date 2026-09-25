import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { refreshPublicPages } from "@/lib/refresh-public-pages";
import { syncMediaCatalog } from "@/lib/media";

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const created = await syncMediaCatalog();
    refreshPublicPages();
    return NextResponse.json({ ok: true, created });
  } catch {
    return NextResponse.json(
      { error: "Failed to sync website media defaults" },
      { status: 500 }
    );
  }
}
