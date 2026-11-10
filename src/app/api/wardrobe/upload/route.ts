import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;

/** Verify the file really is the image type it claims to be. */
function detectImage(buffer: Buffer): { extension: string; mime: string } | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { extension: "png", mime: "image/png" };
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { extension: "webp", mime: "image/webp" };
  }
  return null;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload wardrobe photos." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (file.size <= 0) return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 6 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImage(buffer);
  if (!detected) {
    return NextResponse.json({ error: "Use a JPG, PNG or WEBP image." }, { status: 400 });
  }

  const safeUser = user.id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeUser) return NextResponse.json({ error: "Could not resolve your account." }, { status: 400 });

  const directory = path.join(process.cwd(), "public", "uploads", "wardrobe", safeUser);
  await fs.mkdir(directory, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${detected.extension}`;
  await fs.writeFile(path.join(directory, filename), buffer);

  return NextResponse.json({ url: `/uploads/wardrobe/${safeUser}/${filename}` }, { status: 201 });
}
