# PlanEat — handoff (for Antigravity / Claude Code / any developer)

Calorie tracker with a Liquid Glass UI. Plain HTML/CSS/JS (no build step), installable PWA.
Live: https://planeat-alpha-2.web.app  ·  Firebase project: `planeat-alpha-2` (Spark plan, no billing)

## Files
| File | What it is |
|---|---|
| `index.html` | Shell, PWA tags, loads `config.js` then `app.js` |
| `app.js` | Whole app (~1,700 lines): onboarding, dashboard, week view, AI calls, tips, Snap to Eat |
| `styles.css` | Liquid Glass design system (tokens in `:root`) |
| `config.js` | Public config: `FIREBASE_CONFIG`, `APPCHECK_SITE_KEY`, `GEMINI_MODEL`. No secrets. |
| `sw.js` | Service worker, network-first. **Bump `CACHE` (e.g. v3 → v4) when shipping changes** |
| `manifest.webmanifest`, `icons/` | PWA |
| `firebase.json`, `.firebaserc` | Hosting config (site `planeat-alpha-2`, public dir `.`) |

Data lives only in the browser (`localStorage` key `planeat.v1`). No accounts yet.

## AI (Firebase AI Logic → Gemini)
- Model: `gemini-3.5-flash-lite` (set in `config.js`). Chosen after benchmark: faster and more consistent than 3.1 Flash-Lite, longest-lived (no shutdown announced). 3.5 Flash / 3.8 Flash had no free quota or hung during testing.
- Request path: `geminiViaFirebase()` in `app.js` (SDK 13.2.0 from gstatic CDN, `thinkingLevel: LOW`, structured JSON schema). `GEMINI_API_KEY` in config is an optional local fallback only. Do not send `temperature`/`top_p` to 3.x models.
- Calls: text → `aiParseFood`, photo → `aiParsePhoto` (photo resized to 1024 px JPEG in the browser, never stored), explanation text → `aiTargets`.
- **Onboarding numbers come from the Mifflin-St Jeor formula in code (`computeTargets`)**, not the model: the Lite model under-shot calorie targets in testing. Gemini only writes the explanation; a built-in text is used if AI fails.
- Prompt rules: follow the user's own food list; rice/noodles + side dishes on one plate = ONE item ("Nasi Uduk Komplit", components in the portion field); drinks, fruit, snacks stay separate.
- Errors are shown to the user (no fake fallback data) with the real reason in a small box (`friendlyError`).
- Tips card is an offline library (`TIPS`), no AI.

## Security
- App Check: reCAPTCHA Enterprise key `6Lc69hIuAAAAAGNUjjrxgzICTdUvRazB1QvbMafE` (domains: web.app + firebaseapp.com), registered in the console. **Enforcement for Firebase AI Logic is NOT switched on yet**: confirm real-device traffic shows as *Verified* in Firebase console → App Check → APIs, then Enforce.
- Localhost needs an App Check debug token: create it in console → App Check → Apps → ⋮ → Manage debug tokens, put it in a local, uncommitted copy of `config.js` as `APPCHECK_DEBUG_TOKEN`. Never commit it.
- The Firebase browser API key is restricted to the two hosting domains + `http://localhost:8000/*` and Firebase APIs only (no Generative Language API).

## Run / deploy
- Local: `python3 -m http.server 8000` → http://localhost:8000
- Deploy: `firebase deploy --only hosting`
- **Never run `firebase init hosting` again: it overwrites `index.html` and creates `404.html`.**

## Known limits / next steps
1. Login (Google) + saving meal records in Firestore (one document per user per day; owner-only rules, see `PlanEat_v1.0/frontend/firestore.rules` for a good pattern).
2. Enforce App Check (see above).
3. Photo portion accuracy is untested on real meals (only a coffee photo and a non-food photo were used).
4. Free-tier Gemini quota is per project and small; plan Blaze + budget alerts before a public launch. Free tier lets Google use submitted content (including photos) to improve products: write a privacy policy / consider paid tier.
5. Weak spot found in benchmark: Indonesian fried foods can be under-estimated (tempe goreng ≈ 192 kcal/100 g vs ~330 expected).
