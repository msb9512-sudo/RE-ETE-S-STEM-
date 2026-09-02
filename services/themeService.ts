import { UIPreferences, ThemeColor, FontFamily, ShapeRadius, InterfaceDensity, CardStyle } from '../types';

export const DEFAULT_UI_PREFERENCES: UIPreferences = {
  theme: 'indigo',
  font: 'inter',
  radius: 'standard',
  density: 'normal',
  cardStyle: 'shadow',
  enableAnimations: true,
  fontSize: 'normal',
};

const STORAGE_KEY = 'otel_ui_preferences';

export const loadUIPreferences = (): UIPreferences => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_UI_PREFERENCES, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load UI preferences:', e);
  }
  return DEFAULT_UI_PREFERENCES;
};

export const saveUIPreferences = (prefs: UIPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    applyUIPreferences(prefs);
  } catch (e) {
    console.error('Failed to save UI preferences:', e);
  }
};

export const applyUIPreferences = (prefs: UIPreferences): void => {
  const root = document.documentElement;
  
  // Set data attributes on html root
  root.setAttribute('data-theme', prefs.theme);
  root.setAttribute('data-font', prefs.font);
  root.setAttribute('data-radius', prefs.radius);
  root.setAttribute('data-density', prefs.density);
  root.setAttribute('data-card', prefs.cardStyle);
  root.setAttribute('data-fontsize', prefs.fontSize);
  root.setAttribute('data-animations', String(prefs.enableAnimations));

  // Inject or update dynamic stylesheet
  let styleEl = document.getElementById('otel-dynamic-theme-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'otel-dynamic-theme-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* Font Selection */
    [data-font="inter"] body, [data-font="inter"] button, [data-font="inter"] input, [data-font="inter"] select, [data-font="inter"] textarea {
      font-family: 'Inter', -apple-system, sans-serif !important;
    }
    [data-font="jakarta"] body, [data-font="jakarta"] button, [data-font="jakarta"] input, [data-font="jakarta"] select, [data-font="jakarta"] textarea {
      font-family: 'Plus Jakarta Sans', sans-serif !important;
    }
    [data-font="outfit"] body, [data-font="outfit"] button, [data-font="outfit"] input, [data-font="outfit"] select, [data-font="outfit"] textarea {
      font-family: 'Outfit', sans-serif !important;
    }
    [data-font="montserrat"] body, [data-font="montserrat"] button, [data-font="montserrat"] input, [data-font="montserrat"] select, [data-font="montserrat"] textarea {
      font-family: 'Montserrat', sans-serif !important;
    }
    [data-font="poppins"] body, [data-font="poppins"] button, [data-font="poppins"] input, [data-font="poppins"] select, [data-font="poppins"] textarea {
      font-family: 'Poppins', sans-serif !important;
    }
    [data-font="roboto"] body, [data-font="roboto"] button, [data-font="roboto"] input, [data-font="roboto"] select, [data-font="roboto"] textarea {
      font-family: 'Roboto', sans-serif !important;
    }

    /* Font Size Scale */
    [data-fontsize="compact"] { font-size: 92% !important; }
    [data-fontsize="normal"] { font-size: 100% !important; }
    [data-fontsize="large"] { font-size: 108% !important; }

    /* Shape: Keskin (Sharp 4px) */
    [data-radius="sharp"] .rounded-2xl,
    [data-radius="sharp"] .rounded-3xl,
    [data-radius="sharp"] .rounded-xl,
    [data-radius="sharp"] .rounded-lg,
    [data-radius="sharp"] .rounded-\\[2rem\\],
    [data-radius="sharp"] .rounded-\\[3rem\\],
    [data-radius="sharp"] .rounded-\\[1\\.5rem\\] {
      border-radius: 4px !important;
    }
    [data-radius="sharp"] button,
    [data-radius="sharp"] input,
    [data-radius="sharp"] select,
    [data-radius="sharp"] textarea {
      border-radius: 4px !important;
    }

    /* Shape: Dengeli (Standard) */
    [data-radius="standard"] .rounded-2xl { border-radius: 1rem !important; }
    [data-radius="standard"] .rounded-3xl { border-radius: 1.5rem !important; }
    [data-radius="standard"] .rounded-\\[2rem\\] { border-radius: 1.25rem !important; }
    [data-radius="standard"] .rounded-\\[3rem\\] { border-radius: 1.5rem !important; }

    /* Shape: Yumuşak (Soft) */
    [data-radius="soft"] .rounded-2xl { border-radius: 1.4rem !important; }
    [data-radius="soft"] .rounded-3xl { border-radius: 2rem !important; }
    [data-radius="soft"] .rounded-xl { border-radius: 1rem !important; }
    [data-radius="soft"] button,
    [data-radius="soft"] input,
    [data-radius="soft"] select {
      border-radius: 14px !important;
    }

    /* Shape: Oval / Pill */
    [data-radius="pill"] .rounded-2xl { border-radius: 2rem !important; }
    [data-radius="pill"] .rounded-3xl { border-radius: 2.75rem !important; }
    [data-radius="pill"] button:not(.no-pill) { border-radius: 9999px !important; }
    [data-radius="pill"] input,
    [data-radius="pill"] select {
      border-radius: 9999px !important;
      padding-left: 1.25rem !important;
      padding-right: 1.25rem !important;
    }

    /* Card Styles */
    [data-card="border"] .bg-white {
      box-shadow: none !important;
      border: 1.5px solid #cbd5e1 !important;
    }
    [data-card="glass"] .bg-white {
      background-color: rgba(255, 255, 255, 0.88) !important;
      backdrop-filter: blur(16px) !important;
      border-color: rgba(255, 255, 255, 0.5) !important;
    }
    [data-card="contrast"] .bg-white {
      border: 2px solid #0f172a !important;
      box-shadow: 0 4px 0 #0f172a !important;
    }

    /* Interface Density */
    [data-density="compact"] .p-8 { padding: 1.25rem !important; }
    [data-density="compact"] .p-6 { padding: 1rem !important; }
    [data-density="compact"] .p-5 { padding: 0.75rem !important; }
    [data-density="compact"] .gap-6 { gap: 1rem !important; }
    [data-density="compact"] .gap-8 { gap: 1.25rem !important; }

    [data-density="spacious"] .p-6 { padding: 2rem !important; }
    [data-density="spacious"] .gap-6 { gap: 2rem !important; }

    /* Animations Toggle */
    [data-animations="false"] *,
    [data-animations="false"] *::before,
    [data-animations="false"] *::after {
      animation-duration: 0.001s !important;
      transition-duration: 0.001s !important;
    }

    /* THEME: EMERALD (Zümrüt Yeşili) */
    [data-theme="emerald"] .bg-indigo-600 { background-color: #059669 !important; }
    [data-theme="emerald"] .hover\\:bg-indigo-700:hover { background-color: #047857 !important; }
    [data-theme="emerald"] .hover\\:bg-indigo-500:hover { background-color: #10b981 !important; }
    [data-theme="emerald"] .bg-indigo-50 { background-color: #ecfdf5 !important; }
    [data-theme="emerald"] .bg-indigo-100 { background-color: #d1fae5 !important; }
    [data-theme="emerald"] .text-indigo-600 { color: #059669 !important; }
    [data-theme="emerald"] .text-indigo-500 { color: #10b981 !important; }
    [data-theme="emerald"] .text-indigo-400 { color: #34d399 !important; }
    [data-theme="emerald"] .text-indigo-700 { color: #047857 !important; }
    [data-theme="emerald"] .border-indigo-500,
    [data-theme="emerald"] .border-indigo-600 { border-color: #059669 !important; }
    [data-theme="emerald"] .border-indigo-200 { border-color: #a7f3d0 !important; }
    [data-theme="emerald"] .border-indigo-100 { border-color: #d1fae5 !important; }
    [data-theme="emerald"] input:focus, [data-theme="emerald"] select:focus { border-color: #059669 !important; }
    [data-theme="emerald"] .shadow-indigo-200 { --tw-shadow-color: #a7f3d0 !important; }
    [data-theme="emerald"] .shadow-indigo-100 { --tw-shadow-color: #d1fae5 !important; }

    /* THEME: OCEAN (Okyanus Mavisi / Teal) */
    [data-theme="ocean"] .bg-indigo-600 { background-color: #0891b2 !important; }
    [data-theme="ocean"] .hover\\:bg-indigo-700:hover { background-color: #0e7490 !important; }
    [data-theme="ocean"] .hover\\:bg-indigo-500:hover { background-color: #06b6d4 !important; }
    [data-theme="ocean"] .bg-indigo-50 { background-color: #ecfeff !important; }
    [data-theme="ocean"] .bg-indigo-100 { background-color: #cffafe !important; }
    [data-theme="ocean"] .text-indigo-600 { color: #0891b2 !important; }
    [data-theme="ocean"] .text-indigo-500 { color: #06b6d4 !important; }
    [data-theme="ocean"] .text-indigo-400 { color: #22d3ee !important; }
    [data-theme="ocean"] .text-indigo-700 { color: #0e7490 !important; }
    [data-theme="ocean"] .border-indigo-500,
    [data-theme="ocean"] .border-indigo-600 { border-color: #0891b2 !important; }
    [data-theme="ocean"] .border-indigo-200 { border-color: #a5f3fc !important; }
    [data-theme="ocean"] .border-indigo-100 { border-color: #cffafe !important; }
    [data-theme="ocean"] input:focus, [data-theme="ocean"] select:focus { border-color: #0891b2 !important; }
    [data-theme="ocean"] .shadow-indigo-200 { --tw-shadow-color: #a5f3fc !important; }
    [data-theme="ocean"] .shadow-indigo-100 { --tw-shadow-color: #cffafe !important; }

    /* THEME: AMBER (Lüks Altın & Kehribar) */
    [data-theme="amber"] .bg-indigo-600 { background-color: #d97706 !important; }
    [data-theme="amber"] .hover\\:bg-indigo-700:hover { background-color: #b45309 !important; }
    [data-theme="amber"] .hover\\:bg-indigo-500:hover { background-color: #f59e0b !important; }
    [data-theme="amber"] .bg-indigo-50 { background-color: #fffbeb !important; }
    [data-theme="amber"] .bg-indigo-100 { background-color: #fef3c7 !important; }
    [data-theme="amber"] .text-indigo-600 { color: #d97706 !important; }
    [data-theme="amber"] .text-indigo-500 { color: #f59e0b !important; }
    [data-theme="amber"] .text-indigo-400 { color: #fbbf24 !important; }
    [data-theme="amber"] .text-indigo-700 { color: #b45309 !important; }
    [data-theme="amber"] .border-indigo-500,
    [data-theme="amber"] .border-indigo-600 { border-color: #d97706 !important; }
    [data-theme="amber"] .border-indigo-200 { border-color: #fde68a !important; }
    [data-theme="amber"] .border-indigo-100 { border-color: #fef3c7 !important; }
    [data-theme="amber"] input:focus, [data-theme="amber"] select:focus { border-color: #d97706 !important; }
    [data-theme="amber"] .shadow-indigo-200 { --tw-shadow-color: #fde68a !important; }
    [data-theme="amber"] .shadow-indigo-100 { --tw-shadow-color: #fef3c7 !important; }

    /* THEME: ROSE (Gül & Bordo) */
    [data-theme="rose"] .bg-indigo-600 { background-color: #e11d48 !important; }
    [data-theme="rose"] .hover\\:bg-indigo-700:hover { background-color: #be123c !important; }
    [data-theme="rose"] .hover\\:bg-indigo-500:hover { background-color: #f43f5e !important; }
    [data-theme="rose"] .bg-indigo-50 { background-color: #fff1f2 !important; }
    [data-theme="rose"] .bg-indigo-100 { background-color: #ffe4e6 !important; }
    [data-theme="rose"] .text-indigo-600 { color: #e11d48 !important; }
    [data-theme="rose"] .text-indigo-500 { color: #f43f5e !important; }
    [data-theme="rose"] .text-indigo-400 { color: #fb7185 !important; }
    [data-theme="rose"] .text-indigo-700 { color: #be123c !important; }
    [data-theme="rose"] .border-indigo-500,
    [data-theme="rose"] .border-indigo-600 { border-color: #e11d48 !important; }
    [data-theme="rose"] .border-indigo-200 { border-color: #fecdd3 !important; }
    [data-theme="rose"] .border-indigo-100 { border-color: #ffe4e6 !important; }
    [data-theme="rose"] input:focus, [data-theme="rose"] select:focus { border-color: #e11d48 !important; }
    [data-theme="rose"] .shadow-indigo-200 { --tw-shadow-color: #fecdd3 !important; }
    [data-theme="rose"] .shadow-indigo-100 { --tw-shadow-color: #ffe4e6 !important; }

    /* THEME: SLATE (Minimalist Titanyum) */
    [data-theme="slate"] .bg-indigo-600 { background-color: #334155 !important; }
    [data-theme="slate"] .hover\\:bg-indigo-700:hover { background-color: #1e293b !important; }
    [data-theme="slate"] .hover\\:bg-indigo-500:hover { background-color: #475569 !important; }
    [data-theme="slate"] .bg-indigo-50 { background-color: #f1f5f9 !important; }
    [data-theme="slate"] .bg-indigo-100 { background-color: #e2e8f0 !important; }
    [data-theme="slate"] .text-indigo-600 { color: #334155 !important; }
    [data-theme="slate"] .text-indigo-500 { color: #475569 !important; }
    [data-theme="slate"] .text-indigo-400 { color: #64748b !important; }
    [data-theme="slate"] .text-indigo-700 { color: #1e293b !important; }
    [data-theme="slate"] .border-indigo-500,
    [data-theme="slate"] .border-indigo-600 { border-color: #334155 !important; }
    [data-theme="slate"] .border-indigo-200 { border-color: #cbd5e1 !important; }
    [data-theme="slate"] .border-indigo-100 { border-color: #e2e8f0 !important; }
    [data-theme="slate"] input:focus, [data-theme="slate"] select:focus { border-color: #334155 !important; }
    [data-theme="slate"] .shadow-indigo-200 { --tw-shadow-color: #cbd5e1 !important; }
    [data-theme="slate"] .shadow-indigo-100 { --tw-shadow-color: #e2e8f0 !important; }

    /* THEME: DARK (Gece Modu / Obsidyen) */
    [data-theme="dark"] body { background-color: #090d16 !important; color: #f1f5f9 !important; }
    [data-theme="dark"] .bg-\\[\\#f1f5f9\\],
    [data-theme="dark"] .bg-\\[\\#f8fafc\\] { background-color: #090d16 !important; }
    [data-theme="dark"] .bg-white { background-color: #131d31 !important; color: #f1f5f9 !important; border-color: #1e293b !important; }
    [data-theme="dark"] .bg-slate-50 { background-color: #0d1527 !important; }
    [data-theme="dark"] .bg-slate-100 { background-color: #1e293b !important; }
    [data-theme="dark"] .text-slate-800,
    [data-theme="dark"] .text-slate-900,
    [data-theme="dark"] .text-slate-700 { color: #f8fafc !important; }
    [data-theme="dark"] .text-slate-600,
    [data-theme="dark"] .text-slate-500 { color: #94a3b8 !important; }
    [data-theme="dark"] .border-slate-200,
    [data-theme="dark"] .border-slate-100 { border-color: #1e293b !important; }
    [data-theme="dark"] input,
    [data-theme="dark"] select,
    [data-theme="dark"] textarea {
      background-color: #1e293b !important;
      color: #ffffff !important;
      border-color: #334155 !important;
    }
  `;
};
