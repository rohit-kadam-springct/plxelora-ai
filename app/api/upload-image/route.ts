import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import imagekit from "@/lib/imagekit";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { base64Data, filename, folder = "styles" } = body;

    if (!base64Data || !filename) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^image\/[a-zA-Z]+;base64,/, "");

    const result = await imagekit.upload({
      file: base64String,
      fileName: filename,
      folder: `/${folder}/`,
      useUniqueFileName: true,
      responseFields: ["url", "fileId", "name", "size"],
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      size: result.size,
    });
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload image",
      },
      { status: 500 }
    );
  }
}
