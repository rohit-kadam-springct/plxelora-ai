import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateImage, type GenerationRequest } from "@/lib/openrouter";
import { deductCreditsWithRetry, getUserCredits } from "@/lib/db/operations";
import { db, users, generations } from "@/lib/db";
import { eq } from "drizzle-orm";
import { uploadToImageKit } from "@/lib/imagekit";

const CREDITS_PER_GENERATION = 2;
const MAX_PROMPT_LENGTH = 600;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, aspectRatio = "16:9" } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check credits
    const userCredits = await getUserCredits(userId);
    if (userCredits < CREDITS_PER_GENERATION) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          creditsRequired: CREDITS_PER_GENERATION,
          creditsAvailable: userCredits,
        },
        { status: 402 }
      );
    }

    // Create generation record
    const [generationRecord] = await db
      .insert(generations)
      .values({
        userId: user.id,
        prompt: prompt.trim(),
        status: "PROCESSING",
        creditsUsed: CREDITS_PER_GENERATION,
        width:
          aspectRatio === "16:9" ? 1280 : aspectRatio === "9:16" ? 720 : 1024,
        height:
          aspectRatio === "16:9" ? 720 : aspectRatio === "9:16" ? 1280 : 1024,
      })
      .returning();

    // Deduct credits
    const creditDeducted = await deductCreditsWithRetry(
      userId,
      CREDITS_PER_GENERATION,
      "Thumbnail generation",
      generationRecord.id
    );

    if (!creditDeducted) {
      await db
        .update(generations)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(generations.id, generationRecord.id));

      return NextResponse.json(
        { error: "Failed to deduct credits" },
        { status: 500 }
      );
    }

    try {
      // Generate image using OpenRouter library
      const generationRequest: GenerationRequest = {
        prompt: prompt.trim(),
        aspectRatio: aspectRatio as "16:9" | "9:16" | "1:1",
        model: "GEMINI_IMAGE",
      };

      const result = await generateImage(generationRequest);

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || "Failed to generate image");
      }

      // Upload on imagekit
      let finalImageUrl = result.imageUrl;
      if (result.imageUrl.startsWith("data:image/")) {
        console.log("📤 Uploading to ImageKit...");

        const filename = `thumbnail-${generationRecord.id}.png`;
        const uploadResult = await uploadToImageKit(result.imageUrl, filename);

        if (uploadResult.success && uploadResult.url) {
          finalImageUrl = uploadResult.url;
          console.log("✅ Uploaded to ImageKit:", uploadResult.url);
        } else {
          console.log(
            "⚠️ ImageKit upload failed, using base64:",
            uploadResult.error
          );
          // Continue with base64 URL as fallback
        }
      }

      // Update generation record with success
      await db
        .update(generations)
        .set({
          imageUrl: finalImageUrl,
          status: "COMPLETED",
          updatedAt: new Date(),
        })
        .where(eq(generations.id, generationRecord.id));

      return NextResponse.json({
        imageUrl: finalImageUrl,
        prompt: prompt.trim(),
        status: "completed",
        generationId: generationRecord.id,
        usage: result.usage,
      });
    } catch (error: any) {
      console.error("Generation error:", error);

      // Update generation record with failure
      await db
        .update(generations)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(generations.id, generationRecord.id));

      // Refund credits on failure
      await deductCreditsWithRetry(
        userId,
        -CREDITS_PER_GENERATION,
        "Generation failed - refund",
        generationRecord.id
      );

      return NextResponse.json(
        {
          imageUrl: null,
          prompt: prompt.trim(),
          status: "failed",
          error: error.message || "Failed to generate image",
          generationId: generationRecord.id,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
