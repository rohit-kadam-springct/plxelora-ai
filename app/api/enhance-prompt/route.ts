import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { openai, type EnhancedPrompt } from "@/lib/openai";
import { ratelimit } from "@/lib/ratelimit";

const MAX_PROMPT_CHARS = 450;

const ENHANCEMENT_SYSTEM_PROMPT = `You are an expert AI prompt engineer specializing in visual content generation. Your task is to enhance user prompts for thumbnail creation to get the best results from image generation AI.

CRITICAL: Keep enhanced prompt under ${MAX_PROMPT_CHARS} characters to fit model constraints.

GUIDELINES:
- Transform basic ideas into detailed, specific visual descriptions
- Add relevant style elements, composition details, and visual appeal factors
- Include elements that make thumbnails click-worthy and engaging
- Maintain the user's original intent while adding professional polish
- Consider YouTube/social media thumbnail best practices
- Add specific details about colors, lighting, composition, and visual hierarchy

RESPONSE FORMAT (JSON):
{
  "enhanced": "detailed enhanced prompt",
  "improvements": ["list of specific improvements made"],
  "confidence": 0.85,
  "estimatedCredits": 2
}

ENHANCEMENT FOCUS:
1. Visual Clarity - Make descriptions more specific and vivid
2. Composition - Add details about layout, framing, and visual hierarchy  
3. Style Elements - Include color palettes, lighting, and aesthetic choices
4. Engagement - Add elements that increase click-through appeal
5. Technical Quality - Include quality modifiers and rendering style

Make thumbnails that grab attention and drive clicks!
CRITICAL REQUIREMENT: Enhanced prompt must be below ${MAX_PROMPT_CHARS} characters or less. Be concise but descriptive.
`;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const { success } = await ratelimit.limit(userId);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { prompt, context } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "Prompt must be less than 500 characters" },
        { status: 400 }
      );
    }

    // Build context-aware user message
    let userMessage = `Original prompt: "${prompt}"`;

    if (context?.style) {
      userMessage += `\nStyle preference: ${context.style}`;
    }

    if (context?.type) {
      userMessage += `\nThumbnail type: ${context.type}`;
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: ENHANCEMENT_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    let enhancedData;
    try {
      enhancedData = JSON.parse(responseContent);
    } catch (error) {
      throw new Error("Failed to parse OpenAI response");
    }

    // Validate response structure
    if (!enhancedData.enhanced || !Array.isArray(enhancedData.improvements)) {
      throw new Error("Invalid response structure from OpenAI");
    }

    const result: EnhancedPrompt = {
      original: prompt.trim(),
      enhanced: enhancedData.enhanced,
      improvements: enhancedData.improvements,
      confidence: Math.min(Math.max(enhancedData.confidence || 0.8, 0), 1),
      estimatedCredits: enhancedData.estimatedCredits || 2,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error enhancing prompt:", error);

    if (error.code === "insufficient_quota") {
      return NextResponse.json(
        {
          error: "AI service temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to enhance prompt" },
      { status: 500 }
    );
  }
}
