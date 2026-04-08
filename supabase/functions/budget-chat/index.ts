import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, budgetData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a financial analyst assistant specializing in marketing budget analysis. You have access to the user's budget data:

Total Budget: $${budgetData.totalBudget?.toLocaleString() || 'N/A'}
New ARR: $${budgetData.newARR?.toLocaleString() || 'N/A'}
CAC: $${budgetData.cac?.toLocaleString() || 'N/A'}
ACV: $${budgetData.averageContractValue?.toLocaleString() || 'N/A'}
Gross Margin: ${budgetData.grossMargin || 'N/A'}%
Annual Churn Rate: ${budgetData.annualChurnRate || 'N/A'}%

Budget Allocations:
- Demand Gen: ${budgetData.demandGen || 'N/A'}
- Content: ${budgetData.content || 'N/A'}
- Field: ${budgetData.field || 'N/A'}
- Brand: ${budgetData.brand || 'N/A'}
- Ecosystem: ${budgetData.ecosystem || 'N/A'}
- Martech: ${budgetData.martech || 'N/A'}
- Headcount: ${budgetData.headcount || 'N/A'}

Provide clear, concise answers about budget performance, recommendations, and insights. Use the data to support your analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
