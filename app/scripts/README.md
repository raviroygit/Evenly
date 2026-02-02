# App scripts

## Android release signing

**`npm run prebuild`** runs `expo prebuild` and then **`scripts/android-release-signing.js`**, which patches `android/app/build.gradle` so that after every prebuild you never get the Play Console “wrong key” error.

The script injects:

- **App root** from `projectDir` (reliable path to keystore from any CWD).
- **Release keystore** `evenlysplit-release-key.keystore` and **keystore.properties** in the app root.
- **Play expected SHA1** (`03:33:93:CF:1C:B6:22:D7:64:7F:67:1D:0C:03:D4:32:4A:2B:04:6C`) for verification.
- **Release build fails** if the keystore or `keystore.properties` is missing (no silent fallback to debug).
- **`checkReleaseSigning`** Gradle task: run `cd android && ./gradlew checkReleaseSigning` to print your keystore SHA1 and compare with Play’s expected value.

One-time: put `evenlysplit-release-key.keystore` and `keystore.properties` (with `storePassword`, `keyPassword`, `keyAlias`) in the app root. Always use **`npm run prebuild`** (not raw `expo prebuild`) so the patch is applied after prebuild.
