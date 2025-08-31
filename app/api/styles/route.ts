import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, styles, styleImages, users } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { extractCombinedStyleMetadata } from "@/lib/style-extractor";

const FREE_TIER_STYLE_LIMIT = 2;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);
    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userStyles = await db
      .select()
      .from(styles)
      .where(eq(styles.userId, user[0].id))
      .orderBy(styles.createdAt);

    // Get images for each style
    for (const style of userStyles) {
      const images = await db
        .select()
        .from(styleImages)
        .where(eq(styleImages.styleId, style.id))
        .orderBy(styleImages.order);

      (style as any).images = images;
    }

    return NextResponse.json({ styles: userStyles });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch styles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, imageUrls } = body; // Multiple URLs

    if (
      !name ||
      !imageUrls ||
      !Array.isArray(imageUrls) ||
      imageUrls.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Name and at least one reference image are required",
        },
        { status: 400 }
      );
    }

    if (imageUrls.length > 5) {
      return NextResponse.json(
        {
          error: "Maximum 5 reference images allowed per style",
        },
        { status: 400 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);
    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check free tier limit
    const [styleCount] = await db
      .select({ count: count() })
      .from(styles)
      .where(eq(styles.userId, user[0].id));

    const maxStyles = user[0].plan === "FREE" ? FREE_TIER_STYLE_LIMIT : 10;
    if (styleCount.count >= maxStyles) {
      return NextResponse.json(
        {
          error: `${user[0].plan} tier style limit reached`,
          limit: maxStyles,
          current: styleCount.count,
        },
        { status: 403 }
      );
    }

    // Extract combined style metadata from all images
    console.log("🎨 Extracting style from", imageUrls.length, "images...");
    const combinedMetadata = await extractCombinedStyleMetadata(imageUrls);

    // Create style record
    const [newStyle] = await db
      .insert(styles)
      .values({
        userId: user[0].id,
        name: name.trim(),
        description: description?.trim(),
        extractedMeta: combinedMetadata,
      })
      .returning();

    // Create individual style image records
    const styleImageRecords = imageUrls.map((url, index) => ({
      styleId: newStyle.id,
      imageUrl: url,
      order: index,
    }));

    await db.insert(styleImages).values(styleImageRecords);

    // Return style with images
    const styleWithImages = {
      ...newStyle,
      images: styleImageRecords,
    };

    return NextResponse.json({ style: styleWithImages });
  } catch (error) {
    console.error("Style creation error:", error);
    return NextResponse.json(
      { error: "Failed to create style" },
      { status: 500 }
    );
  }
}
