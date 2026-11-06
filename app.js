/* PlanEat — AI powered calorie tracker */
(() => {
  'use strict';

  const CFG = window.PLANEAT_CONFIG || window.FUELLY_CONFIG || {};
  const STORE_KEY = 'planeat.v1';
  const LEGACY_STORE_KEY = 'fuelly.v1';

  const MEALS = [
    { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { id: 'lunch', label: 'Lunch', icon: '🥗' },
    { id: 'dinner', label: 'Dinner', icon: '🍝' },
    { id: 'snacks', label: 'Snacks', icon: '🍎' },
  ];
  const MACROS = [
    { k: 'protein', label: 'Protein', c1: 'var(--protein-1)', c2: 'var(--protein-2)', kcal: 4 },
    { k: 'carbs', label: 'Carbs', c1: 'var(--carbs-1)', c2: 'var(--carbs-2)', kcal: 4 },
    { k: 'fat', label: 'Fat', c1: 'var(--fat-1)', c2: 'var(--fat-2)', kcal: 9 },
  ];
  const ACTIVITY = [
    { id: 'sedentary', icon: '🪑', label: 'Mostly sitting', sub: 'Desk job, little or no exercise' },
    { id: 'light', icon: '🚶', label: 'Lightly active', sub: 'Light exercise 1–3 days a week' },
    { id: 'moderate', icon: '🏃', label: 'Moderately active', sub: 'Exercise 3–5 days a week' },
    { id: 'very', icon: '🚴', label: 'Very active', sub: 'Hard exercise 6–7 days a week' },
    { id: 'athlete', icon: '🏋️', label: 'Athlete', sub: 'Physical job or training twice a day' },
  ];
  const GOALS = [
    { id: 'lose', icon: '🔥', label: 'Lose weight', sub: 'Gentle, sustainable deficit' },
    { id: 'maintain', icon: '⚖️', label: 'Maintain', sub: 'Keep things steady' },
    { id: 'gain', icon: '💪', label: 'Gain muscle', sub: 'Lean surplus, high protein' },
  ];
  const GENDERS = [
    { id: 'male', icon: '👨', label: 'Male' },
    { id: 'female', icon: '👩', label: 'Female' },
    { id: 'other', icon: '🧑', label: 'Other' },
  ];

  /* ---------- helpers ---------- */

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, max = 99999) => { const n = Number(v); return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0; };
  const round = (n) => Math.round(Number(n) || 0);
  const r1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
  const fmt = (n) => round(n).toLocaleString();
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  const mealById = (id) => MEALS.find((m) => m.id === id) || MEALS[0];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dateOf = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayKey = () => keyOf(new Date());
  const addDays = (k, n) => { const d = dateOf(k); d.setDate(d.getDate() + n); return keyOf(d); };
  const weekStart = (k) => { const d = dateOf(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return keyOf(d); };
  const weekKeys = (k) => { const s = weekStart(k); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); };
  const fmtDate = (k, o) => dateOf(k).toLocaleDateString(undefined, o);

  function defaultMeal() {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    if (h >= 4.5 && h < 11) return 'breakfast';
    if (h >= 11 && h < 15) return 'lunch';
    if (h >= 17 && h < 21.5) return 'dinner';
    return 'snacks';
  }

  /* ---------- icons ---------- */

  const I = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M14.5 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9.5 6l6 6-6 6"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.1 6.1 6.1 2.1-6.1 2.1L12 19l-2.1-6.2-6.1-2.1 6.1-2.1z"/><path d="M19 15.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3.5"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l4.8-4.6 3.6 3.4 2.6-2.4 5 4.6"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h1.7l1.5-2h5.6l1.5 2H18a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z"/><circle cx="12" cy="12.5" r="3.6"/></svg>',
  };
  const LOGO = `<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb35c"/><stop offset=".5" stop-color="#ff5f8f"/><stop offset="1" stop-color="#8b6bff"/></linearGradient></defs><path fill="url(#lg)" d="M24 3c2.5 7.6 13 12.3 13 24.4C37 35.5 31.2 44 24 44S11 37.8 11 29.5c0-5.6 2.9-9.3 5.6-12.2.5 3.3 2 5.8 4.4 7 0-7.2 1.4-14.6 3-21.3z"/><path fill="#fff" opacity=".85" d="M24.5 26c2.6 3 6 5.4 6 9.6 0 3.6-2.8 6.2-6.3 6.2s-6.2-2.5-6.2-6c0-3.9 3.6-6 6.5-9.8z"/></svg>`;

  /* ---------- storage ---------- */

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_STORE_KEY)) || null; } catch { return null; }
  }
  const store = Object.assign({ profile: null, targets: null, explanation: '', days: {}, foods: {}, insights: {} }, load() || {});
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { toast("Couldn't save to this browser's storage"); }
  }

  const emptyDay = () => ({ breakfast: [], lunch: [], dinner: [], snacks: [] });
  const getDay = (k) => store.days[k] || emptyDay();
  const ensureDay = (k) => (store.days[k] ||= emptyDay());
  function totals(k) {
    const d = getDay(k);
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
    MEALS.forEach((m) => (d[m.id] || []).forEach((it) => {
      t.calories += num(it.calories); t.protein += num(it.protein); t.carbs += num(it.carbs); t.fat += num(it.fat); t.count++;
    }));
    return t;
  }
  const isLogged = (k) => totals(k).count > 0;

  function rememberFood(it) {
    const key = `${it.name.toLowerCase().trim()}|${(it.portion || '').toLowerCase().trim()}`;
    const prev = store.foods[key];
    store.foods[key] = {
      key, name: it.name, portion: it.portion,
      calories: it.calories, protein: it.protein, carbs: it.carbs, fat: it.fat,
      count: (prev?.count || 0) + 1, lastUsed: Date.now(),
    };
  }

  /* ---------- Gemini ---------- */

  const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
  const KEY_STORE = 'planeat.geminiKey';
  function savedKey() { try { return localStorage.getItem(KEY_STORE) || localStorage.getItem('fuelly.geminiKey') || ''; } catch { return ''; } }

  class AIError extends Error {
    constructor(kind, detail = '') { super(detail || kind); this.kind = kind; this.detail = detail; }
  }

  const hasFirebase = () => !!(CFG.FIREBASE_CONFIG && CFG.FIREBASE_CONFIG.projectId);

  // Firebase AI Logic (no API key in the browser). The SDK is loaded on first use.
  const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/13.2.0/';
  let firebasePromise = null;
  function loadFirebase() {
    if (!firebasePromise) {
      firebasePromise = (async () => {
        const [{ initializeApp }, ai, appCheck] = await Promise.all([
          import(`${FIREBASE_SDK}firebase-app.js`), import(`${FIREBASE_SDK}firebase-ai.js`), import(`${FIREBASE_SDK}firebase-app-check.js`),
        ]);
        const app = initializeApp(CFG.FIREBASE_CONFIG);
        // App Check proves requests come from PlanEat (reCAPTCHA Enterprise, invisible to users).
        // reCAPTCHA doesn't run on localhost, so local testing uses a registered debug token from config.js.
        if (CFG.APPCHECK_SITE_KEY) {
          const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
          // debug token: set once in the browser console on localhost, never committed:
          //   localStorage.setItem('planeat.debugToken', '<token from Firebase console → App Check → Manage debug tokens>')
          let dbg = CFG.APPCHECK_DEBUG_TOKEN || '';
          try { dbg = dbg || localStorage.getItem('planeat.debugToken') || ''; } catch {}
          if (local && dbg) self.FIREBASE_APPCHECK_DEBUG_TOKEN = dbg;
          appCheck.initializeAppCheck(app, { provider: new appCheck.ReCaptchaEnterpriseProvider(CFG.APPCHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
        }
        return { ...ai, instance: ai.getAI(app, { backend: new ai.GoogleAIBackend() }) };
      })().catch((e) => { firebasePromise = null; throw e; });
    }
    return firebasePromise;
  }

  // The Firebase SDK wants lowercase JSON-schema types
  const sdkSchema = (n) => (Array.isArray(n) ? n.map(sdkSchema) : n && typeof n === 'object'
    ? Object.fromEntries(Object.entries(n).map(([k, v]) => [k, k === 'type' && typeof v === 'string' ? v.toLowerCase() : sdkSchema(v)])) : n);

  async function geminiViaFirebase({ system, prompt, schema, image = null }) {
    if (!navigator.onLine) throw new AIError('offline');
    const model = CFG.GEMINI_MODEL || DEFAULT_MODEL;
    let fb;
    try { fb = await loadFirebase(); } catch (e) {
      console.error('[PlanEat] Could not load the Firebase SDK:', e);
      throw new AIError('network', `Could not load the Firebase SDK: ${e.message}`);
    }
    const generative = fb.getGenerativeModel(fb.instance, {
      model,
      systemInstruction: system,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: sdkSchema(schema),
        // extraction doesn't need deep reasoning; "low" keeps it fast and cheap (MINIMAL isn't supported by 3.8 Flash)
        thinkingConfig: { thinkingLevel: fb.ThinkingLevel.LOW },
      },
    });
    const parts = image ? [prompt, { type: 'inlineData', inlineData: { data: image.data, mimeType: image.mimeType } }] : [prompt];
    const once = () => {
      let timer;
      return Promise.race([
        generative.generateContent(parts),
        new Promise((_, rej) => { timer = setTimeout(() => rej(Object.assign(new Error('timeout'), { name: 'AbortError' })), 45000); }),
      ]).finally(() => clearTimeout(timer));
    };
    let result;
    try {
      try {
        result = await once();
      } catch (e) {
        // Google sometimes answers 500/503 during demand spikes: one quiet retry usually succeeds
        if (!/\b(500|503)\b|high demand|overloaded|unavailable/i.test(String(e?.message))) throw e;
        console.warn('[PlanEat] AI service busy, retrying once:', e?.message);
        await sleep(1500);
        result = await once();
      }
    } catch (e) {
      console.error('[PlanEat] Firebase AI Logic error:', e);
      const msg = String(e?.message || e).replace(/\s+/g, ' ').slice(0, 300);
      const detail = `${model} · ${msg}`;
      if (e?.name === 'AbortError') throw new AIError('timeout', detail);
      if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg)) throw new AIError('busy', detail);
      if (/404|not found|no longer available/i.test(msg)) {
        const err = new AIError('model', detail);
        err.suggest = /use (?:models\/)?(gemini-[\w.-]+)/i.exec(msg)?.[1] || '';
        throw err;
      }
      if (/403|401|permission|api key|app ?check|not enabled|has not been used|disabled/i.test(msg)) throw new AIError('config', detail);
      if (/fetch|network|failed to load/i.test(msg)) throw new AIError('network', detail);
      throw new AIError('server', detail);
    }
    const text = result.response.text();
    try { return JSON.parse(text); } catch {
      const reason = result.response.promptFeedback?.blockReason || result.response.candidates?.[0]?.finishReason || 'empty response';
      console.error('[PlanEat] Unexpected AI response:', text);
      throw new AIError('parse', `${model} · ${reason}`);
    }
  }

  const gemini = (opts) => (hasFirebase() ? geminiViaFirebase(opts) : geminiViaKey(opts));

  async function geminiViaKey({ system, prompt, schema, image = null }) {
    const key = (CFG.GEMINI_API_KEY || savedKey() || '').trim();
    if (!key) throw new AIError('key');
    if (!navigator.onLine) throw new AIError('offline');
    const model = CFG.GEMINI_MODEL || DEFAULT_MODEL;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: image ? [{ inlineData: image }, { text: prompt }] : [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json', responseSchema: schema,
            // a food photo doesn't need the highest detail; medium keeps image tokens low
            ...(image ? { mediaResolution: 'MEDIA_RESOLUTION_MEDIUM' } : {}),
          },
        }),
      });
    } catch (e) {
      console.error('[PlanEat] Gemini request failed:', e);
      throw new AIError(e.name === 'AbortError' ? 'timeout' : 'network', `${e.name}: ${e.message}`);
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let msg = body.slice(0, 300);
      try { msg = JSON.parse(body).error?.message || msg; } catch {}
      const detail = `HTTP ${res.status} · ${model}${msg ? ` · ${msg}` : ''}`;
      console.error('[PlanEat] Gemini error:', detail);
      if (res.status === 429) throw new AIError('busy', detail);
      if (res.status === 404) {
        const err = new AIError('model', detail);
        err.suggest = /use (?:models\/)?(gemini-[\w.-]+)/i.exec(msg)?.[1] || '';
        throw err;
      }
      if (/referer|referrer/i.test(msg)) throw new AIError('referrer', detail);
      if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) throw new AIError('disabled', detail);
      if (/api[_ ]?key/i.test(msg)) throw new AIError('badkey', detail);
      throw new AIError('server', detail);
    }
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    try { return JSON.parse(text); } catch {
      const reason = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason || 'empty response';
      console.error('[PlanEat] Unexpected Gemini response:', data);
      throw new AIError('parse', `${model} · ${reason}`);
    }
  }

  function friendlyError(e) {
    switch (e?.kind) {
      case 'key': return 'PlanEat needs a Gemini API key. Paste yours below (or add it to config.js).';
      case 'badkey': return 'Gemini didn’t accept that API key. Double-check it and paste it again.';
      case 'offline': return 'Looks like you’re offline. Reconnect and give it another go.';
      case 'busy': return 'The AI is a little busy right now. Wait a moment and try again.';
      case 'timeout': return 'That took longer than expected. Let’s try once more.';
      case 'config': return 'PlanEat couldn’t get permission to use Firebase AI Logic. Make sure AI Logic is enabled for the project and that App Check (if enforced) is set up for this site.';
      case 'model': return `The model “${CFG.GEMINI_MODEL || DEFAULT_MODEL}” in config.js isn’t available for your key.${e.suggest ? ` Set GEMINI_MODEL to "${e.suggest}", save and reload.` : ' Check the model name in Google AI Studio and update GEMINI_MODEL in config.js.'}`;
      case 'referrer': return 'Your API key is restricted to other websites. Open PlanEat at http://localhost:8000 (not as a file), or loosen the key’s website restrictions.';
      case 'disabled': return 'The Gemini API isn’t enabled for this key’s Google Cloud project. Create the key in Google AI Studio, or enable the “Generative Language API”.';
      case 'network': return hasFirebase() ? 'Couldn’t reach the AI service. Check your connection and try again.' : location.protocol === 'file:'
        ? 'Couldn’t reach Gemini. PlanEat is opened as a file — run it from a local server (http://localhost:8000) and try again.'
        : 'Couldn’t reach Gemini. Check your connection and try again.';
      default: return 'Something went sideways on our end. A quick retry usually fixes it.';
    }
  }
  const oopsHTML = (e, act, title = 'Hmm, that didn’t work') => `
    <div class="oops fade-in">
      <div class="face">🫠</div>
      <h4>${esc(title)}</h4>
      <p>${esc(friendlyError(e))}</p>
      ${e?.detail ? `<code class="oops-detail">${esc(e.detail)}</code>` : ''}
      ${e?.kind === 'key' || e?.kind === 'badkey' ? `
      <form class="key-form" data-retry="${act}">
        <input class="field" type="password" name="key" placeholder="Paste Gemini API key" autocomplete="off" required>
        <button class="btn primary sm" type="submit">Save & retry</button>
      </form>` : `<button class="btn soft sm" data-act="${act}">${I.refresh}Try again</button>`}
    </div>`;

  const S = { STRING: { type: 'STRING' }, INT: { type: 'INTEGER' }, NUM: { type: 'NUMBER' } };


  /* ---------- Demo mode (no Gemini key): local estimates instead of AI ---------- */

  const isDemo = () => !hasFirebase() && !((CFG.GEMINI_API_KEY || savedKey() || '').trim());

  // name, portion per unit, kcal, protein, carbs, fat, keywords (longest phrases first)
  const DEMO_FOODS = [
    ['Buttered Toast', '1 slice + 1 tsp butter', 115, 3, 13, 5.5, ['buttered toast']],
    ['Peanut Butter', '1 tbsp (16 g)', 95, 3.5, 3.5, 8, ['peanut butter']],
    ['Protein Shake', '1 scoop + water', 120, 24, 3, 1.5, ['protein shake', 'whey']],
    ['Orange Juice', '1 cup (240 ml)', 112, 1.7, 26, 0.5, ['orange juice', 'juice', 'jus']],
    ['French Fries', '1 medium serving', 365, 4, 48, 17, ['french fries', 'fries']],
    ['Greek Yogurt', '1 cup (170 g)', 100, 17, 6, 0.7, ['greek yogurt', 'yogurt', 'yoghurt']],
    ['Chicken Breast', '1 breast (120 g)', 198, 37, 0, 4.3, ['chicken', 'ayam']],
    ['Black Coffee', '1 cup (240 ml)', 2, 0.3, 0, 0, ['black coffee', 'coffee', 'kopi', 'espresso', 'americano']],
    ['Latte', '12 oz (350 ml)', 190, 10, 15, 7, ['latte', 'cappuccino']],
    ['Tea', '1 cup (240 ml)', 2, 0, 0.5, 0, ['tea', 'teh']],
    ['Egg', '1 large (50 g)', 72, 6.3, 0.4, 4.8, ['egg', 'eggs', 'telur']],
    ['Toast', '1 slice (30 g)', 80, 3, 14, 1, ['toast', 'bread', 'roti']],
    ['Butter', '1 tsp (5 g)', 34, 0, 0, 3.8, ['butter', 'mentega']],
    ['Bacon', '1 slice', 43, 3, 0.1, 3.3, ['bacon']],
    ['Sausage', '1 link', 170, 7, 1, 15, ['sausage', 'sosis']],
    ['Pancake', '1 medium', 90, 2.5, 11, 3.7, ['pancake', 'pancakes']],
    ['Oatmeal', '1 cup cooked', 158, 6, 27, 3.2, ['oatmeal', 'oats', 'oat', 'porridge']],
    ['Cereal', '1 cup + milk', 230, 8, 42, 4, ['cereal']],
    ['Banana', '1 medium', 105, 1.3, 27, 0.4, ['banana', 'pisang']],
    ['Apple', '1 medium', 95, 0.5, 25, 0.3, ['apple', 'apel']],
    ['Orange', '1 medium', 62, 1.2, 15, 0.2, ['orange', 'jeruk']],
    ['White Rice', '1 cup cooked (160 g)', 205, 4.3, 45, 0.4, ['rice', 'nasi']],
    ['Salmon', '1 fillet (150 g)', 280, 30, 0, 17, ['salmon', 'fish', 'ikan']],
    ['Steak', '150 g', 330, 38, 0, 19, ['steak', 'beef', 'daging']],
    ['Tofu', '100 g', 76, 8, 2, 4.8, ['tofu', 'tahu']],
    ['Tempeh', '100 g', 192, 20, 8, 11, ['tempeh', 'tempe']],
    ['Pasta', '1 cup cooked (140 g)', 220, 8, 43, 1.3, ['pasta', 'spaghetti']],
    ['Noodles', '1 cup cooked', 220, 7, 40, 3, ['noodles', 'noodle', 'mie', 'ramen']],
    ['Pizza', '1 slice', 285, 12, 36, 10, ['pizza']],
    ['Burger', '1 burger', 540, 30, 40, 28, ['burger', 'hamburger']],
    ['Sandwich', '1 sandwich', 350, 18, 38, 13, ['sandwich']],
    ['Green Salad', '1 bowl', 35, 2, 7, 0.3, ['salad']],
    ['Avocado', '1/2 fruit', 120, 1.5, 6, 11, ['avocado', 'alpukat']],
    ['Cheese', '1 slice (28 g)', 113, 7, 0.4, 9, ['cheese', 'keju']],
    ['Milk', '1 cup (240 ml)', 122, 8, 12, 4.8, ['milk', 'susu']],
    ['Almonds', '1 oz (28 g)', 164, 6, 6, 14, ['almonds', 'almond', 'nuts', 'kacang']],
    ['Potato', '1 medium', 160, 4, 37, 0.2, ['potato', 'kentang']],
    ['Broccoli', '1 cup', 31, 2.5, 6, 0.3, ['broccoli', 'brokoli']],
    ['Cookie', '1 cookie', 150, 2, 20, 7, ['cookie', 'cookies', 'biscuit']],
    ['Chocolate', '1 bar (40 g)', 210, 3, 24, 12, ['chocolate', 'coklat', 'cokelat']],
    ['Soda', '1 can (330 ml)', 140, 0, 39, 0, ['soda', 'coke', 'cola']],
    ['Water', '1 glass', 0, 0, 0, 0, ['water', 'air putih']],
  ];
  const NUM_WORDS = { a: 1, an: 1, one: 1, satu: 1, two: 2, dua: 2, three: 3, tiga: 3, four: 4, empat: 4, five: 5, lima: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5, setengah: 0.5, couple: 2 };

  function demoParse(text) {
    const segs = text.toLowerCase().split(/,|;|\n|&|\+|\band\b|\bwith\b|\bplus\b|\bdan\b|\bpakai\b/);
    const items = [];
    for (let seg of segs) {
      seg = seg.trim().replace(/[.!?]+$/, '');
      if (!/[a-z]/.test(seg)) continue;
      let qty = 1;
      const m = /^(\d+(?:\.\d+)?|[a-z]+)\b\s*/.exec(seg);
      if (m && (/^\d/.test(m[1]) || m[1] in NUM_WORDS)) { qty = /^\d/.test(m[1]) ? Number(m[1]) : NUM_WORDS[m[1]]; seg = seg.slice(m[0].length); }
      const food = DEMO_FOODS.find((f) => f[6].some((k) => new RegExp(`\\b${k}(e?s)?\\b`).test(seg)));
      const unit = (p) => (qty === 1 ? p : /^1 /.test(p) ? p.replace(/^1 /, `${qty} `).replace(/\s*\(.*\)/, '') : `${qty} × ${p}`);
      if (food) {
        const [name, portion, kcal, p, c, f] = food;
        items.push({ name, portion: unit(portion), calories: kcal * qty, protein: p * qty, carbs: c * qty, fat: f * qty });
      } else {
        const name = seg.replace(/^(of|a|an|the|some|slice of|bowl of|cup of|plate of)\s+/g, '').trim();
        if (!name) continue;
        items.push({ name: name.replace(/\b\w/g, (ch) => ch.toUpperCase()), portion: unit('1 serving (rough estimate)'), calories: 200 * qty, protein: 8 * qty, carbs: 25 * qty, fat: 7 * qty });
      }
    }
    return items.map(cleanItem).filter((i) => i.name);
  }

  // Demo mode can't look at the photo: use the user's details if they gave any, otherwise show an example plate.
  function demoPhoto(details) {
    const fromText = details ? demoParse(details) : [];
    if (fromText.length) return fromText;
    return [
      { name: 'White Rice', portion: '1 cup cooked (160 g)', calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
      { name: 'Fried Chicken', portion: '1 thigh (~120 g)', calories: 280, protein: 22, carbs: 8, fat: 18 },
      { name: 'Stir-fried Greens', portion: '1/2 cup', calories: 70, protein: 2.5, carbs: 6, fat: 4.5 },
    ].map(cleanItem);
  }

  // Numbers come from the standard Mifflin-St Jeor formula (testing showed the Lite model
  // under-shoots calorie targets); Gemini only writes the short explanation.
  function computeTargets(p) {
    const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
    const bmr = base + (p.gender === 'male' ? 5 : p.gender === 'female' ? -161 : -78);
    const factor = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, athlete: 1.9 }[p.activity] || 1.375;
    const tdee = bmr * factor;
    const floor = p.gender === 'male' ? 1500 : 1200;
    const cal = Math.round((p.goal === 'lose' ? Math.max(tdee * 0.82, floor) : p.goal === 'gain' ? tdee * 1.1 : tdee) / 10) * 10;
    const protein = round(p.weightKg * (p.goal === 'maintain' ? 1.6 : p.goal === 'gain' ? 1.8 : 2.0));
    const fat = round((cal * 0.27) / 9);
    const carbs = Math.max(round((cal - protein * 4 - fat * 9) / 4), 0);
    return { calories: cal, protein, carbs, fat, tdee: Math.round(tdee / 10) * 10, perKg: r1(protein / p.weightKg), floored: p.goal === 'lose' && tdee * 0.82 < floor };
  }

  function localExplanation(p, t) {
    const why = p.goal === 'lose' ? 'a moderate deficit for steady, sustainable fat loss'
      : p.goal === 'gain' ? 'a small surplus to support lean muscle gain' : 'matching it to keep your weight steady';
    return `Your estimated maintenance is about ${fmt(t.tdee)} kcal a day, so your target uses ${why}. Protein is set at ${t.perKg} g per kg of body weight to support your muscles, with the rest split between carbs and fats.`;
  }

  async function aiTargets(p) {
    const t = computeTargets(p);
    const out = { calories: t.calories, protein: t.protein, carbs: t.carbs, fat: t.fat, explanation: localExplanation(p, t) };
    if (isDemo()) { await sleep(500); out.explanation += ' (Demo mode — no AI wording.)'; return out; }
    try {
      const r = await gemini({
        system: `You are PlanEat, a friendly sports nutritionist. The daily targets below are already calculated; do not change them.
Write "explanation": 2–3 short, warm sentences in second person that mention the estimated maintenance calories and why the goal adjustment and protein level suit the user's goal. No medical claims, no markdown, no new numbers.`,
        prompt: `Goal: ${p.goal}\nActivity: ${p.activity}\nMaintenance (TDEE): ${t.tdee} kcal\nDaily target: ${t.calories} kcal\nProtein: ${t.protein} g (${t.perKg} g/kg)\nCarbs: ${t.carbs} g\nFat: ${t.fat} g`,
        schema: { type: 'OBJECT', properties: { explanation: S.STRING }, required: ['explanation'] },
      });
      if (r.explanation && String(r.explanation).trim().length > 20) out.explanation = String(r.explanation).trim();
    } catch (e) {
      console.warn('[PlanEat] Using the built-in explanation (AI unavailable):', e?.message);
    }
    return out;
  }

  const FOOD_SCHEMA = {
    type: 'OBJECT',
    properties: {
      items: {
        type: 'ARRAY',
        items: { type: 'OBJECT', properties: { name: S.STRING, portion: S.STRING, calories: S.NUM, protein: S.NUM, carbs: S.NUM, fat: S.NUM }, required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat'] },
      },
    },
    required: ['items'],
  };

  async function aiParsePhoto(dataUrl, details) {
    if (isDemo()) { await sleep(1700); return demoPhoto(details); }
    const [, mimeType, data] = /^data:(.*?);base64,(.*)$/.exec(dataUrl) || [];
    if (!data) throw new AIError('parse');
    const r = await gemini({
      system: `You are PlanEat's food photo analyst. Work out what the user is eating from the photo and their details.
How to split into items:
- If the user's details list foods, account for every food they listed, using their wording. Use the photo to confirm each one and to estimate its portion.
- Also account for any other clearly visible food or drink they didn't mention.
A plate or meal of rice (or noodles, lontong, bread) eaten together with its side dishes (lauk, vegetables, sambal, kerupuk, egg, tempeh, fried chicken, etc.) is ONE item, not several. Name it after the main dish plus "Komplit" or the main side, e.g. "Nasi Uduk Komplit" or "Nasi Ayam Balado" (max 40 characters). Put every component with its estimated weight in the portion field, e.g. "nasi uduk 200 g, bihun goreng 50 g, kentang balado 75 g, ayam paha balado 100 g". Calories, protein, carbs and fat of that item are the TOTAL of all its components.
Keep a food as its own separate item only when it is not part of that plate: drinks, fruit, desserts, snacks, or a clearly separate course.
- Otherwise (not a rice or noodle plate), return one item per food: for example a yogurt bowl with fruit and toppings becomes one item per component.
For each item give: a short name (use the local dish name when recognisable, e.g. "Nasi Goreng", "Rendang"; no translations or explanations in brackets); a realistic portion estimated from visual cues such as plate size (~26 cm dinner plate), bowls, utensils, hands and packaging, adding grams or ml (e.g. "1 plate (~250 g)"); and estimated calories, protein, carbs and fat in grams using typical USDA-style values.
Account for visible cooking oil, frying, sauces, sambal, dressings and toppings. The user's extra details are more reliable than the photo: they override what you see (e.g. "brown rice", "only ate half", "no sugar", "large portion").
If the photo shows no food or drink, return an empty items list.`,
      prompt: details ? `Extra details from the user: ${details}` : 'The user added no extra details.',
      schema: FOOD_SCHEMA,
      temperature: 0.2,
      image: { mimeType, data },
    });
    return (r.items || []).map(cleanItem).filter((i) => i.name);
  }

  async function aiParseFood(text) {
    if (isDemo()) { await sleep(900); return demoParse(text); }
    const r = await gemini({
      system: `You are PlanEat's nutrition estimation engine. Break the user's plain-language description of what they ate or drank into individual food items.
Use the user's own list: every food they name must be accounted for, in their order, using their wording.
A plate or meal of rice (or noodles, lontong, bread) eaten together with its side dishes (lauk, vegetables, sambal, kerupuk, egg, tempeh, fried chicken, etc.) is ONE item, not several. Name it after the main dish plus "Komplit" or the main side, e.g. "Nasi Uduk Komplit" or "Nasi Ayam Balado" (max 40 characters). Put every component with its estimated weight in the portion field, e.g. "nasi uduk 200 g, bihun goreng 50 g, kentang balado 75 g, ayam paha balado 100 g". Calories, protein, carbs and fat of that item are the TOTAL of all its components.
Keep a food as its own separate item only when it is not part of that plate: drinks, fruit, desserts, snacks, or a clearly separate course.
Otherwise (not a rice or noodle plate), return one item per food the user named, e.g. a list of fruit or toppings stays separate items.
For each item give: a short name (keep local dish names as written, no translations or explanations in brackets); a realistic portion in common household units, adding grams or ml where helpful (e.g. "2 large (100 g)", "1 slice + 1 tsp butter"); and estimated calories, protein, carbs and fat in grams using typical USDA-style values.
Respect any quantities, sizes, brands or cooking methods the user mentions. Combine a quantity of the same food into one item ("two eggs" → one item "Eggs", portion "2 large"). Toppings or spreads that belong to an item (e.g. butter on toast) can be included in that item and mentioned in the portion.
Include drinks; black coffee, tea and water are 0–5 kcal. If the text describes no food or drink at all, return an empty items list.`,
      prompt: text,
      schema: FOOD_SCHEMA,
      temperature: 0.2,
    });
    return (r.items || []).map(cleanItem).filter((i) => i.name);
  }

  function cleanItem(i) {
    return {
      id: uid(),
      name: ((n) => n.charAt(0).toUpperCase() + n.slice(1))(String(i.name || '').trim().slice(0, 60)),
      portion: String(i.portion || '').trim().slice(0, 160),
      calories: round(num(i.calories, 5000)),
      protein: r1(num(i.protein, 500)),
      carbs: r1(num(i.carbs, 800)),
      fat: r1(num(i.fat, 400)),
    };
  }

  /* ---------- UI utilities ---------- */

  const app = $('#app');
  const layer = $('#layer');

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function tween(el, to, dur = 1100) {
    if (!el) return;
    const from = Number(el.dataset.v || 0);
    el.dataset.v = to;
    cancelAnimationFrame(el._raf);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }
  const nextFrame = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  /* ==========================================================================
     Onboarding
     ========================================================================== */

  const OB_STEPS = ['welcome', 'age', 'gender', 'body', 'activity', 'goal', 'plan'];
  const ob = {
    step: 0, dir: 1,
    age: '', gender: '', units: 'metric',
    cm: '', kg: '', ft: '', inch: '', lb: '',
    activity: '', goal: '',
    status: 'idle', plan: null, err: null, req: 0,
  };

  function obMetrics() {
    if (ob.units === 'metric') return { heightCm: num(ob.cm), weightKg: num(ob.kg) };
    return { heightCm: r1((num(ob.ft) * 12 + num(ob.inch)) * 2.54), weightKg: r1(num(ob.lb) * 0.453592) };
  }
  function obValid() {
    switch (OB_STEPS[ob.step]) {
      case 'age': { const a = Number(ob.age); return a >= 13 && a <= 100; }
      case 'gender': return !!ob.gender;
      case 'body': { const m = obMetrics(); return m.heightCm >= 100 && m.heightCm <= 250 && m.weightKg >= 30 && m.weightKg <= 300; }
      case 'activity': return !!ob.activity;
      case 'goal': return !!ob.goal;
      default: return true;
    }
  }

  function renderOnboarding() {
    app.innerHTML = `
      <div class="ob-wrap">
        <div class="ob-card glass" id="obCard">
          <div class="ob-top">
            <button class="icon-btn" data-act="ob-back" id="obBack" aria-label="Back">${I.back}</button>
            <div class="dots" id="obDots">${OB_STEPS.map(() => '<i></i>').join('')}</div>
            ${isDemo() ? '<span class="demo-tag" title="No Gemini API key — using local estimates">Demo</span>' : '<span style="width:40px"></span>'}
          </div>
          <div class="ob-stage" id="obStage"></div>
          <div class="ob-actions" id="obActions"></div>
        </div>
      </div>`;
    renderObStep();
  }

  function optionHTML(o, on, act, d, tile = false) {
    return `<button class="opt inner ${tile ? 'tile' : ''} ${on ? 'on' : ''}" data-act="${act}" data-v="${o.id}" style="--d:${d}">
      <span class="oi">${o.icon}</span>
      <span class="ot"><b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span>
      <span class="check">${I.check}</span>
    </button>`;
  }

  function renderObStep() {
    const name = OB_STEPS[ob.step];
    $('#obBack').classList.toggle('hide', ob.step === 0 || (name === 'plan' && ob.status === 'loading'));
    $$('#obDots i').forEach((d, i) => { d.classList.toggle('on', i <= ob.step); d.classList.toggle('cur', i === ob.step); });

    let html = '';
    if (name === 'welcome') {
      html = `
        <div class="hero-logo inner">${LOGO}</div>
        <h1>Welcome to PlanEat</h1>
        <p class="lead">Your AI powered calorie companion. Answer a few quick questions and we’ll build a daily plan around you.</p>
        <div class="welcome-points">
          <div class="wp inner" style="--d:0"><span>💬</span>Log meals by just describing them</div>
          <div class="wp inner" style="--d:1"><span>🎯</span>Personal calorie & macro targets</div>
          <div class="wp inner" style="--d:2"><span>✨</span>Friendly insights after every meal</div>
        </div>`;
    } else if (name === 'age') {
      html = `
        <h1>How old are you?</h1>
        <p class="lead">Age helps estimate how much energy your body uses at rest.</p>
        <div class="stepper">
          <button class="icon-btn" data-act="ob-age" data-n="-1" aria-label="Decrease">${I.minus}</button>
          <input class="big-input" id="obAge" type="number" inputmode="numeric" min="13" max="100" placeholder="28" value="${esc(ob.age)}" data-ob="age" aria-label="Age">
          <button class="icon-btn" data-act="ob-age" data-n="1" aria-label="Increase">${I.plus}</button>
        </div>
        <div class="big-unit">years</div>`;
    } else if (name === 'gender') {
      html = `
        <h1>What’s your gender?</h1>
        <p class="lead">Used only for the metabolic rate formula.</p>
        <div class="options cols3">${GENDERS.map((g, i) => optionHTML(g, ob.gender === g.id, 'ob-pick', i, true).replace('data-v=', 'data-k="gender" data-v=')).join('')}</div>`;
    } else if (name === 'body') {
      const metric = ob.units === 'metric';
      html = `
        <h1>Height & weight</h1>
        <p class="lead">So we can size your targets to your body.</p>
        <div class="seg glass unit-seg" style="--n:2;--i:${metric ? 0 : 1}">
          <span class="seg-thumb"></span>
          <button class="${metric ? 'on' : ''}" data-act="ob-units" data-v="metric">Metric</button>
          <button class="${metric ? '' : 'on'}" data-act="ob-units" data-v="imperial">Imperial</button>
        </div>
        <div class="body-fields">
          <label class="num-field"><span>Height</span>
            <div class="num-row">
              ${metric
                ? `<div class="suffix-input inner"><input type="number" inputmode="decimal" placeholder="170" value="${esc(ob.cm)}" data-ob="cm"><em>cm</em></div>`
                : `<div class="suffix-input inner"><input type="number" inputmode="numeric" placeholder="5" value="${esc(ob.ft)}" data-ob="ft"><em>ft</em></div>
                   <div class="suffix-input inner"><input type="number" inputmode="numeric" placeholder="7" value="${esc(ob.inch)}" data-ob="inch"><em>in</em></div>`}
            </div>
          </label>
          <label class="num-field"><span>Weight</span>
            <div class="num-row">
              ${metric
                ? `<div class="suffix-input inner"><input type="number" inputmode="decimal" placeholder="70" value="${esc(ob.kg)}" data-ob="kg"><em>kg</em></div>`
                : `<div class="suffix-input inner"><input type="number" inputmode="decimal" placeholder="154" value="${esc(ob.lb)}" data-ob="lb"><em>lb</em></div>`}
            </div>
          </label>
        </div>`;
    } else if (name === 'activity') {
      html = `
        <h1>How active are you?</h1>
        <p class="lead">Think about a typical week.</p>
        <div class="options">${ACTIVITY.map((a, i) => optionHTML(a, ob.activity === a.id, 'ob-pick', i).replace('data-v=', 'data-k="activity" data-v=')).join('')}</div>`;
    } else if (name === 'goal') {
      html = `
        <h1>What’s your goal?</h1>
        <p class="lead">We’ll tune your calories and protein to match.</p>
        <div class="options">${GOALS.map((g, i) => optionHTML(g, ob.goal === g.id, 'ob-pick', i).replace('data-v=', 'data-k="goal" data-v=')).join('')}</div>`;
    } else if (name === 'plan') {
      html = planHTML();
    }

    const stage = $('#obStage');
    stage.innerHTML = `<div class="ob-step ${ob.dir < 0 ? 'back' : ''}">${html}</div>`;
    renderObActions();
    const first = stage.querySelector('input');
    if (first && name !== 'plan' && matchMedia('(pointer: fine)').matches) setTimeout(() => first.focus(), 350);
  }

  function renderObActions() {
    const name = OB_STEPS[ob.step];
    const box = $('#obActions');
    if (name === 'plan') {
      box.innerHTML = ob.status === 'ready'
        ? `<button class="btn primary" data-act="ob-save">Save & start tracking</button>`
        : '';
      return;
    }
    const label = name === 'welcome' ? 'Get started' : name === 'goal' ? 'Calculate my plan ✨' : 'Continue';
    box.innerHTML = `<button class="btn primary" data-act="ob-next" ${obValid() ? '' : 'disabled'}>${label}</button>`;
  }

  function planHTML() {
    if (ob.status === 'loading') {
      return `
        <h1>Building your plan…</h1>
        <p class="lead">Gemini is crunching your numbers.</p>
        <div class="calc-orb"></div>
        <div class="skel block" style="height:84px;margin-bottom:10px"></div>
        <div class="plan-macros">${'<div class="skel block"></div>'.repeat(3)}</div>
        <div class="skel line" style="width:92%"></div>
        <div class="skel line" style="width:70%"></div>`;
    }
    if (ob.status === 'error') {
      return `<h1>Your daily plan</h1><div style="margin-top:40px">${oopsHTML(ob.err, 'ob-retry', 'We couldn’t build your plan')}</div>`;
    }
    const p = ob.plan;
    return `
      <h1>Your daily plan</h1>
      <p class="lead" style="margin-bottom:14px">Tap any number to fine-tune it before saving.</p>
      <div class="plan-cal inner">
        <small>Daily calories</small>
        <div class="row"><input type="number" inputmode="numeric" value="${p.calories}" data-plan="calories" aria-label="Daily calories"><span>kcal</span></div>
      </div>
      <div class="plan-macros">
        ${MACROS.map((m, i) => `
          <label class="pm inner" style="--c1:${m.c1};--c2:${m.c2};--d:${i}">
            <small><i></i>${m.label}</small>
            <div class="pmrow"><input type="number" inputmode="numeric" value="${p[m.k]}" data-plan="${m.k}" aria-label="${m.label} grams"><span>g</span></div>
            <span class="pct" data-pct="${m.k}"></span>
          </label>`).join('')}
      </div>
      <div class="plan-why inner"><b>${I.spark.replace('<svg', '<svg width="14" height="14" fill="currentColor"')} Why these numbers</b>${esc(p.explanation)}</div>
      <p class="plan-note" id="planNote"></p>`;
  }

  // Fit the big calorie field to the number it shows (fixed widths clip on small phones)
  function fitPlanCalories() {
    const el = $('[data-plan="calories"]'); if (!el) return;
    const cs = getComputedStyle(el);
    const ctx = fitPlanCalories.ctx || (fitPlanCalories.ctx = document.createElement('canvas').getContext('2d'));
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    el.style.width = `${Math.ceil(ctx.measureText(el.value || '0').width) + 14}px`;
  }

  function updatePlanNote() {
    fitPlanCalories();
    const p = ob.plan; if (!p) return;
    const mk = p.protein * 4 + p.carbs * 4 + p.fat * 9;
    MACROS.forEach((m) => {
      const el = $(`[data-pct="${m.k}"]`);
      if (el) el.textContent = p.calories ? `${round((p[m.k] * m.kcal / p.calories) * 100)}% kcal` : '';
    });
    const note = $('#planNote');
    if (!note) return;
    const diff = mk - p.calories;
    note.classList.toggle('warn', Math.abs(diff) > p.calories * 0.05);
    note.textContent = Math.abs(diff) <= p.calories * 0.05
      ? `Macros add up to ${fmt(mk)} kcal — nicely balanced.`
      : `Heads up: your macros add up to ${fmt(mk)} kcal (${diff > 0 ? '+' : ''}${fmt(diff)} vs. target).`;
  }

  async function obCalculate() {
    const req = ++ob.req;
    ob.status = 'loading'; ob.err = null;
    renderObStep();
    const m = obMetrics();
    const profile = { age: Number(ob.age), gender: ob.gender, heightCm: m.heightCm, weightKg: m.weightKg, activity: ob.activity, goal: ob.goal };
    try {
      const [plan] = await Promise.all([aiTargets(profile), sleep(900)]);
      if (req !== ob.req) return;
      ob.plan = plan; ob.status = 'ready';
    } catch (e) {
      if (req !== ob.req) return;
      ob.status = 'error'; ob.err = e;
    }
    ob.dir = 1;
    renderObStep();
    updatePlanNote();
  }

  function obGo(delta) {
    ob.dir = delta;
    ob.step = Math.max(0, Math.min(OB_STEPS.length - 1, ob.step + delta));
    if (OB_STEPS[ob.step] === 'plan') { obCalculate(); return; }
    renderObStep();
  }

  function obSave() {
    const p = ob.plan;
    if (!p || !p.calories) return;
    const m = obMetrics();
    store.profile = { age: Number(ob.age), gender: ob.gender, heightCm: m.heightCm, weightKg: m.weightKg, activity: ob.activity, goal: ob.goal, units: ob.units };
    store.targets = { calories: round(p.calories), protein: round(p.protein), carbs: round(p.carbs), fat: round(p.fat) };
    store.explanation = p.explanation;
    save();
    $('#obCard').classList.add('leaving');
    setTimeout(() => renderMain(), 420);
  }

  /* ==========================================================================
     Main app
     ========================================================================== */

  const ui = { date: todayKey(), view: 'day', meal: defaultMeal(), fresh: new Set() };

  function renderMain() {
    app.innerHTML = `
      <div class="shell">
        <header class="topbar">
          <div class="brand glass">${LOGO}<span>PlanEat</span>${isDemo() ? '<span class="demo-tag" title="No Gemini API key — using local estimates">Demo</span>' : ''}</div>
          <div class="seg glass" id="viewSeg" style="--n:2">
            <span class="seg-thumb"></span>
            <button data-act="view" data-v="day">Day</button>
            <button data-act="view" data-v="week">Week</button>
          </div>
        </header>
        <nav class="datebar glass" aria-label="Choose a date">
          <button class="icon-btn" data-act="nav-week" data-n="-1" aria-label="Previous week">${I.left}</button>
          <div class="strip" id="strip"></div>
          <button class="icon-btn" data-act="nav-week" data-n="1" id="nextWeek" aria-label="Next week">${I.right}</button>
        </nav>
        <div class="date-row">
          <button class="date-label" data-act="date-open" id="dateLabel"></button>
          <input type="date" id="datePick" aria-label="Pick a date">
        </div>
        <main id="view"></main>
      </div>
      <div class="dock-wrap" id="dockWrap">
        <div class="meal-menu glass" id="mealMenu" role="menu"></div>
        <div class="meal-menu snap-menu glass" id="snapMenu" role="menu">
          <button role="menuitem" data-act="snap-camera"><span>${I.camera}</span>Take a photo</button>
          <button role="menuitem" data-act="snap-upload"><span>${I.image}</span>Upload from gallery</button>
        </div>
        <div class="dock glass">
          <div class="chips" id="chips"></div>
          <form class="composer" id="composer" autocomplete="off">
            <button type="button" class="meal-pill" data-act="meal-menu" id="mealPill" aria-haspopup="menu"></button>
            <input id="foodInput" type="text" placeholder="What did you eat? e.g. two eggs and toast" enterkeyhint="send" aria-label="Describe what you ate" maxlength="400">
            <button type="button" class="cam-btn" data-act="snap-menu" id="camBtn" aria-haspopup="menu" aria-label="Add a photo of your food" title="Snap to Eat">${I.camera}</button>
            <button class="send" type="submit" id="sendBtn" aria-label="Log food" disabled>${I.up}</button>
          </form>
          <input type="file" id="snapInput" accept="image/*" capture="environment" hidden>
          <input type="file" id="uploadInput" accept="image/*" hidden>
        </div>
      </div>`;
    renderMealPill();
    renderChips();
    renderNav();
    renderView();
  }

  /* ---------- nav / date ---------- */

  function renderNav() {
    const today = todayKey();
    $('#strip').innerHTML = weekKeys(ui.date).map((k) => {
      const d = dateOf(k);
      return `<button class="day-btn ${k === ui.date ? 'sel' : ''} ${k === today ? 'today' : ''} ${isLogged(k) ? 'logged' : ''}" data-act="pick-day" data-k="${k}" ${k > today ? 'disabled' : ''} aria-label="${fmtDate(k, { weekday: 'long', month: 'long', day: 'numeric' })}">
        <span class="wd">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
        <span class="dn">${d.getDate()}</span>
        <span class="dot"></span>
      </button>`;
    }).join('');
    $('#nextWeek').disabled = addDays(weekStart(ui.date), 7) > today;

    let label;
    if (ui.view === 'week') {
      const ks = weekKeys(ui.date);
      label = `<b>${fmtDate(ks[0], { month: 'short', day: 'numeric' })} – ${fmtDate(ks[6], { month: 'short', day: 'numeric' })}</b>`;
    } else {
      const rel = ui.date === today ? 'Today' : ui.date === addDays(today, -1) ? 'Yesterday' : fmtDate(ui.date, { weekday: 'long' });
      label = `<b>${rel}</b> · ${fmtDate(ui.date, { month: 'long', day: 'numeric', year: dateOf(ui.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}`;
    }
    $('#dateLabel').innerHTML = `${I.cal}<span>${label}</span>`;
    const pick = $('#datePick');
    pick.max = today; pick.value = ui.date;
  }

  function setDate(k) {
    const today = todayKey();
    if (!k || k > today) k = today;
    if (k === ui.date) return;
    ui.date = k; ui.tip = 0;
    renderNav();
    renderView();
  }

  /* ---------- views ---------- */

  function renderView() {
    const seg = $('#viewSeg');
    seg.style.setProperty('--i', ui.view === 'day' ? 0 : 1);
    $$('button', seg).forEach((b) => b.classList.toggle('on', b.dataset.v === ui.view));
    $('#dockWrap').classList.toggle('hidden', ui.view !== 'day');
    closeMealMenu();
    if (ui.view === 'day') renderDay(); else renderWeek();
  }

  /* ---------- day view ---------- */

  const RING_R = 100, RING_C = 2 * Math.PI * RING_R;

  function renderDay() {
    const tg = store.targets;
    $('#view').innerHTML = `
      <div class="grid day-grid view-enter">
        <div class="col">
          <section class="card glass summary" style="--d:0" aria-label="Today's totals">
            <div class="sum-grid">
              <div class="ring-wrap">
                <svg class="ring" viewBox="0 0 240 240" aria-hidden="true">
                  <defs>
                    <linearGradient id="ringGrad" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="#ffb35c"/><stop offset=".5" stop-color="#ff5f8f"/><stop offset="1" stop-color="#9a6bff"/>
                    </linearGradient>
                    <linearGradient id="ringOver" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="#ff9a5c"/><stop offset="1" stop-color="#ff2d55"/>
                    </linearGradient>
                    <filter id="ringBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
                  </defs>
                  <circle class="ring-track-edge" cx="120" cy="120" r="${RING_R}"/>
                  <circle class="ring-track" cx="120" cy="120" r="${RING_R}"/>
                  <circle class="ring-glow zero" cx="120" cy="120" r="${RING_R}" stroke="url(#ringGrad)" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/>
                  <circle class="ring-prog zero" cx="120" cy="120" r="${RING_R}" stroke="url(#ringGrad)" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/>
                </svg>
                <div class="ring-center">
                  <span class="ring-num" id="ringNum">0</span>
                  <span class="ring-of">of ${fmt(tg.calories)} kcal</span>
                  <span class="ring-left" id="ringLeft"></span>
                </div>
              </div>
              <div class="macros">
                ${MACROS.map((m) => `
                  <div class="macro" data-macro="${m.k}" style="--c1:${m.c1};--c2:${m.c2}">
                    <div class="macro-top">
                      <span class="macro-name"><i></i>${m.label}</span>
                      <span class="macro-val"><b data-n>0</b> / ${fmt(tg[m.k])} g</span>
                    </div>
                    <div class="bar" role="progressbar" aria-label="${m.label}" aria-valuemin="0" aria-valuemax="${tg[m.k]}"><div class="fill"></div></div>
                    <div class="macro-foot" data-foot></div>
                  </div>`).join('')}
              </div>
            </div>
          </section>
          <section class="card glass insights" id="insights" style="--d:1" aria-live="polite"></section>
        </div>
        <div class="col" id="meals"></div>
      </div>`;
    renderMeals();
    nextFrame(updateSummary);
    renderInsights();
  }

  function updateSummary() {
    if (ui.view !== 'day' || !$('#ringNum')) return;
    const tg = store.targets, t = totals(ui.date);
    const pct = tg.calories ? t.calories / tg.calories : 0;
    const over = t.calories > tg.calories;
    const off = RING_C * (1 - Math.min(pct, 1));
    $$('.ring-prog, .ring-glow').forEach((c) => {
      c.style.strokeDashoffset = off;
      c.setAttribute('stroke', over ? 'url(#ringOver)' : 'url(#ringGrad)');
      c.classList.toggle('zero', t.calories <= 0);
    });
    tween($('#ringNum'), round(t.calories));
    const left = $('#ringLeft');
    left.classList.toggle('over', over);
    left.textContent = over ? `${fmt(t.calories - tg.calories)} kcal over` : `${fmt(tg.calories - t.calories)} kcal left`;

    MACROS.forEach((m) => {
      const el = $(`[data-macro="${m.k}"]`);
      const v = t[m.k], target = tg[m.k] || 1;
      const fill = $('.fill', el);
      fill.style.width = `${Math.min(v / target, 1) * 100}%`;
      fill.classList.toggle('over', v > target * 1.05);
      $('.bar', el).setAttribute('aria-valuenow', round(v));
      tween($('[data-n]', el), round(v));
      $('[data-foot]', el).textContent = v > target ? `${fmt(v - target)} g over` : `${fmt(target - v)} g left`;
    });
  }

  function renderMeals() {
    const d = getDay(ui.date);
    $('#meals').innerHTML = MEALS.map((m, i) => {
      const items = d[m.id] || [];
      const kcal = items.reduce((s, it) => s + num(it.calories), 0);
      return `
        <section class="card glass meal" data-meal="${m.id}" style="--d:${i + 1}">
          <div class="meal-head">
            <span class="meal-ico inner">${m.icon}</span>
            <div class="meal-title"><h3>${m.label}</h3><small>${items.length ? `${items.length} item${items.length > 1 ? 's' : ''}` : 'Not logged'}</small></div>
            <span class="meal-kcal">${fmt(kcal)}<span>kcal</span></span>
            <button class="icon-btn sm" data-act="meal-add" data-meal="${m.id}" aria-label="Log ${m.label}">${I.plus}</button>
          </div>
          ${items.length ? `<ul class="items">${items.map((it) => `
            <li class="item ${ui.fresh.has(it.id) ? 'new' : ''}" data-id="${it.id}">
              <div class="it-main">
                <b>${it.via === 'photo' ? '<span class="via-photo" title="Logged from a photo">📷</span>' : ''}${esc(it.name)}</b>
                <small>${it.portion ? `${esc(it.portion)} · ` : ''}P ${round(it.protein)} · C ${round(it.carbs)} · F ${round(it.fat)}</small>
              </div>
              <span class="it-kcal">${fmt(it.calories)}<span>kcal</span></span>
              <button class="x" data-act="item-del" data-meal="${m.id}" data-id="${it.id}" aria-label="Remove ${esc(it.name)}">${I.x}</button>
            </li>`).join('')}</ul>` : `<p class="empty">Nothing logged yet</p>`}
        </section>`;
    }).join('');
    ui.fresh.clear();
  }

  // Re-render after the day's data changes (without rebuilding the ring, so it animates from the current value)
  function dayChanged() {
    save();
    renderMeals();
    $$('#meals .card').forEach((c) => (c.style.animation = 'none'));
    updateSummary();
    renderChips();
    renderNav();
    scheduleInsights();
  }

  function addItems(k, mealId, items) {
    const d = ensureDay(k);
    items.forEach((it) => {
      const clean = { ...cleanItem(it), id: uid(), ...(it.via === 'photo' ? { via: 'photo' } : {}) };
      d[mealId].push(clean);
      ui.fresh.add(clean.id);
      rememberFood(clean);
    });
    dayChanged();
  }

  function removeItem(mealId, id) {
    const li = $(`.item[data-id="${id}"]`);
    const doIt = () => {
      const d = ensureDay(ui.date);
      d[mealId] = d[mealId].filter((it) => it.id !== id);
      dayChanged();
    };
    if (li) { li.style.maxHeight = `${li.offsetHeight}px`; requestAnimationFrame(() => li.classList.add('leaving')); setTimeout(doIt, 360); } else doIt();
  }

  /* ---------- Tips (offline library, chosen to fit the day) ---------- */

  // goal: which goals a tip suits ('any' = all). when: shown first while that condition is true.
  const TIPS = [
    { goal: 'any', when: 'empty', icon: '🍳', title: 'Start with protein', text: 'A protein-rich breakfast (eggs, Greek yogurt, tempeh) keeps you full for longer and makes the rest of the day easier.' },
    { goal: 'any', when: 'proteinLow', icon: '🍗', title: 'Close the protein gap', text: 'Easy protein adds: 100 g chicken breast ≈ 31 g, 100 g tempeh ≈ 19 g, 2 eggs ≈ 13 g, 1 cup Greek yogurt ≈ 17 g.' },
    { goal: 'any', when: 'over', icon: '🌱', title: 'Over today? That’s okay', text: 'One day over won’t undo your progress. Go back to your usual meals tomorrow — consistency across the week matters most.' },
    { goal: 'any', when: 'nearLimit', icon: '🥒', title: 'Almost at your target', text: 'You’re close to today’s calories. If you’re still hungry, go for volume: cucumber, a clear soup, or a piece of fruit.' },
    { goal: 'any', when: 'fatHigh', icon: '🫒', title: 'Fats are adding up', text: 'You’re near your fat target. Pick lean protein for your next meal — chicken breast, fish or tofu — cooked with little oil.' },
    { goal: 'any', when: 'carbsHigh', icon: '🍚', title: 'Carbs are nearly used', text: 'Most of today’s carbs are in. Build your next plate around protein and vegetables with a smaller rice portion.' },
    { goal: 'any', when: 'evening', icon: '🌙', title: 'Sleep supports results', text: '7–9 hours of sleep helps appetite control and muscle recovery. A lighter dinner 2–3 hours before bed can help.' },
    { goal: ['lose'], icon: '🥗', title: 'Volume is your friend', text: 'Fill half your plate with vegetables. They add bulk and fibre for very few calories, so portions feel bigger.' },
    { goal: ['lose'], icon: '🍳', title: 'Watch the hidden oil', text: 'Fried dishes and santan curries can hide 100–200 kcal of oil. Grilled (bakar), steamed (kukus) or boiled (rebus) versions save a lot.' },
    { goal: ['lose'], icon: '🧋', title: 'Drinks count too', text: 'Sweet iced tea, boba and sweetened coffee can add 150–350 kcal. Try teh tawar, black coffee or less-sugar options.' },
    { goal: ['lose', 'maintain'], icon: '⏱️', title: 'Slow down', text: 'Fullness signals take about 20 minutes to arrive. Eating slowly helps you feel satisfied with less.' },
    { goal: ['gain'], icon: '📈', title: 'Eat in a small surplus', text: 'For lean muscle gain, about 200–300 kcal above maintenance a day is enough. Bigger surpluses mostly add fat.' },
    { goal: ['gain'], icon: '💪', title: 'Spread your protein', text: 'Aim for 20–40 g of protein in each of 3–5 meals. It supports muscle building better than one huge protein meal.' },
    { goal: ['gain'], icon: '🏋️', title: 'Fuel your training', text: 'Have carbs and protein 1–3 hours before training — rice with chicken, or a banana with yogurt.' },
    { goal: ['gain'], icon: '🥛', title: 'Recovery snack', text: 'After a workout, milk with a banana or rice with eggs refuels your muscles and adds protein.' },
    { goal: ['maintain'], icon: '⚖️', title: 'Keep the 80/20 rule', text: 'If about 80% of your food is whole and minimally processed, there’s room for treats without drifting from your target.' },
    { goal: 'any', icon: '💧', title: 'Hydrate first', text: 'Thirst can feel like hunger. A glass of water before meals helps you tune in to your real appetite.' },
    { goal: 'any', icon: '🥦', title: 'Fibre keeps you full', text: 'Aim for 25–30 g of fibre a day from vegetables, fruit, beans and whole grains like brown rice or oats.' },
    { goal: 'any', icon: '🍠', title: 'Don’t fear carbs', text: 'Carbs fuel your brain and workouts. Choose slower ones (oats, brown rice, sweet potato) and pair them with protein.' },
    { goal: 'any', icon: '🥑', title: 'Healthy fats, measured', text: 'Avocado, nuts and olive oil are good fats but dense: 1 tbsp oil ≈ 120 kcal, a small handful of nuts ≈ 170 kcal.' },
    { goal: 'any', icon: '📝', title: 'Log right after eating', text: 'Logging straight away keeps portions accurate — and planning your next meal ahead makes hitting your target easier.' },
  ];

  function tipConditions(k) {
    const t = totals(k), tg = store.targets;
    const late = k < todayKey() || new Date().getHours() >= 18;
    return {
      empty: t.count === 0,
      over: t.calories > tg.calories,
      nearLimit: t.calories <= tg.calories && tg.calories - t.calories < 200 && t.count > 0,
      proteinLow: t.count > 0 && t.protein < tg.protein * 0.5,
      fatHigh: t.fat > tg.fat * 0.9 && t.calories < tg.calories * 0.85,
      carbsHigh: t.carbs > tg.carbs * 0.9 && t.calories < tg.calories * 0.85,
      evening: late,
    };
  }

  // Tips that fit this goal: the ones matching today's situation first, then a daily rotation of the rest
  function tipsFor(k) {
    const goal = store.profile?.goal || 'maintain';
    const cond = tipConditions(k);
    const fits = TIPS.filter((t) => t.goal === 'any' || t.goal.includes(goal));
    const urgent = fits.filter((t) => t.when && cond[t.when]);
    const general = fits.filter((t) => !t.when);
    const shift = Math.floor(dateOf(k).getTime() / 864e5) % Math.max(general.length, 1);
    return [...urgent, ...general.slice(shift), ...general.slice(0, shift)];
  }

  function renderInsights() {
    const box = $('#insights'); if (!box) return;
    const list = tipsFor(ui.date);
    const i = ((ui.tip || 0) % list.length + list.length) % list.length;
    const tip = list[i];
    box.innerHTML = `
      <div class="card-head">
        <h2 class="card-title"><span class="spark tip-badge">💡</span>Tips for you</h2>
        <button class="icon-btn sm ghost" data-act="tip-next" aria-label="Next tip">${I.refresh}</button>
      </div>
      <div class="ins-tip inner fade-in">
        <span class="tip-ico">${tip.icon}</span>
        <div><small>${esc(tip.title)}</small><p>${esc(tip.text)}</p></div>
      </div>
      <p class="tip-count">${i + 1} of ${list.length}</p>`;
  }
  const scheduleInsights = renderInsights;

  /* ---------- dock: meal pill, chips, composer ---------- */

  function renderMealPill() {
    const m = mealById(ui.meal);
    $('#mealPill').innerHTML = `<span>${m.icon}</span><span class="ml">${m.label}</span>${I.down}`;
    $('#mealMenu').innerHTML = MEALS.map((x) => `<button role="menuitemradio" aria-checked="${x.id === ui.meal}" class="${x.id === ui.meal ? 'on' : ''}" data-act="meal-choose" data-v="${x.id}"><span>${x.icon}</span>${x.label}</button>`).join('');
  }
  const closeMealMenu = () => $('#mealMenu')?.classList.remove('open');
  const closeSnapMenu = () => $('#snapMenu')?.classList.remove('open');

  function quickFoods() {
    const all = Object.values(store.foods);
    const frequent = all.filter((f) => f.count > 1).sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed).slice(0, 5);
    const recent = [...all].sort((a, b) => b.lastUsed - a.lastUsed);
    const out = [], seen = new Set();
    frequent.forEach((f) => { seen.add(f.key); out.push({ ...f, tag: 'freq' }); });
    for (const f of recent) { if (out.length >= 12) break; if (!seen.has(f.key)) { seen.add(f.key); out.push({ ...f, tag: 'recent' }); } }
    return out;
  }

  function renderChips() {
    const foods = quickFoods();
    $('#chips').innerHTML = foods.length
      ? foods.map((f, i) => `<button class="chip" data-act="chip" data-key="${esc(f.key)}" style="--d:${i}" title="${esc(f.portion)} · ${f.tag === 'freq' ? `logged ${f.count}×` : 'recent'}">
          <span class="tag">${f.tag === 'freq' ? '★' : '↺'}</span><span class="cn">${esc(f.name)}</span><span class="ck">${fmt(f.calories)}</span></button>`).join('')
      : `<span class="chips-hint">✨ Your recent & favorite foods will appear here for one-tap logging</span>`;
  }

  function quickAdd(key, btn, mealId = ui.meal) {
    const f = store.foods[key]; if (!f) return;
    addItems(ui.date, mealId, [f]);
    btn?.classList.add('added');
    toast(`Added ${f.name} to ${mealById(mealId).label}`);
  }

  /* ---------- confirmation sheet ---------- */

  const sheet = { open: false, text: '', photo: null, meal: 'breakfast', status: 'loading', items: [], err: null, req: 0, date: null };

  // With text: analyze it right away. With a photo: ask for optional details first.
  // With neither (the "+" on a meal card): start by asking what was eaten.
  function openSheet(text, mealId = ui.meal, photo = null) {
    Object.assign(sheet, { open: true, text, photo, meal: mealId, status: photo ? 'snap' : text ? 'loading' : 'compose', items: [], err: null, date: ui.date });
    document.body.classList.add('locked');
    layer.innerHTML = `
      <div class="overlay" data-act="sheet-backdrop">
        <div class="sheet glass" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
          <div class="grabber"></div>
          <div class="sheet-head">
            <div id="sheetHead"></div>
            <button class="icon-btn sm" data-act="sheet-close" aria-label="Close">${I.x}</button>
          </div>
          <div class="sheet-body" id="sheetBody"></div>
          <div class="sheet-foot" id="sheetFoot"></div>
        </div>
      </div>`;
    renderSheet();
    if (sheet.status === 'loading') parseFood();
    else if (sheet.status === 'compose') setTimeout(() => $('#composeText')?.focus(), 380);
  }

  /* ---------- Snap to Eat ---------- */

  let snapMeal = null;
  // mode 'camera' opens the camera; 'upload' opens the photo library / files
  function startSnap(mealId, mode = 'camera') {
    snapMeal = mealId;
    closeSnapMenu();
    const input = $(mode === 'upload' ? '#uploadInput' : '#snapInput');
    input.value = '';
    input.click();
  }

  // Shrink the photo before upload: faster on mobile data, and plenty of detail for food.
  function loadPhoto(file, max = 1024) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }

  async function onSnapFile(file) {
    if (!file) return;
    let photo;
    try { photo = await loadPhoto(file); } catch { toast('Couldn’t open that photo — try another one'); return; }
    const mealId = snapMeal || (sheet.open ? sheet.meal : ui.meal);
    if (sheet.open) {
      sheet.req++;
      Object.assign(sheet, { photo, meal: mealId, status: 'snap', items: [], err: null });
      renderSheet();
    } else {
      openSheet('', mealId, photo);
    }
    setTimeout(() => $('#snapText')?.focus({ preventScroll: true }), 420);
  }

  function submitSnap() {
    sheet.text = ($('#snapText')?.value || '').trim();
    $('#snapText')?.blur();
    parseFood();
  }

  function submitCompose() {
    sheet.text = ($('#composeText')?.value || sheet.text).trim();
    if (!sheet.text) return;
    $('#composeText')?.blur();
    parseFood();
  }

  function renderSheetHead() {
    const head = $('#sheetHead'); if (!head) return;
    if (sheet.status === 'compose') {
      head.innerHTML = `<h2 id="sheetTitle">Add to ${mealById(sheet.meal).label}</h2><p style="font-style:normal">Describe what you ate in your own words.</p>`;
    } else if (sheet.status === 'snap') {
      head.innerHTML = `<h2 id="sheetTitle">Snap to Eat</h2><p style="font-style:normal">Add a few details for a more accurate estimate.</p>`;
    } else if (sheet.photo) {
      head.innerHTML = `<div class="head-row"><img class="head-thumb" src="${sheet.photo}" alt=""><div><h2 id="sheetTitle">Review your food</h2><p>${sheet.text ? `“${esc(sheet.text)}”` : '<span style="font-style:normal">From your photo</span>'}</p></div></div>`;
    } else {
      head.innerHTML = `<h2 id="sheetTitle">Review your food</h2><p>“${esc(sheet.text)}”</p>`;
    }
  }

  function mealSegHTML(id) {
    return `<div class="seg glass" id="${id}" style="--n:4;--i:${MEALS.findIndex((m) => m.id === sheet.meal)}">
        <span class="seg-thumb"></span>
        ${MEALS.map((m) => `<button type="button" class="${m.id === sheet.meal ? 'on' : ''}" data-act="sheet-meal" data-v="${m.id}">${m.label}</button>`).join('')}
      </div>`;
  }

  function closeSheet() {
    if (!sheet.open) return;
    sheet.open = false; sheet.req++;
    const ov = $('.overlay', layer);
    document.body.classList.remove('locked');
    if (!ov) return;
    ov.classList.add('closing');
    setTimeout(() => { if (!sheet.open) layer.innerHTML = ''; }, 320);
  }

  async function parseFood() {
    const req = ++sheet.req;
    sheet.status = 'loading'; renderSheet();
    try {
      const items = sheet.photo ? await aiParsePhoto(sheet.photo, sheet.text) : await aiParseFood(sheet.text);
      if (req !== sheet.req) return;
      if (sheet.photo) items.forEach((i) => (i.via = 'photo'));
      sheet.items = items;
      sheet.status = items.length ? 'ready' : 'empty';
    } catch (e) {
      if (req !== sheet.req) return;
      sheet.status = 'error'; sheet.err = e;
    }
    renderSheet();
  }

  function renderSheet() {
    const body = $('#sheetBody'), foot = $('#sheetFoot');
    if (!body) return;
    renderSheetHead();
    if (sheet.status === 'compose') {
      const foods = quickFoods();
      body.innerHTML = `
        <form id="sheetCompose" class="fade-in" style="display:grid;gap:12px">
          <textarea class="field compose-area" id="composeText" rows="3" maxlength="400" placeholder="e.g. two eggs, a slice of buttered toast and a black coffee">${esc(sheet.text)}</textarea>
          <div class="snap-pair">
            <button type="button" class="snap-cta inner" data-act="snap-camera">
              <span class="snap-ico">${I.camera}</span>
              <span><b>Take photo</b><small>Snap to Eat</small></span>
            </button>
            <button type="button" class="snap-cta inner" data-act="snap-upload">
              <span class="snap-ico alt">${I.image}</span>
              <span><b>Upload</b><small>From your gallery</small></span>
            </button>
          </div>
          ${foods.length ? `<div><div class="card-sub" style="margin:2px 4px 8px">Or tap to add instantly</div>
            <div class="chips wrap">${foods.map((f, i) => `<button type="button" class="chip" data-act="sheet-chip" data-key="${esc(f.key)}" style="--d:${i}"><span class="tag">${f.tag === 'freq' ? '★' : '↺'}</span><span class="cn">${esc(f.name)}</span><span class="ck">${fmt(f.calories)}</span></button>`).join('')}</div></div>` : ''}
        </form>`;
      foot.innerHTML = `
        ${mealSegHTML('sheetSeg')}
        <div class="sheet-actions">
          <button class="btn soft" data-act="sheet-close">Cancel</button>
          <button class="btn primary" data-act="sheet-analyze" id="sheetAnalyze" ${sheet.text.trim() ? '' : 'disabled'}>${I.spark.replace('<svg', '<svg style="fill:currentColor;stroke:none"')}Find foods</button>
        </div>`;
      return;
    }
    if (sheet.status === 'snap') {
      body.innerHTML = `
        <form id="sheetSnap" class="fade-in" style="display:grid;gap:12px">
          <div class="snap-photo inner">
            <img src="${sheet.photo}" alt="Your meal photo">
            <div class="retake-row">
              <button type="button" class="retake" data-act="snap-camera">${I.camera}Retake</button>
              <button type="button" class="retake" data-act="snap-upload">${I.image}Upload</button>
            </div>
          </div>
          <label class="snap-chat">
            <span>${I.spark.replace('<svg', '<svg style="fill:currentColor;stroke:none"')}Tell PlanEat more <em>(optional)</em></span>
            <textarea class="field compose-area" id="snapText" rows="2" maxlength="300" placeholder="e.g. nasi padang with rendang, large portion, I only ate half the rice">${esc(sheet.text)}</textarea>
          </label>
          <p class="snap-tip">Cooking method, sauces, hidden ingredients or how much you actually ate all help the estimate.</p>
        </form>`;
      foot.innerHTML = `
        ${mealSegHTML('sheetSeg')}
        <div class="sheet-actions">
          <button class="btn soft" data-act="sheet-close">Cancel</button>
          <button class="btn primary" data-act="snap-analyze">${I.spark.replace('<svg', '<svg style="fill:currentColor;stroke:none"')}Analyze photo</button>
        </div>`;
      return;
    }
    if (sheet.status === 'loading') {
      body.innerHTML = (sheet.photo ? `<div class="snap-photo inner scanning"><img src="${sheet.photo}" alt=""><span class="scan-label">Analyzing your plate…</span></div>` : '') + [0, 1, 2].slice(0, sheet.photo ? 2 : 3).map((i) => `
        <div class="edit-item inner" style="--d:${i}">
          <div class="skel line" style="height:22px;width:${70 - i * 12}%;margin:4px 0"></div>
          <div class="skel line" style="width:40%;margin:2px 0 6px"></div>
          <div class="nums">${'<div class="skel" style="height:38px"></div>'.repeat(4)}</div>
        </div>`).join('');
      foot.innerHTML = `<div class="skel line" style="width:45%;height:20px"></div><div class="skel" style="height:52px;border-radius:999px"></div>`;
      return;
    }
    if (sheet.status === 'error') {
      body.innerHTML = oopsHTML(sheet.err, 'sheet-retry', 'Couldn’t read that meal');
      foot.innerHTML = `<div class="sheet-actions"><button class="btn soft" data-act="sheet-close" style="flex:1">Close</button></div>`;
      return;
    }
    if (sheet.status === 'empty' || !sheet.items.length) {
      const emptyMsg = sheet.photo
        ? 'We couldn’t spot any food in that photo. Add a short description or retake it with the whole plate in view.'
        : 'We couldn’t find any food or drinks in that. Try describing what you ate, like “a bowl of oatmeal with banana”.';
      body.innerHTML = `<div class="oops fade-in"><div class="face">🤔</div><h4>${sheet.status === 'empty' ? 'No food spotted' : 'Nothing left to add'}</h4><p>${sheet.status === 'empty' ? emptyMsg : 'You removed every item. Close this and describe your meal again.'}</p>${sheet.status === 'empty' ? `<button class="btn soft sm" data-act="sheet-retry">${I.refresh}Try again</button>` : ''}</div>`;
      foot.innerHTML = `<div class="sheet-actions"><button class="btn soft" data-act="sheet-edit" style="flex:1">${sheet.photo ? 'Add details' : 'Edit description'}</button></div>`;
      return;
    }
    const demoNote = sheet.photo && isDemo()
      ? `<div class="demo-note inner">Demo mode: the photo isn’t analyzed without a Gemini key. ${sheet.text ? 'These items come from your description.' : 'This is an example result — add details to see them reflected.'}</div>`
      : '';
    body.innerHTML = demoNote + sheet.items.map((it, i) => `
      <div class="edit-item inner" data-i="${i}" style="--d:${i}">
        <div class="ei-row">
          <input class="field name" value="${esc(it.name)}" data-si="${i}" data-k="name" aria-label="Food name" maxlength="60">
          <button class="x" data-act="sheet-del" data-i="${i}" aria-label="Remove ${esc(it.name)}">${I.x}</button>
        </div>
        <input class="field portion" value="${esc(it.portion)}" data-si="${i}" data-k="portion" aria-label="Portion" placeholder="Portion" maxlength="160">
        <div class="nums">
          <label style="--c1:var(--hot-1);--c2:var(--hot-2)"><span><i></i>kcal</span><input class="field" type="number" inputmode="numeric" min="0" value="${round(it.calories)}" data-si="${i}" data-k="calories"></label>
          ${MACROS.map((m) => `<label style="--c1:${m.c1};--c2:${m.c2}"><span><i></i>${m.label.slice(0, m.k === 'protein' ? 4 : 5)}</span><input class="field" type="number" inputmode="decimal" min="0" step="0.1" value="${r1(it[m.k])}" data-si="${i}" data-k="${m.k}"></label>`).join('')}
        </div>
      </div>`).join('');
    foot.innerHTML = `
      <div class="totals" id="sheetTotals"></div>
      ${mealSegHTML('sheetSeg')}
      <div class="sheet-actions">
        <button class="btn soft" data-act="sheet-close">Cancel</button>
        <button class="btn primary" data-act="sheet-add" id="sheetAdd"></button>
      </div>`;
    updateSheetTotals();
  }

  function updateSheetTotals() {
    const t = sheet.items.reduce((a, it) => ({ c: a.c + num(it.calories), p: a.p + num(it.protein), cb: a.cb + num(it.carbs), f: a.f + num(it.fat) }), { c: 0, p: 0, cb: 0, f: 0 });
    const el = $('#sheetTotals');
    if (el) el.innerHTML = `<span class="t-kcal">${fmt(t.c)}<span>kcal</span></span><span class="t-mac"><span>P ${round(t.p)}g</span><span>C ${round(t.cb)}g</span><span>F ${round(t.f)}g</span></span>`;
    const add = $('#sheetAdd');
    if (add) {
      const n = sheet.items.length;
      add.textContent = `Add ${n} item${n > 1 ? 's' : ''} to ${mealById(sheet.meal).label}`;
      add.disabled = !sheet.items.every((i) => i.name.trim());
    }
  }

  function confirmSheet() {
    const items = sheet.items.filter((i) => i.name.trim());
    if (!items.length) return;
    const mealId = sheet.meal, k = sheet.date;
    ui.meal = mealId; renderMealPill();
    closeSheet();
    $('#foodInput').value = ''; $('#sendBtn').disabled = true;
    if (k !== ui.date) setDate(k);
    setTimeout(() => addItems(k, mealId, items), 120);
    toast(`Added ${items.length} item${items.length > 1 ? 's' : ''} to ${mealById(mealId).label}`);
  }

  /* ---------- week view ---------- */

  function weekData() {
    const today = todayKey();
    const keys = weekKeys(ui.date);
    const days = keys.map((k) => ({ k, future: k > today, t: totals(k) }));
    const logged = days.filter((d) => d.t.count > 0);
    const avg = (f) => (logged.length ? logged.reduce((s, d) => s + d.t[f], 0) / logged.length : 0);
    return { keys, days, logged, avg: { calories: avg('calories'), protein: avg('protein'), carbs: avg('carbs'), fat: avg('fat') } };
  }

  function renderWeek() {
    const w = weekData(), tg = store.targets;
    const onTarget = w.logged.filter((d) => Math.abs(d.t.calories - tg.calories) <= tg.calories * 0.1).length;
    const mk = { protein: w.avg.protein * 4, carbs: w.avg.carbs * 4, fat: w.avg.fat * 9 };
    const mkSum = mk.protein + mk.carbs + mk.fat;
    const DR = 70, DC = 2 * Math.PI * DR;

    $('#view').innerHTML = `
      <div class="grid week-grid view-enter">
        <section class="card glass" style="--d:0">
          <div class="card-head">
            <div><h2 class="card-title">Daily calories</h2><div class="card-sub">vs. your ${fmt(tg.calories)} kcal target</div></div>
          </div>
          <div class="chart-box" id="chart"></div>
          <div class="wk-stats">
            <div class="stat inner"><small>Avg / day</small><b>${fmt(w.avg.calories)}<span>kcal</span></b></div>
            <div class="stat inner"><small>Days logged</small><b>${w.logged.length}<span>/ ${w.days.filter((d) => !d.future).length}</span></b></div>
            <div class="stat inner"><small>On target</small><b>${onTarget}<span>days</span></b></div>
          </div>
        </section>
        <section class="card glass" style="--d:1">
          <div class="card-head">
            <div><h2 class="card-title">Average macro split</h2><div class="card-sub">Share of calories on logged days</div></div>
          </div>
          ${w.logged.length ? `
          <div class="donut-wrap">
            <svg class="donut" viewBox="0 0 200 200" aria-hidden="true">
              <defs>${MACROS.map((m) => `<linearGradient id="dg-${m.k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${getCSS(m.c1)}"/><stop offset="1" stop-color="${getCSS(m.c2)}"/></linearGradient>`).join('')}</defs>
              <circle cx="100" cy="100" r="${DR}" stroke="rgba(255,255,255,.42)"/>
              ${MACROS.map((m) => `<circle class="seg-arc" data-arc="${m.k}" cx="100" cy="100" r="${DR}" stroke="url(#dg-${m.k})" stroke-dasharray="0 ${DC}" stroke-dashoffset="0"/>`).join('')}
            </svg>
            <div class="donut-center"><b>${fmt(w.avg.calories)}</b><small>avg kcal / day</small></div>
          </div>
          <div class="legend">
            ${MACROS.map((m) => `
              <div class="leg inner" style="--c1:${m.c1};--c2:${m.c2}">
                <i></i><span class="ln">${m.label}</span>
                <span class="lg">${round(w.avg[m.k])} / ${tg[m.k]} g</span>
                <span class="lp">${mkSum ? round((mk[m.k] / mkSum) * 100) : 0}%</span>
              </div>`).join('')}
          </div>` : `<div class="week-empty"><span class="face">🗓️</span>No meals logged this week yet.<br>Switch to Day view to start logging.</div>`}
        </section>
      </div>`;

    drawChart();
    if (w.logged.length) {
      nextFrame(() => {
        let acc = 0;
        MACROS.forEach((m) => {
          const len = mkSum ? (mk[m.k] / mkSum) * DC : 0;
          const gap = len > 4 ? 3 : 0;
          const arc = $(`[data-arc="${m.k}"]`);
          if (!arc) return;
          arc.style.strokeDasharray = `${Math.max(len - gap, 0)} ${DC}`;
          arc.style.strokeDashoffset = `${-acc}`;
          acc += len;
        });
      });
    }
  }

  function getCSS(v) {
    const m = /var\((--[^)]+)\)/.exec(v);
    return m ? getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() : v;
  }

  function smoothPath(p, minY, maxY) {
    if (!p.length) return '';
    if (p.length === 1) return `M${p[0][0]},${p[0][1]}`;
    const cl = (y) => Math.max(minY, Math.min(maxY, y));
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, cl(p1[1] + (p2[1] - p0[1]) / 6)];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, cl(p2[1] - (p3[1] - p1[1]) / 6)];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }

  function drawChart() {
    const box = $('#chart'); if (!box) return;
    const w = weekData(), target = store.targets.calories;
    box.dataset.w = box.clientWidth;
    const W = Math.max(box.clientWidth, 280), H = W < 480 ? 230 : 270;
    const P = { l: 40, r: 14, t: 30, b: 34 };
    const vals = w.days.map((d) => (d.future ? null : d.t.calories));
    const top = Math.max(target * 1.3, ...vals.filter((v) => v != null).map((v) => v * 1.12));
    const step = top > 4000 ? 1000 : 500;
    const maxV = Math.ceil(top / step) * step;
    const x = (i) => P.l + (i * (W - P.l - P.r)) / 6;
    const y = (v) => P.t + (1 - v / maxV) * (H - P.t - P.b);
    const pts = vals.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean);
    const line = smoothPath(pts, P.t, H - P.b);
    const area = pts.length > 1 ? `${line} L${pts[pts.length - 1][0]},${H - P.b} L${pts[0][0]},${H - P.b} Z` : '';
    const ticks = []; for (let v = 0; v <= maxV; v += step * (maxV / step > 5 ? 2 : 1)) ticks.push(v);

    box.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Daily calories this week compared with target">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb35c"/><stop offset=".5" stop-color="#ff5f8f"/><stop offset="1" stop-color="#9a6bff"/></linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5f8f" stop-opacity=".34"/><stop offset="1" stop-color="#9a6bff" stop-opacity="0"/></linearGradient>
        </defs>
        ${ticks.map((v) => `<line class="gridline" x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end">${v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : v}</text>`).join('')}
        <line class="target" x1="${P.l}" x2="${W - P.r}" y1="${y(target)}" y2="${y(target)}"/>
        <text class="target-lab" x="${W - P.r}" y="${y(target) - 7}" text-anchor="end">Target ${fmt(target)}</text>
        ${area ? `<path class="area" d="${area}"/>` : ''}
        ${line ? `<path class="line" d="${line}"/>` : ''}
        ${w.days.map((d, i) => `<text class="xlab ${d.k === ui.date ? 'sel' : ''}" x="${x(i)}" y="${H - 10}" text-anchor="middle">${fmtDate(d.k, { weekday: 'short' })}</text>`).join('')}
        ${w.days.map((d, i) => (d.future ? '' : `
          <g class="pt ${d.t.calories > target * 1.1 ? 'overt' : ''} ${d.t.count ? '' : 'empty'}" data-act="chart-day" data-k="${d.k}">
            <rect class="hit" x="${x(i) - 20}" y="${P.t - 20}" width="40" height="${H - P.t}"/>
            <circle class="dotc" cx="${x(i)}" cy="${y(vals[i])}" r="5.5" style="animation-delay:${0.5 + i * 0.08}s"/>
            ${d.t.count ? `<text x="${x(i)}" y="${y(vals[i]) - 13}" style="animation-delay:${0.7 + i * 0.08}s">${fmt(vals[i])}</text>` : ''}
          </g>`)).join('')}
      </svg>`;

    const path = $('.line', box);
    if (path) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      nextFrame(() => { path.style.strokeDashoffset = 0; $('.area', box)?.classList.add('on'); });
    }
  }

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      const box = $('#chart');
      if (ui.view === 'week' && box && box.dataset.w !== String(box.clientWidth)) drawChart();
    }, 150);
  });

  /* ==========================================================================
     Events
     ========================================================================== */

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!e.target.closest('#mealMenu, #mealPill')) closeMealMenu();
    if (!e.target.closest('#snapMenu, #camBtn')) closeSnapMenu();
    if (!el) return;
    const act = el.dataset.act;
    switch (act) {
      /* onboarding */
      case 'ob-next': if (obValid()) obGo(1); break;
      case 'ob-back': if (ob.step > 0) { ob.req++; ob.status = 'idle'; obGo(-1); } break;
      case 'ob-age': {
        const a = Math.max(13, Math.min(100, (Number(ob.age) || 27) + Number(el.dataset.n)));
        ob.age = String(a); $('#obAge').value = a; renderObActions(); break;
      }
      case 'ob-pick': {
        ob[el.dataset.k] = el.dataset.v;
        $$('.opt', el.parentElement).forEach((o) => o.classList.toggle('on', o === el));
        renderObActions();
        const s = ob.step;
        setTimeout(() => { if (ob.step === s && obValid()) obGo(1); }, 420);
        break;
      }
      case 'ob-units': {
        if (ob.units === el.dataset.v) break;
        const m = obMetrics();
        ob.units = el.dataset.v;
        if (ob.units === 'imperial') {
          if (m.heightCm) { const inches = m.heightCm / 2.54; ob.ft = String(Math.floor(inches / 12)); ob.inch = String(round(inches % 12)); }
          if (m.weightKg) ob.lb = String(round(m.weightKg / 0.453592));
        } else {
          if (m.heightCm) ob.cm = String(round(m.heightCm));
          if (m.weightKg) ob.kg = String(r1(m.weightKg));
        }
        ob.dir = 0; renderObStep(); break;
      }
      case 'ob-retry': obCalculate(); break;
      case 'ob-save': obSave(); break;

      /* nav */
      case 'view':
        if (ui.view !== el.dataset.v) { ui.view = el.dataset.v; renderNav(); renderView(); }
        break;
      case 'nav-week': {
        const k = addDays(ui.date, 7 * Number(el.dataset.n));
        setDate(k > todayKey() ? todayKey() : k);
        break;
      }
      case 'pick-day': setDate(el.dataset.k); break;
      case 'date-open': {
        const p = $('#datePick');
        try { p.showPicker(); } catch { p.focus(); p.click(); }
        break;
      }
      case 'chart-day': ui.view = 'day'; ui.date = el.dataset.k; renderNav(); renderView(); break;

      /* dock */
      case 'meal-menu': closeSnapMenu(); $('#mealMenu').classList.toggle('open'); break;
      case 'meal-choose': ui.meal = el.dataset.v; renderMealPill(); closeMealMenu(); $('#foodInput').focus(); break;
      case 'chip': quickAdd(el.dataset.key, el); break;
      case 'meal-add': ui.meal = el.dataset.meal; renderMealPill(); openSheet('', el.dataset.meal); break;
      case 'item-del': removeItem(el.dataset.meal, el.dataset.id); break;

      /* insights */
      case 'tip-next': ui.tip = (ui.tip || 0) + 1; renderInsights(); break;

      /* sheet */
      case 'sheet-backdrop': if (e.target === el) closeSheet(); break;
      case 'sheet-close': closeSheet(); break;
      case 'sheet-retry': parseFood(); break;
      case 'sheet-edit':
        sheet.status = sheet.photo ? 'snap' : 'compose'; renderSheet();
        $(sheet.photo ? '#snapText' : '#composeText')?.focus(); break;
      case 'snap-menu': closeMealMenu(); $('#snapMenu').classList.toggle('open'); break;
      case 'snap-camera': startSnap(sheet.open ? sheet.meal : ui.meal, 'camera'); break;
      case 'snap-upload': startSnap(sheet.open ? sheet.meal : ui.meal, 'upload'); break;
      case 'snap-analyze': submitSnap(); break;
      case 'sheet-analyze': submitCompose(); break;
      case 'sheet-chip': { const m = sheet.meal; closeSheet(); quickAdd(el.dataset.key, null, m); break; }
      case 'sheet-meal': {
        sheet.meal = el.dataset.v;
        const seg = $('#sheetSeg');
        seg.style.setProperty('--i', MEALS.findIndex((m) => m.id === sheet.meal));
        $$('button', seg).forEach((b) => b.classList.toggle('on', b === el));
        updateSheetTotals();
        if (sheet.status === 'compose') renderSheetHead();
        break;
      }
      case 'sheet-del': {
        const i = Number(el.dataset.i);
        const card = el.closest('.edit-item');
        card.classList.add('leaving');
        setTimeout(() => { sheet.items.splice(i, 1); renderSheet(); $$('.edit-item').forEach((c) => (c.style.animation = 'none')); }, 220);
        break;
      }
      case 'sheet-add': confirmSheet(); break;
    }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.ob) {
      ob[t.dataset.ob] = t.value;
      renderObActions();
    } else if (t.dataset.plan && ob.plan) {
      ob.plan[t.dataset.plan] = round(num(t.value, 20000));
      updatePlanNote();
      const btn = $('[data-act="ob-save"]'); if (btn) btn.disabled = !(ob.plan.calories > 0);
    } else if (t.dataset.si != null) {
      const it = sheet.items[Number(t.dataset.si)]; if (!it) return;
      const k = t.dataset.k;
      it[k] = k === 'name' || k === 'portion' ? t.value : num(t.value, k === 'calories' ? 5000 : 800);
      updateSheetTotals();
    } else if (t.id === 'snapText') {
      sheet.text = t.value;
    } else if (t.id === 'composeText') {
      sheet.text = t.value;
      const b = $('#sheetAnalyze'); if (b) b.disabled = !t.value.trim();
    } else if (t.id === 'foodInput') {
      $('#sendBtn').disabled = !t.value.trim();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'datePick' && e.target.value) setDate(e.target.value);
    if (e.target.id === 'snapInput' || e.target.id === 'uploadInput') onSnapFile(e.target.files?.[0]);
  });

  document.addEventListener('submit', (e) => {
    if (e.target.classList.contains('key-form')) {
      e.preventDefault();
      const k = e.target.key.value.trim();
      if (!k) return;
      try { localStorage.setItem(KEY_STORE, k); } catch {}
      CFG.GEMINI_API_KEY = k;
      const act = e.target.dataset.retry;
      if (act === 'ob-retry') obCalculate();
      else if (act === 'sheet-retry') parseFood();
      else renderInsights();
      return;
    }
    if (e.target.id === 'sheetCompose') { e.preventDefault(); submitCompose(); return; }
    if (e.target.id === 'sheetSnap') { e.preventDefault(); submitSnap(); return; }
    if (e.target.id !== 'composer') return;
    e.preventDefault();
    const text = $('#foodInput').value.trim();
    if (text) { $('#foodInput').blur(); openSheet(text); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (sheet.open) closeSheet(); else { closeMealMenu(); closeSnapMenu(); } }
    if (e.key === 'Enter' && e.target.dataset?.ob && obValid()) obGo(1);
    if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'composeText') { e.preventDefault(); submitCompose(); }
    if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'snapText') { e.preventDefault(); submitSnap(); }
  });

  // Roll over to the new day if the app is left open past midnight
  let lastToday = todayKey();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !store.targets) return;
    const t = todayKey();
    if (t !== lastToday) { if (ui.date === lastToday) ui.date = t; lastToday = t; ui.meal = defaultMeal(); renderMain(); }
  });

  /* ---------- boot ---------- */

  if (store.targets && store.profile) renderMain(); else renderOnboarding();
})();
