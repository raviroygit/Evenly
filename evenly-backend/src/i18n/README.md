# Email i18n (translations)

This folder contains everything needed for localized email content.

## Required files

| File | Purpose |
|------|---------|
| `emailTranslator.ts` | Loads JSON by language, exposes `t(lang, key, params)`, `getUserLanguage`, `getUserCurrencySymbol`. |
| `email/en.json` | English email copy (group invitations, expense notifications, khata, etc.). **Required.** |
| `email/hi.json` | Hindi email copy. **Required** for Hindi locale. |

## Adding a language

1. Add `email/<code>.json` (e.g. `email/ta.json` for Tamil) with the same key structure as `en.json`.
2. No code change needed: `emailTranslator` loads any `email/<lang>.json` on first use; unknown languages fall back to `en`.

## Deploy (GCP / Docker)

The compiled app runs from `dist/`. At runtime, `emailTranslator.js` reads translations from `dist/i18n/email/<lang>.json`.

- **Build:** `tsc` only compiles `.ts` → `dist/`; it does **not** copy `.json` files.
- **Dockerfile** must copy the email JSON files into the image:
  ```dockerfile
  COPY --from=builder /app/src/i18n/email ./dist/i18n/email
  ```
- The Dockerfile verification step checks that `dist/i18n/email/en.json` and `dist/i18n/email/hi.json` exist before starting the app.

If these files are missing in production, any email that uses `t()` (e.g. expense notifications) will throw and can cause 500 errors.
