# Roadmap

- [x] Fix empty identity snapshots on delayed Telegram SDK launches across player pages and admin; browser regression verified, signatures still checked by server.
- [x] Ask for Telegram write-access permission once on direct Mini App launches; skip existing permission and respect denial (SDK simulation verified).
- [ ] Verify affected user's rewards and native permission dialog inside Telegram — requires that user's real Mini App launch; simulated launches cannot confirm this.

- [x] Telegram bot key added
- [x] Mine Pass as a collectible art card with each player's unique number
- [x] Battle page: remove hero strip and watch-ad button; pass card text laid out cleanly underneath
- [x] NFT page + button on battle page: animated intro, then NFT card with Mint (5 TON assumed), random NFT per mint
- [ ] Generate the real intro video (Mikasa says "time for war" in Korean, camera rushes ground→sky→stars, stops) — blocked: workspace needs ~11 credits
- [x] Owner confirmed: 5 TON per mint; wants real on-chain NFTs
- [ ] Real TON NFTs in the player wallet — later step: needs a published NFT collection on TON and a funded minter wallet key from the owner
- [x] Fair NFT mint: limited copies per card, 10,000 total with 9,164 already taken (836 open), live remaining counter
- [x] Mikasa video added
- [ ] More design changes — waiting for owner's direction

- [x] Mandatory Mine Pass: 0.05 TON, confirmed payment, unique number, verification badge and mining gate; actual wallet transfer requires Telegram and a funded TON wallet

- [x] Profile page: Telegram identity, progression, own paginated referral team, leaderboard and story replay; live identity reads require Telegram launch to verify

- [x] Remove battle counter and crossfade video segments without visible seeks
- [x] Wallet page based on references, with real balance and TON connection; authenticated reads/payment confirmation require Telegram launch to verify
- [x] Portable source ZIP including all images, videos and emoji, without secrets
- [ ] GitHub repository link — requires owner to connect Git sync in Project settings

- [x] Start page (story onboarding, animated slides, wallet button on last slide)
- [x] Fix wallet connect button (wallets couldn't read the app info behind the preview login)
- [x] Tasks page (/tasks): daily check-in streak, category chips, task cards, real data, garrison background, animated emoji from "The Open Emoji" pack
- [x] Heroes page: 5 heroes x 200 levels, mining storage, coin upgrades, leaderboard
- [x] Heroes page redesign: simpler, clearer; new hero art (Survey-Corps-style squad), still images only — no generated videos
- [x] TON-only payments: buy coin packs with TON, verified on-chain
- [x] Monetag rewarded ads (zone 12281067): watch ad for coins
- [ ] Rename coin once the owner sends the real name (one place: coin setting)
- [x] Videos for heroes 3-5 (آرين، ليوك، إيفان)
- [ ] Later (on hold): VIP; more bottom-nav pages
- [x] Watch-ad task on the Tasks page (Monetag, unlimited)
- [x] Games: Vault Raid page (wheel, raids + revenge, vault jackpot in coins, TON spin packs); button on war page
- [x] Games page in the bottom navigation as "الغارات", renamed "غارات الأسوار", own nav bar; its card button removed from the battle page
- [x] Illustrated story game: daily chapter with artwork + riddle the community solves together in https://t.me/micahub; server-checked answers, 3 free tries/day, TON item shop (hint, reveal a letter, extra tries)
- [x] Bot token + news channel saved; app opens full-screen with safe space under Telegram's buttons; /start message (English, bold, colored buttons)
- [x] Admin panel at /101 (@eigiza, @torker): stats, payment alerts, task add/edit/delete, task-only sub-admins
- [x] Daily bot reminders (3/day) + daily chat gift — needs an external scheduler (cron-job.org) calling the daily link every 10 min
- [x] 30 English posts with images; day 1 posted, rest auto-post daily
- [ ] Custom emoji packs in /start — needs the bot to own a Fragment username (Telegram rule)
- [x] Verified badge from Des_Ch_9722f_by_TgEmodziBot pack
- [x] Pages fit screen without scroll; safe top area same background
- [x] Reopen app on last page, not the start
- [x] Min withdraw 10,000 ANIME
- [x] Channel post day 1 published; days 2–30 auto-post daily from 14:00 UTC
- [x] Coin shop price = 30% below market
- [x] Translate remaining untranslated text (story + all pages)
- [x] Translation coverage checked in all 15 locales: static screens, story dialogue, riddle translations and bot message variables (129 tests pass)
- [x] Automatic language selection: all Telegram language codes tested; device-language fallback verified in browser without a saved preference
- [ ] Verify translated live player data and bot delivery inside Telegram — requires a real Telegram Mini App launch; public/browser checks do not cover this
- [x] Publish day 2 community post on explicit request (2026-11-18)
- [x] Resume translation review after day 2 publication: 135 page/language checks, 60 welcome slides and 45 game tabs; no untranslated Arabic in non-Persian screens
- [x] Start (welcome) pages translated (checked en/ru/ja/fa)
- [x] Admin panel: /101 in the bot now replies with an Open admin panel button (admins only)
- [x] Tasks: join community, join group, unlimited ads
- [ ] Publish day-3 channel post
