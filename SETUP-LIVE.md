# Live vote setup

Status (2026-11-25): done. The site is connected to Luke's Supabase project `pare-expo` (Canada Central, Free plan). The Talk to Robin chat was dropped, so steps 2 and 3 below are not needed.

## Original guide

The site works without any of this: Robin answers with built-in replies and votes stay on each phone. These steps make Robin use real AI and make votes appear live on the big screen. Allow about 20 minutes.

## 1. Create the Supabase project (free)
1. Sign up at supabase.com and create a new project. Any name and region close to Vancouver is fine.
2. Open **SQL Editor**, paste all of `supabase/setup.sql`, and press **Run**.

## 2. Add the AI key
1. At console.anthropic.com, add about $5 of credit and create an API key.
2. Under **Settings > Limits**, set a monthly spend limit (for example $10).
3. In Supabase, open **Edge Functions > Secrets** and add a secret named `ANTHROPIC_API_KEY` with the key as its value. Never put the key in the website or in chat.

## 3. Create the robin-chat function
1. In Supabase, open **Edge Functions > Deploy a new function > Via editor**.
2. Name it `robin-chat`, replace the sample code with all of `supabase/functions/robin-chat/index.ts`, and deploy.
3. In the function's settings, turn off **Enforce JWT verification** (visitors aren't signed in).

## 4. Connect the website
In **Project Settings > API**, copy the **Project URL** and the **anon public** key, and put them in `index.html` where it says `window.PARE_LIVE` (`supabaseUrl` and `supabaseAnonKey`). The anon key is meant to be public.

## On the day
- Big screen: open `https://ladimal.github.io/pare-expo/#results` on the laptop or projector. It updates every 2 seconds.
- Reset the vote before you start: in SQL Editor run `truncate public.votes;`
- If the Wi-Fi drops, Robin switches to built-in replies and votes are sent when phones reconnect.

# Talk to Robin (AI chat) setup

Until this is done, the chat uses Robin's built-in replies. Nothing breaks.

1. **AI key.** At console.anthropic.com: sign up, add $5 of credit under Billing, then set a monthly spend limit (Settings > Limits). Create a key under API Keys and copy it. Never paste it into chat or the website.
2. **Store the key in Supabase.** Edge Functions > Secrets > Add new secret. Name: `ANTHROPIC_API_KEY`. Value: the key.
3. **Create the function.** Edge Functions > Deploy a new function > Via editor. Name it `robin-chat`, replace the sample with all of `supabase/functions/robin-chat/index.ts`, and deploy.
4. **Let visitors reach it.** In the function's Details/Settings, turn **off** "Verify JWT" (Enforce JWT verification), and save.

Safety limits built in: replies are short (max 220 tokens), one phone can send 12 messages a minute, the function stops calling the AI after 1,500 replies a day, and the console spend limit caps the bill. If anything fails, the site falls back to built-in replies.

**Updating the function later.** Open Edge Functions > `robin-chat` > Code, replace everything with the latest `supabase/functions/robin-chat/index.ts`, and deploy again. The secret and the Verify JWT setting stay as they are.

## How the chat screens messages

Every chat message goes through Pare's screening on the phone before the AI sees it, following the Message Screening Design spec (category, action allow / warn / review / hold, reason code, rule version):

- Flagged messages never reach the AI. Robin answers with a fixed safety reply and a "Pare screening" label showing the action, category and reason code.
- Checks cover money and gift cards, crypto and investment pitches, codes and passwords, security-question fishing (first pet, maiden name, first school, birthplace), threats and extortion, harassment, unwanted sexual content, phone numbers (masked) and home-alone or address questions.
- Disguises are undone first: l33t spelling, s p a c e d letters, s.e.p.a.r.a.t.o.r.s, stretched letters, full-width letters, accents, money and gift emoji, and common Spanish, French and German phrases.
- A question split across the last three messages is still caught.
- Attempts to jailbreak Robin, read her instructions, or bait her into being rude or flirty get an in-character reply without the AI.
- The AI's reply is checked again before it is shown. Anything odd is swapped for a built-in reply.

Tests: Luke's 51 text seed cases from Appendix A, plus 86 trick messages, run in a phone-sized browser.
