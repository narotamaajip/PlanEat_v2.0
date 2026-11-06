# Migration plan: PlanEat (this repo) replaces PlanEat_v1.0

Decision: this app (PlanEat "Alpha 2": Liquid Glass tracker, live at https://planeat-alpha-2.web.app)
is the product. `narotamaajip/PlanEat_v1.0` (React planner) is **frozen as a reference** and must not be deleted:
it keeps the old visual style and has code we want to reuse.

## 0. Rules of engagement (Antigravity + Claude Code on the same repo)
- One repo, `main` always deployable. Every task = one branch (`feat/<name>`), small commits, push, open a PR.
- Antigravity builds. Claude Code reviews the PR (`/code-review`) and handles deploy/Firebase ops. Never edit the same branch in both tools at once; commit and push before switching tools.
- Never commit secrets or an App Check debug token. Debug token goes in the browser only (see HANDOFF.md).
- Never run `firebase init hosting` (it overwrites `index.html`). Bump `CACHE` in `sw.js` on every shipped change.
- Do not copy the visual style of v1.0 (uppercase `[ BRACKET ]` brutalist look). Keep the Liquid Glass tokens in `styles.css`.

## 1. What to take from PlanEat_v1.0 (all paths are in the `PlanEat_v1.0` repo)
| # | Take this | Where | Why it is better than what we have |
|---|---|---|---|
| 1 | **Accounts: Google sign-in + anonymous-first**, later "link to Google" without losing data | `frontend/src/pages/OnboardingPage.tsx` (`signInAnonymously`, `signInWithPopup`), `SettingsPage.tsx` (`linkWithPopup`) | We have no accounts. Anonymous-first = no sign-up friction; linking upgrades the same user id. |
| 2 | **Firestore security rules** (deny by default, owner-only, field allow-lists, numeric bounds, immutable key fields) | `frontend/firestore.rules` | Ready, strict pattern. Adapt to our data model (below). |
| 3 | **Weight log + history + trend chart** | `api.addWeightLog/getWeightLogs` in `frontend/src/api/client.ts`, `ConfigPage.tsx` ("Progress Entry"), `StatsPage.tsx` (SVG line chart) | We track food only, not body weight: the key long-term progress metric. |
| 4 | **Adherence heatmap + hit rate (last 60 days)** | `StatsPage.tsx`, `api.getHeatmap` | A motivating long-term view we lack. |
| 5 | **Settings page**: edit profile after onboarding, sign out, **"Reset all data"** (wipes server data, double-confirm) | `SettingsPage.tsx`, `ConfigPage.tsx` ("Profile Data"), `api.resetData` | We have no way to change targets/profile or delete data. Delete-my-data is needed for privacy. |
| 6 | (Optional, later) **Meal planner**: daily schedule, mark eaten/skipped, recipes + shopping list, redistribute calories after an overage | `SchedulePage.tsx`, `api.generateManifest/generateRecipes/consumeMeal/skipMeal`, `backend/app/services/overage.py` (logic only) | A different product mode (plan ahead vs log what you ate). Only add if you want it; not needed for the tracker. |

## 2. What NOT to take
- The silent **random fallback** in `swapMeal` (fake 520/430/460/540 kcal when the AI fails). We show real errors instead.
- The Python `backend/` (Groq/Llama, SQLite, FastAPI): dead code, not used by the frontend.
- Model `gemini-2.5-flash` (deprecated, auto-routed to 3.5 Flash-Lite on 2026-12-01); no App Check; no per-item editing; single total per photo.
- `CODEBASE_REVIEW.md` (3,000+ lines), `scratch.py`, `seed.py`, `test_startup.py`, `dummy.jpg`.
- React/Vite/Tailwind rewrite: not needed. Add Firebase Auth/Firestore to the current vanilla app (ES modules from the gstatic CDN, same SDK version as `app.js`).

## 3. Proposed Firestore model
- `users/{uid}`: profile + targets `{age, gender, heightCm, weightKg, activity, goal, calories, protein, carbs, fat, createdAt, updatedAt}`
- `users/{uid}/days/{YYYY-MM-DD}`: `{date, breakfast:[], lunch:[], dinner:[], snacks:[], updatedAt}` — one document per day (cheap: 1 write per change). Each item: `{id, name, portion, calories, protein, carbs, fat, via?}`. **No photos stored.**
- `users/{uid}/weights/{YYYY-MM-DD}`: `{date, weightKg}`
- Keep `localStorage` as an offline cache and sync when signed in. First sign-in: migrate existing local data to the account.
- Spark limits to respect: 20K writes/day, 50K reads/day, 1 GiB. Batch writes, debounce saves, read the week view from at most 7 day documents.

## 4. Work packages (each = one branch + PR + Claude Code review)
1. `feat/auth-firestore`: anonymous sign-in on first open, Google link in a Settings sheet, `users/*/days` sync + local→cloud migration, `firestore.rules` (+ test with the emulator or `firebase_validate_security_rules`), deploy rules.
2. `feat/settings`: edit profile/targets (reuse `computeTargets`), sign out, reset all data with double confirm.
3. `feat/weight-progress`: weight entry + history + trend chart in the Week view.
4. `feat/adherence`: 60-day heatmap + hit rate.
5. `chore/app-check-enforce`: confirm Verified traffic from real phones, then Enforce in the console.
6. `chore/privacy`: privacy policy page + data-use notice for photos (free tier lets Google use submitted content); decide on Blaze + budget alerts before public launch.
7. (Optional) planner mode from item 6 above.

## 5. Ready-to-paste first prompt for Antigravity
> Read HANDOFF.md and docs/MIGRATION.md first. Work on branch `feat/auth-firestore`. Add Firebase Auth (anonymous sign-in on first open, "Link Google account" in a settings sheet) and Firestore sync for meal records using the model in docs/MIGRATION.md §3, using ES modules from https://www.gstatic.com/firebasejs/13.2.0/ (same version as app.js). Keep the Liquid Glass style (styles.css tokens) and localStorage as an offline cache; migrate existing local data on first sign-in. Write `firestore.rules` adapted from PlanEat_v1.0/frontend/firestore.rules (owner-only, field allow-lists, bounds, deny by default). Do not store photos. Do not touch config secrets. Commit in small steps and open a PR; do not deploy.
