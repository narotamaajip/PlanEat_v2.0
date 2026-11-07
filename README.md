# PlanEat

AI powered calorie tracker (Liquid Glass UI, installable PWA). Plain HTML/CSS/JS, no build step.

## How the AI is called
- `config.js` holds `FIREBASE_CONFIG` (public web-app config). With it, Gemini runs through **Firebase AI Logic**, so no API key lives in the browser.
- Without it, `GEMINI_API_KEY` (local testing only) is used; with neither, the app runs in Demo mode.
- Model is set by `GEMINI_MODEL` (default `gemini-3.5-flash-lite`).

## Run locally
    python3 -m http.server 8000     # then open http://localhost:8000

## Deploy (Firebase Hosting, project planeat-alpha-2)
    firebase deploy --only hosting

Live: https://planeat-alpha-2.web.app

Data (profile, meals, recent foods) is stored in the browser's localStorage under `planeat.v1`.
