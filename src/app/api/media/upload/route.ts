import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { saveMediaFile } from "@/lib/media-upload";

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a file from your PC." }, { status: 400 });
    }

    const saved = await saveMediaFile(file);
    return NextResponse.json({
      url: saved.url,
      fileName: saved.fileName,
      kind: saved.kind,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
