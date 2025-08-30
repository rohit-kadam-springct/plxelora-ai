import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, generations, users } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userGenerations = await db
      .select()
      .from(generations)
      .where(eq(generations.userId, user.id))
      .orderBy(desc(generations.createdAt))
      .limit(limit);

    return NextResponse.json({ generations: userGenerations });
  } catch (error) {
    console.error("Error fetching generation history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
