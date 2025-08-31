import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, personas, users } from "@/lib/db";
import { eq, count } from "drizzle-orm";

const FREE_TIER_PERSONA_LIMIT = 10;

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

    const userPersonas = await db
      .select()
      .from(personas)
      .where(eq(personas.userId, user[0].id))
      .orderBy(personas.createdAt);

    return NextResponse.json({ personas: userPersonas });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch personas" },
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

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);
    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check free tier limit
    const [personaCount] = await db
      .select({ count: count() })
      .from(personas)
      .where(eq(personas.userId, user[0].id));

    if (
      user[0].plan === "FREE" &&
      personaCount.count >= FREE_TIER_PERSONA_LIMIT
    ) {
      return NextResponse.json(
        {
          error: "Free tier persona limit reached",
          limit: FREE_TIER_PERSONA_LIMIT,
          current: personaCount.count,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, imageUrl } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Persona name is required" },
        { status: 400 }
      );
    }

    const [newPersona] = await db
      .insert(personas)
      .values({
        userId: user[0].id,
        name: name.trim(),
        description: description?.trim(),
        imageUrl,
      })
      .returning();

    return NextResponse.json({ persona: newPersona });
  } catch (error) {
    console.error("Persona creation error:", error);
    return NextResponse.json(
      { error: "Failed to create persona" },
      { status: 500 }
    );
  }
}
