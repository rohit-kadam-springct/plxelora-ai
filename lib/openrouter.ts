import OpenAI from "openai";

// Initialize OpenRouter client with OpenAI SDK
const openRouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    //   "HTTP-Referer": "http://localhost:3000", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "Pixelora AI - Dev", // Your app name for OpenRouter analytics
  },
});

// Available models through OpenRouter
export const OPENROUTER_MODELS = {
  GEMINI_IMAGE: "google/gemini-2.5-flash-image-preview:free",
  GEMINI_TEXT: "google/gemini-2.5-flash:free",
  DALLE_3: "openai/dall-e-3",
  STABLE_DIFFUSION: "stabilityai/stable-diffusion-xl-base-1.0",
} as const;

export interface GenerationRequest {
  prompt: string;
  model?: keyof typeof OPENROUTER_MODELS;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResponse {
  success: boolean;
  content: string | null;
  imageUrl: string | null;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function generateImage(
  request: GenerationRequest
): Promise<GenerationResponse> {
  try {
    const {
      prompt,
      model = "GEMINI_IMAGE",
      aspectRatio = "16:9",
      maxTokens = 4000,
      temperature = 0.7,
    } = request;

    // Enhanced prompt for better thumbnail results
    const enhancedPrompt = `Create a professional, high-quality thumbnail image: ${prompt}
Style: Eye-catching, vibrant colors, sharp focus, suitable for social media and YouTube
Format: ${aspectRatio} aspect ratio, clean composition, engaging visual design
Technical: Professional photography quality, good contrast, optimized for small preview sizes`;

    const response = await openRouterClient.chat.completions.create({
      model: OPENROUTER_MODELS[model],
      messages: [
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    const content = response.choices[0]?.message?.content;
    const usage = response.usage;

    if (!content) {
      return {
        success: false,
        content: null,
        imageUrl: null,
        error: "No content generated from the model",
      };
    }

    // Check if response contains image URL or base64 data
    let imageUrl: string | null = null;

    // Look for image URLs in the response
    const urlMatch = content.match(
      /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i
    );
    if (urlMatch) {
      imageUrl = urlMatch[0];
    }

    // Look for base64 image data
    const base64Match = content.match(/image\/[^;]+;base64,[^\s]+/);
    if (base64Match) {
      imageUrl = base64Match[0];
    }

    // If no image found, create placeholder for now
    if (!imageUrl) {
      const encodedPrompt = encodeURIComponent(prompt.substring(0, 30));
      const dimensions =
        aspectRatio === "16:9"
          ? "1280x720"
          : aspectRatio === "9:16"
          ? "720x1280"
          : "1024x1024";
      imageUrl = `https://via.placeholder.com/${dimensions}/6366f1/ffffff?text=${encodedPrompt}`;
    }

    return {
      success: true,
      content,
      imageUrl,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
    };
  } catch (error: any) {
    console.error("OpenRouter generation error:", error);

    // Handle rate limiting
    if (error.status === 429) {
      return {
        success: false,
        content: null,
        imageUrl: null,
        error: "Rate limit exceeded. Please wait before trying again.",
      };
    }

    // Handle insufficient credits
    if (error.status === 402) {
      return {
        success: false,
        content: null,
        imageUrl: null,
        error:
          "Insufficient OpenRouter credits. Please add more credits to your account.",
      };
    }

    return {
      success: false,
      content: null,
      imageUrl: null,
      error: error.message || "Failed to generate image",
    };
  }
}
