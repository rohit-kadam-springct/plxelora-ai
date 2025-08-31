import { generateText } from "@/lib/openrouter";

export async function extractCombinedStyleMetadata(
  imageUrls: string[]
): Promise<any> {
  try {
    const combinedPrompt = `
    Analyze these ${imageUrls.length} thumbnail images and extract unified style characteristics:
    
    Create a comprehensive style guide with:
    - colorPalette: Most common colors and schemes across all images
    - typography: Consistent font styles and text treatments  
    - composition: Layout patterns and element positioning
    - visualStyle: Overall aesthetic (modern, minimal, bold, etc.)
    - mood: Emotional tone (professional, energetic, calm, etc.)
    - designElements: Common effects (gradients, shadows, borders, etc.)
    - brandingElements: Consistent visual themes and patterns
    
    Analyze patterns that appear in multiple images to identify the core style.
    Return as JSON with confidence scores for each element.`;

    const result = await generateText(combinedPrompt, "GEMINI_TEXT", 500);

    if (result.success && result.content) {
      try {
        const combined = JSON.parse(result.content);
        return {
          ...combined,
          imageCount: imageUrls.length,
          extractedAt: new Date().toISOString(),
        };
      } catch {
        return {
          description: result.content,
          imageCount: imageUrls.length,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Combined style extraction error:", error);
    return null;
  }
}
