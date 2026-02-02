# App scripts

## Android release signing

**Do not manually edit any file in `android/`.** Use only **`npm run prebuild`** — it runs `expo prebuild` and then auto-patches `android/app/build.gradle` with release signing. No single-line edits in android/ are needed.

- One-time: put **`evenlysplit-release-key.keystore`** and **`keystore.properties`** (with `storePassword`, `keyPassword`, `keyAlias`) in the **app root**.
- Always run **`npm run prebuild`** (not raw `expo prebuild`) so the script runs after prebuild and applies everything.
- Optional: `cd android && ./gradlew checkReleaseSigning` to verify keystore SHA1 vs Play’s expected value.
