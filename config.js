// PlanEat configuration.
//
// FIREBASE_CONFIG is the public web-app config of the Firebase project (safe to publish).
// With it, Gemini is called through Firebase AI Logic and no API key lives in the browser.
//
// GEMINI_API_KEY is an optional fallback for local testing only (used when FIREBASE_CONFIG is empty).
// Never publish a real key here.
window.PLANEAT_CONFIG = {
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyAoNW0hQmsSHpNVXfYkblkwLumLRf-a00I",
    authDomain: "planeat-alpha-2.firebaseapp.com",
    projectId: "planeat-alpha-2",
    storageBucket: "planeat-alpha-2.firebasestorage.app",
    messagingSenderId: "373846672164",
    appId: "1:373846672164:web:cd1fd8112274c64992a9b1",
    measurementId: "G-TLNCCY37KH",
  },
  // App Check (reCAPTCHA Enterprise site key; public by design)
  APPCHECK_SITE_KEY: "6Lc69hIuAAAAAGNUjjrxgzICTdUvRazB1QvbMafE",
  // Local testing only: App Check debug token for http://localhost:8000. Never deploy a real value.
  APPCHECK_DEBUG_TOKEN: "",
  GEMINI_API_KEY: "",
  GEMINI_MODEL: "gemini-3.5-flash-lite",
};
