import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent directory traversal
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "");
    if (!safeFilename || safeFilename !== filename) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = join(process.cwd(), "public", "uploads", safeFilename);

    if (!existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const ext = safeFilename.split(".").pop()?.toLowerCase() || "";

    let contentType = "application/octet-stream";
    if (ext === "pdf") {
      contentType = "application/pdf";
    } else if (ext === "png") {
      contentType = "image/png";
    } else if (ext === "jpg" || ext === "jpeg") {
      contentType = "image/jpeg";
    } else if (ext === "webp") {
      contentType = "image/webp";
    } else if (ext === "gif") {
      contentType = "image/gif";
    } else if (ext === "svg") {
      contentType = "image/svg+xml";
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving uploaded file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
