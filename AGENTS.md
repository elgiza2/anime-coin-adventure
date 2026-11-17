<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- App is Arabic RTL (`dir="rtl"` on `<html>`); use logical directions (origin-right for RTL progress, ChevronLeft = forward). Why: every screen reads right-to-left.
- Start page is a story onboarding in `src/components/onboarding/` with slide content in `story-slides.ts`; visual tokens (glass, story-fade, btn-cta, story animations) live in `src/styles.css`. Why: slides and copy change often without touching layout.
- Wallet connection uses TON Connect via the lazy browser-only singleton in `src/lib/ton-connect.ts`; its manifest and icon are served from `/api/public/*` (never `public/`), and login-protected preview hosts are mapped to the public dev host. Why: wallets fetch the manifest from their own servers, so it must be reachable without a login.
- Each start slide has a live canvas effect (`StoryEffects.tsx`) chosen by the slide's `effect` field; effect anchor points are fractions of the artwork, so they must be re-tuned if a slide image changes. Each slide plays a looping muted clip (`video`) with its still `image` as poster; clips are 720x1280, no audio, and must start on the still so the poster-to-video swap is invisible.
- The Supabase database is shared with the owner's other bots; this app's tables and functions use the `wall_` prefix and never touch other prefixes. Why: avoids clobbering other apps' data.
- Players are identified by Telegram Mini App `initData`, verified server-side with `TELEGRAM_BOT_TOKEN` (`src/lib/telegram.server.ts`); player tables are server-only (service role), and balance changes go through `wall_*` security-definer functions. Why: there is no Supabase Auth; the browser must never write balances.
- Task/check-in rules live in `src/lib/tasks-model.ts` (tested) and are mirrored by the `wall_daily_checkin` / `wall_claim_task` DB functions; change both together. Why: the UI predicts states that the DB enforces.
- Icons are animated Lottie emoji from Telegram's "The Open Emoji" pack, stored as asset JSON and registered in `src/components/emoji/emoji-registry.ts`; `AnimatedEmoji` tints them from CSS `color`. Why: owner wants this pack instead of icon fonts; the pack is monochrome repaintable.
- The coin name/symbol lives only in `src/lib/coin.ts`. Why: the final name is not decided yet.
- Hero economy (5 heroes x 200 levels, storage cap, costs) lives in src/lib/heroes-model.ts (tested) and is mirrored by wall_hero_rate/wall_hero_cost/wall_upgrade_hero in the DB; change both together. Why: UI predicts what the DB enforces.
- TON payments: server creates a wall_payments row, wallet sends to the treasury with comment wall:<id> (BOC built by commentPayload in src/lib/shop-model.ts, no Buffer), server verifies on toncenter and credits via wall_confirm_payment. Why: credits only after on-chain proof, once.
- Battle segments use two video decoders and seek only the hidden one before a crossfade. Why: avoid visible jumps, mirror flips and blank frames during playback.
- Wallet: ANIME (listed on Binance) earns player level per day via wall_anime_claim; withdrawals need 1,000 ANIME and 30 days (wall_anime_withdraw, reviewed manually); rules mirrored in src/lib/anime-model.ts (tested). Why: DB enforces what UI predicts.
- Portable source exports must include downloaded CDN assets with local pointer URLs, migrations and setup notes, excluding secrets, user data, Git metadata, dependencies and build output. Why: another developer can continue without relying on Lovable media hosting.
- Profile reads use the existing Telegram verification, return only the caller's identity and paginated direct referrals, and reuse hero standings; referral rewards remain task claims. Why: preserves player privacy and avoids inventing a separate economy.
- Mine Pass is shown as a collectible art card (`PassArt` in `src/components/profile/MinePassCard.tsx`): one shared artwork, made unique by the serial from `formatPassNumber`; the holder name is display-only from Telegram. Why: the card must read as one-per-player without a separate image service.
- NFT mints are in-game cards, not on-chain tokens: a `nft_mint` TON payment is confirmed like other payments, and `wall_confirm_payment` picks the design via `wall_nft_pick` weighted by copies left in `wall_nft_supply` (cap/reserved per design), mirroring `pickFromRemaining`/`NFT_DESIGNS` in `src/lib/nft-model.ts` (tested); change both together. Sold-out confirmations become `refund_due`. The intro uses `INTRO_VIDEO` in `src/components/nft/nft-art.ts` when set, else an animated still with a Korean voice line. Why: the server alone decides randomness and enforces supply after on-chain proof.
- Mine Pass issuance uses the existing on-chain payment confirmation transaction and a server-only pass table with a unique sequence; mining settlement returns zero without a pass and its clock resets on first issuance. Why: prevents unpaid mining, duplicate issuance and retroactive earnings.
- Vault Raid game (/raid): spin results, raids, revenge, vault pot and TON spin packs are decided only by wall_raid_* / wall_confirm_payment in the DB; src/lib/raid-model.ts (tested) mirrors the numbers. Pot pays in-game coins, never TON. Why: server-side randomness, and paid entry into a real-money prize would be gambling.
- Story riddle game (/raid, top of page): chapters and answers live only in the server-only wall_story_chapters table and are checked by wall_story_answer; src/lib/story-model.ts (tested) mirrors tries, bonus, item prices and answer normalisation. Why: answers must never reach the browser.
- Anime campaign (/raid): authored 30-chapter story in `src/lib/saga.ts` (tested); hero path/bond and one final choice per chapter are saved in wall_novel_progress.story via saveSaga, and later lines use `when: "cN:i"` to remember choices; after 30 it cycles with harder fights. Win/loss, rewards, hearts, plays, ads and TON packs stay decided by wall_novel_play / wall_novel_ad / wall_confirm_payment (`src/lib/novel-model.ts`, tested). Why: story continuity without letting the browser set outcomes.
- Videos are cache-warmed one by one (NFT intro first) via src/lib/video-preload.ts. Why: instant playback, no lag.
