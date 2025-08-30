import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createOrUpdateUser, getUserWithStats } from "@/lib/db/operations";

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create or update user in our database
    await createOrUpdateUser(user);

    // Get user with stats
    const userWithStats = await getUserWithStats(userId);

    return NextResponse.json({
      user: userWithStats,
      stats: {
        credits: userWithStats?.credits ?? 0,
        totalGenerations: userWithStats?.stats?.totalGenerations ?? 0,
        styles: 0, // Will implement later
        personas: 0, // Will implement later
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
