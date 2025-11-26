import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { OpenAI } from "npm:openai@4.67.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const { texts } = await req.json();

    if (!texts || !Array.isArray(texts)) {
      return new Response(
        JSON.stringify({ error: "texts array is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });

    const embeddings = response.data.map((item) => item.embedding);

    return new Response(
      JSON.stringify({ embeddings }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error generating embeddings:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate embeddings",
        status: error.status || 500,
      }),
      {
        status: error.status || 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
