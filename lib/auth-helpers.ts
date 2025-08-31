import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function ensureUserExists(clerkId: string) {
  console.log(`🔍 Checking user existence for Clerk ID: ${clerkId}`);

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existingUser.length > 0) {
    console.log(`✅ User found: ${existingUser[0].email}`);
    return existingUser[0];
  }

  console.log(`🔄 User not found, creating new user...`);

  try {
    // Get full user details from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      throw new Error("Unable to fetch user details from Clerk");
    }

    // Create new user in database
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        imageUrl: clerkUser.imageUrl || "",
        plan: "FREE",
        credits: 5, // Default starting credits
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`🎉 User created successfully: ${newUser.email}`);
    return newUser;
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
}
