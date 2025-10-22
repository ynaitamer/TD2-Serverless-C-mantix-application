// deno_server.ts
function handlePreFlightRequest(): Response {
  return new Response("Preflight OK!", {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
}

async function handler(_req: Request): Promise<Response> {
  // Preflight
  if (_req.method === "OPTIONS") {
    return handlePreFlightRequest();
  }

  // Extra debug log
  console.log("Incoming request:", _req.method, _req.url);

  // Extra headers common to all responses
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
  };

  try {
    const url = new URL(_req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const word1 = pathSegments[pathSegments.length - 1] || "";

    if (!word1) {
      return new Response(JSON.stringify({ error: "No word provided in path" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Prepare POST to external similarity API
    const word2 = "chaussure";
    console.log("Calling similarity API with:", { word1, word2 });

    const response = await fetch("https://word2vec.nicolasfley.fr/similarity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word1, word2 }),
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error("Similarity API error:", response.status, txt);
      return new Response(JSON.stringify({ error: "Similarity API error", status: response.status, body: txt }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    const result = await response.json();
    console.log("Similarity result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error("Handler error:", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: {
        ...corsHeaders,
      },
    });
  }
}

Deno.serve(handler);
