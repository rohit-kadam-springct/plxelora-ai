import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, styles, styleImages, users, generations } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
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

    // Use transaction for consistency
    await db.transaction(async (tx) => {
      // Delete style images first
      await tx.delete(styleImages).where(eq(styleImages.styleId, id));

      // Delete the style
      const result = await tx
        .delete(styles)
        .where(and(eq(styles.id, id), eq(styles.userId, user[0].id)))
        .returning();

      if (!result.length) {
        throw new Error("Style not found");
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete style error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete style" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, imageUrls } = body;

    if (!name || !imageUrls || !imageUrls.length) {
      return NextResponse.json(
        { error: "Name and images are required" },
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

    // Update in transaction
    const result = await db.transaction(async (tx) => {
      // Update style
      const [updatedStyle] = await tx
        .update(styles)
        .set({
          name: name.trim(),
          description: description?.trim(),
          updatedAt: new Date(),
        })
        .where(and(eq(styles.id, id), eq(styles.userId, user[0].id)))
        .returning();

      if (!updatedStyle) {
        throw new Error("Style not found");
      }

      // Delete existing images
      await tx.delete(styleImages).where(eq(styleImages.styleId, id));

      // Add new images
      const newImages = imageUrls.map((url: string, index: number) => ({
        styleId: id,
        imageUrl: url,
        order: index,
      }));

      await tx.insert(styleImages).values(newImages);

      return updatedStyle;
    });

    return NextResponse.json({ style: result });
  } catch (error: any) {
    console.error("Update style error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update style" },
      { status: 500 }
    );
  }
}
