import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, users, generations, personas, styles } from "@/lib/db";
import { eq, count } from "drizzle-orm";

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

    // Parallel queries for better performance
    const [generationsCount, personasCount, stylesCount] = await Promise.all([
      db
        .select({ count: count() })
        .from(generations)
        .where(eq(generations.userId, user[0].id)),
      db
        .select({ count: count() })
        .from(personas)
        .where(eq(personas.userId, user[0].id)),
      db
        .select({ count: count() })
        .from(styles)
        .where(eq(styles.userId, user[0].id)),
    ]);

    const stats = [
      { value: user[0].credits.toString(), label: "Credits" },
      { value: generationsCount[0].count.toString(), label: "Generated" },
      { value: personasCount[0].count.toString(), label: "Personas" },
      { value: stylesCount[0].count.toString(), label: "Styles" },
    ];

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
