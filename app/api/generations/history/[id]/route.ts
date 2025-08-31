import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, generations, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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

    // Delete generation (only if belongs to user)
    const result = await db
      .delete(generations)
      .where(and(eq(generations.id, id), eq(generations.userId, user[0].id)))
      .returning();

    if (!result.length) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete generation error:", error);
    return NextResponse.json(
      { error: "Failed to delete generation" },
      { status: 500 }
    );
  }
}
