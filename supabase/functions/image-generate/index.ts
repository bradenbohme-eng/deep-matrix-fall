// V3 Image Editor - AI Image Generation Edge Function
// Uses Lovable AI with google/gemini-2.5-flash-image (nano banana pro)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type = "generate", imageBase64 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${type} request with prompt:`, prompt);

    // Build messages based on type
    const messages: any[] = [
      {
        role: "system",
        content: "You are an AI image generation assistant. Generate high-quality images based on user prompts. Focus on photorealistic, professional results suitable for photo editing applications."
      }
    ];

    if (type === "edit" && imageBase64) {
      // Image editing with reference
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Edit this image: ${prompt}`
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`
            }
          }
        ]
      });
    } else {
      // Pure text-to-image generation
      messages.push({
        role: "user",
        content: `Generate an image: ${prompt}. Make it high quality, professional, and suitable for photo editing.`
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data).substring(0, 200));

    // Extract image URL or base64 from response
    const content = data.choices?.[0]?.message?.content;
    
    // Check if content contains an image
    let imageUrl = null;
    if (typeof content === "string") {
      // Try to extract image URL from markdown or direct URL
      const urlMatch = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
      if (urlMatch) {
        imageUrl = urlMatch[1];
      } else if (content.startsWith("http")) {
        imageUrl = content.trim();
      }
    } else if (Array.isArray(content)) {
      // Check for image content parts
      for (const part of content) {
        if (part.type === "image_url" && part.image_url?.url) {
          imageUrl = part.image_url.url;
          break;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        rawContent: content,
        prompt 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
