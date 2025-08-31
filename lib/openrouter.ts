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
  personaImage?: string;
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
    const enhancedPrompt = `Generate a professional, high-quality thumbnail image using the ENTIRE CANVAS with NO borders, padding, or empty space. Fill the complete frame edge-to-edge with vibrant, engaging content: ${prompt}

    CRITICAL REQUIREMENTS:
    - Use 100% of the available canvas space
    - NO white borders, margins, or padding around edges
    - Fill the entire ${aspectRatio} aspect ratio completely
    - Center and emphasize the MAIN SUBJECT so it dominates the frame
    - Strong focal point with clear hierarchy (no clutter)
    - Sharp focus, vibrant colors, and high contrast
    - Optimized for social media and YouTube thumbnails
    - Output resolution: minimum 1280x720 (HD) or higher
    - Professional finish: clean, polished, eye-catching

    AVOID: Empty space, borders, margins, padding, blank areas, unused canvas space, or weak subject placement

    STYLE: Bold, professional, cinematic or photorealistic (depending on subject), designed to instantly capture attention in a feed.`;

    console.log("🚀 Sending request to OpenRouter...");

    const messages: any = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: enhancedPrompt,
          },
        ],
      },
    ];

    {
    }

    // ✅ If persona image provided, include it in the message
    if (request.personaImage) {
      const ratio = aspectRatio.split(":");
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: `${request.personaImage}?tr=ar-${ratio[0]}-${ratio[1]},cm-pad_resize,bg-F3F3F3`,
        },
      });
    }

    const response = await openRouterClient.chat.completions.create({
      model: OPENROUTER_MODELS[model],
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content;
    const usage = response.usage;

    console.log("📝 OpenRouter response received");

    // FIXED: Extract image from the images field
    let imageUrl: string | null = null;

    // Check if the response has images field (OpenRouter format)
    if (choice?.message && "images" in choice.message) {
      const images = (choice.message as any).images;
      console.log("🖼️ Found images field:", images?.length || 0, "images");

      if (images && images.length > 0) {
        const firstImage = images[0];
        if (firstImage?.image_url?.url) {
          imageUrl = firstImage.image_url.url;
        }
      }
    }

    // Fallback: Check content for base64 data (backup method)
    if (!imageUrl && content) {
      // Check if content contains base64 data
      if (content.startsWith("image/")) {
        imageUrl = content;
        console.log("✅ Found data URL in content");
      } else if (
        content.length > 100 &&
        /^[A-Za-z0-9+/=]+$/.test(content.trim())
      ) {
        imageUrl = `image/png;base64,${content.trim()}`;
        console.log("✅ Found raw base64 in content, added prefix");
      }
    }

    // If still no image found, create placeholder
    if (!imageUrl) {
      console.log("❌ No valid image data found, using placeholder");
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
      content: content || "Image generated successfully",
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
    console.error("❌ OpenRouter generation error:", error);

    if (error.status === 429) {
      return {
        success: false,
        content: null,
        imageUrl: null,
        error: "Rate limit exceeded. Please wait before trying again.",
      };
    }

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

export async function generateText(
  prompt: string,
  model: keyof typeof OPENROUTER_MODELS = "GEMINI_TEXT",
  maxTokens: number = 500
): Promise<{ success: boolean; content: string | null; error?: string }> {
  try {
    const response = await openRouterClient.chat.completions.create({
      model: OPENROUTER_MODELS[model],
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        content: null,
        error: "No content generated",
      };
    }

    return {
      success: true,
      content,
    };
  } catch (error: any) {
    console.error("OpenRouter text generation error:", error);

    return {
      success: false,
      content: null,
      error: error.message || "Failed to generate text",
    };
  }
}
