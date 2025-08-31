import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, personas, users } from "@/lib/db";
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

    // Delete persona (only if belongs to user)
    const result = await db
      .delete(personas)
      .where(and(eq(personas.id, id), eq(personas.userId, user[0].id)))
      .returning();

    if (!result.length) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete persona error:", error);
    return NextResponse.json(
      { error: "Failed to delete persona" },
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
    const { name, description, imageUrl } = body;

    if (!name || !imageUrl) {
      return NextResponse.json(
        { error: "Name and image are required" },
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

    // Update persona
    const [updatedPersona] = await db
      .update(personas)
      .set({
        name: name.trim(),
        description: description?.trim(),
        imageUrl,
        updatedAt: new Date(),
      })
      .where(and(eq(personas.id, id), eq(personas.userId, user[0].id)))
      .returning();

    if (!updatedPersona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    return NextResponse.json({ persona: updatedPersona });
  } catch (error) {
    console.error("Update persona error:", error);
    return NextResponse.json(
      { error: "Failed to update persona" },
      { status: 500 }
    );
  }
}
