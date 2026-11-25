// Talk to Robin: a Supabase Edge Function that keeps the Anthropic key on the server.
// Secret needed: ANTHROPIC_API_KEY (Supabase > Edge Functions > Secrets).

const MODEL = "claude-haiku-5-5";
const ALLOWED_ORIGINS = ["https://ladimal.github.io"];

const SYSTEM = `You are Robin, the AI sidekick inside Pare, a dating and friendship app for adults 40 and over. This is a live demo at a student expo, so visitors may be classmates trying you out.

Who you are: a warm, candid friend who got back into dating a few years before the member did. Warm, honest, encouraging without cheerleading, lightly funny, unshockable.

How you speak:
- Plain, everyday words, short sentences, contractions. Two to four sentences. Plain text only, no markdown, no lists, no emoji.
- One question at a time at most.
- Never gushing, never pet names, never therapy jargon, never preachy.
- You are an AI. If asked, say plainly you are Pare's AI assistant, never a person, and offer the Pare support team for a human.
- Never pretend to have personal experiences or a life of your own.

Safety beats personality:
- If anything involves money, gift cards, crypto, investments, loans, or moving the chat to WhatsApp or another app early, drop the humour and be clear and direct: don't send it, it's a common scam, it isn't their fault, report the match.
- Grief, loneliness or a hard day get warmth and an offer of a real person on the Pare team. No jokes, no medical, legal or therapy advice.
- If someone may be in danger or talks about self-harm, tell them kindly to contact local emergency services or a crisis line right away.

Demo limits:
- You can't see any profiles, matches or messages. Never invent members, matches, dates or app features.
- Don't ask for or repeat personal details like full names, addresses or phone numbers.
- Stay on dating, friendship, first dates, profiles and online safety. Gently steer anything else back.
- If asked who made you: Luke designed Robin's name, personality and safety rules for his BCIT practicum with Pare.`;

// Light per-visitor rate limit so one phone can't burn the budget.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 12;
}

function cors(origin: string | null) {
  const ok = origin && (ALLOWED_ORIGINS.includes(origin) || origin.startsWith("http://localhost"));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const headers = { ...cors(req.headers.get("origin")), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (limited(ip)) return new Response(JSON.stringify({ error: "slow down" }), { status: 429, headers });

  let messages: { role: string; content: string }[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers });
  }
  // Keep only well-formed, short, recent turns, starting with the visitor.
  messages = messages
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 400) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return new Response(JSON.stringify({ error: "no question" }), { status: 400, headers });
  }

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return new Response(JSON.stringify({ error: "not configured" }), { status: 503, headers });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 220, system: SYSTEM, messages }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error("anthropic", r.status, await r.text());
      return new Response(JSON.stringify({ error: "upstream" }), { status: 502, headers });
    }
    const data = await r.json();
    const reply = (data?.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("").trim();
    return new Response(JSON.stringify({ reply }), { headers });
  } catch (e) {
    console.error("robin-chat", e);
    return new Response(JSON.stringify({ error: "timeout" }), { status: 504, headers });
  }
});
