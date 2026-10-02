import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { saveCategoryImage } from "@/lib/blog-category-upload";

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Choose an image from your PC." },
        { status: 400 }
      );
    }

    const saved = await saveCategoryImage(file);
    return NextResponse.json({ url: saved.url, fileName: saved.fileName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
