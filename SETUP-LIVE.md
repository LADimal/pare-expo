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
