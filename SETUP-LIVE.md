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
