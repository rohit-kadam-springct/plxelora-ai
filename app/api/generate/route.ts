import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateImage, type GenerationRequest } from "@/lib/openrouter";
import { uploadToImageKit } from "@/lib/imagekit";
import { deductCreditsWithRetry, getUserCredits } from "@/lib/db/operations";
import { db, users, generations, personas, styles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getDimensions, type AspectRatio } from "@/lib/image-dimensions";

const CREDITS_PER_GENERATION = 2;
const MAX_PROMPT_LENGTH = 600;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      prompt,
      aspectRatio = "16:9",
      personaId,
      styleId,
      editGenerationId,
    } = body;

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

    // Get persona and style data
    let persona = null,
      style = null;

    if (personaId) {
      [persona] = await db
        .select()
        .from(personas)
        .where(eq(personas.id, personaId))
        .limit(1);
    }

    if (styleId) {
      [style] = await db
        .select()
        .from(styles)
        .where(eq(styles.id, styleId))
        .limit(1);
    }

    // Get fixed dimensions for aspect ratio
    const dimensions = getDimensions(aspectRatio as AspectRatio);

    // Enhanced prompt with persona/style context
    let enhancedPrompt = `Create a professional ${dimensions.name} thumbnail (${dimensions.width}x${dimensions.height}): ${prompt}`;

    if (persona) {
      enhancedPrompt += ` | Persona: ${persona.name} | Reference person image: ${persona.imageUrl} | Include the persona in the thumbnail image | `;
    }

    if (style?.extractedMetadata) {
      const metadata = style.extractedMetadata as any;
      if (metadata.colorPalette)
        enhancedPrompt += ` | Colors: ${JSON.stringify(metadata.colorPalette)}`;
      if (metadata.visualStyle)
        enhancedPrompt += ` | Style: ${metadata.visualStyle}`;
      if (metadata.mood) enhancedPrompt += ` | Mood: ${metadata.mood}`;
    }

    enhancedPrompt += ` | Technical: ${dimensions.width}x${dimensions.height} resolution, high quality, sharp focus, optimized for thumbnail viewing`;

    // Create generation record
    const [generationRecord] = await db
      .insert(generations)
      .values({
        userId: user.id,
        prompt: prompt.trim(),
        enhancedPrompt,
        status: "PROCESSING",
        creditsUsed: CREDITS_PER_GENERATION,
        width: dimensions.width,
        height: dimensions.height,
        personaId: personaId || null,
        styleId: styleId || null,
        parentGenerationId: editGenerationId || null,
        dimensions: {
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio,
          name: dimensions.name,
        },
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
      // Generate image using OpenRouter
      const generationRequest: GenerationRequest = {
        prompt: enhancedPrompt,
        aspectRatio: aspectRatio as "16:9" | "9:16" | "1:1",
        model: "GEMINI_IMAGE",
        personaImage: persona?.imageUrl,
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
        dimensions: {
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio,
          name: dimensions.name,
        },
        persona: persona ? { name: persona.name } : null,
        style: style ? { name: style.name } : null,
        usage: result.usage,
        storedInImageKit: finalImageUrl !== result.imageUrl,
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
