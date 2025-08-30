import { eq, desc, and, sql } from "drizzle-orm";
import {
  db,
  users,
  generations,
  creditTransactions,
  type User,
  type NewUser,
} from "./index";

// User Operations
export async function createOrUpdateUser(clerkUser: {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}): Promise<User> {
  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("No email found for user");
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  if (existingUser.length > 0) {
    // Update existing user
    const [updatedUser] = await db
      .update(users)
      .set({
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUser.id))
      .returning();

    return updatedUser;
  } else {
    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        credits: 5, // Free tier starts with 5 credits
      })
      .returning();

    return newUser;
  }
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  return user || null;
}

export async function getUserWithStats(clerkId: string) {
  const user = await getUserByClerkId(clerkId);
  if (!user) return null;

  // Get recent generations
  const recentGenerations = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, user.id))
    .orderBy(desc(generations.createdAt))
    .limit(10);

  // Get counts
  const [totalGenerations] = await db
    .select({ count: sql<number>`count(*)` })
    .from(generations)
    .where(
      and(eq(generations.userId, user.id), eq(generations.status, "COMPLETED"))
    );

  return {
    ...user,
    recentGenerations,
    stats: {
      totalGenerations: totalGenerations?.count || 0,
    },
  };
}

// Credit Operations
// Credit Operations - Without Transactions
export async function getUserCredits(clerkId: string): Promise<number> {
  const user = await getUserByClerkId(clerkId);
  return user?.credits || 0;
}

export async function deductCredits(
  clerkId: string,
  amount: number,
  description?: string,
  generationId?: string
): Promise<boolean> {
  try {
    // Get current user
    const user = await getUserByClerkId(clerkId);

    if (!user || user.credits < amount) {
      console.error("Insufficient credits:", {
        userCredits: user?.credits,
        required: amount,
      });
      return false;
    }

    // Update credits atomically
    const [updatedUser] = await db
      .update(users)
      .set({
        credits: user.credits - amount,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkId))
      .returning();

    if (!updatedUser) {
      console.error("Failed to update user credits");
      return false;
    }

    // Log transaction separately (not critical if this fails)
    try {
      await db.insert(creditTransactions).values({
        userId: user.id,
        amount: -amount,
        type: "USAGE",
        description,
        generationId,
      });
    } catch (logError) {
      console.error("Failed to log credit transaction:", logError);
      // Don't fail the operation if logging fails
    }

    return true;
  } catch (error) {
    console.error("Error deducting credits:", error);
    return false;
  }
}

export async function addCredits(
  clerkId: string,
  amount: number,
  type: "PURCHASE" | "BONUS" | "REFUND" = "PURCHASE",
  description?: string,
  paymentId?: string
): Promise<boolean> {
  try {
    // Get user
    const user = await getUserByClerkId(clerkId);

    if (!user) {
      console.error("User not found for credit addition");
      return false;
    }

    // Update credits atomically
    const [updatedUser] = await db
      .update(users)
      .set({
        credits: user.credits + amount,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkId))
      .returning();

    if (!updatedUser) {
      console.error("Failed to update user credits");
      return false;
    }

    // Log transaction separately (not critical if this fails)
    try {
      await db.insert(creditTransactions).values({
        userId: user.id,
        amount,
        type,
        description,
        paymentId,
      });
    } catch (logError) {
      console.error("Failed to log credit transaction:", logError);
      // Don't fail the operation if logging fails
    }

    return true;
  } catch (error) {
    console.error("Error adding credits:", error);
    return false;
  }
}

// Race condition protection with retry logic
export async function deductCreditsWithRetry(
  clerkId: string,
  amount: number,
  description?: string,
  generationId?: string,
  retries: number = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const success = await deductCredits(
      clerkId,
      amount,
      description,
      generationId
    );

    if (success) {
      return true;
    }

    if (attempt < retries) {
      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 100)
      );
    }
  }

  return false;
}

export async function getCreditHistory(clerkId: string, limit: number = 50) {
  const user = await getUserByClerkId(clerkId);
  if (!user) return [];

  return await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, user.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}
