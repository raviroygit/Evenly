#!/usr/bin/env node
/**
 * Patches android/app/build.gradle so release builds always use the correct
 * keystore and never fall back to debug (avoids Play Console "wrong key" error).
 * Run after expo prebuild so signing is applied. Safe to run multiple times (idempotent).
 *
 * Injects:
 * - App root from projectDir (reliable path), release keystore + keystore.properties
 * - Play expected SHA1 (03:33:93:...) for verification
 * - Release build FAILS if keystore missing (no silent debug fallback)
 * - checkReleaseSigning task to print keystore SHA1 vs Play's expected
 *
 * Usage: node scripts/android-release-signing.js
 * (Run from app root; prebuild script runs this automatically.)
 */

const fs = require('fs');
const path = require('path');

const APP_ROOT = path.resolve(__dirname, '..');
const BUILD_GRADLE = path.join(APP_ROOT, 'android', 'app', 'build.gradle');

const MARKER = 'evenlysplit-release-key.keystore';
const PLAY_EXPECTED_SHA1 = '03:33:93:CF:1C:B6:22:D7:64:7F:67:1D:0C:03:D4:32:4A:2B:04:6C';

// Insert after "def projectRoot = ..." so path is correct from any CWD
const VARIABLES_INSERT = `
// App root (parent of android/) - resolve from this module so path is correct from any CWD
def appRoot = projectDir.parentFile.parentFile
def releaseKeystoreFile = new File(appRoot, "evenlysplit-release-key.keystore")
def keystorePropsFile = new File(appRoot, "keystore.properties")
def useReleaseSigning = releaseKeystoreFile.exists() && keystorePropsFile.exists()

// Play Console expected certificate fingerprint (for verification)
def PLAY_EXPECTED_SHA1 = "${PLAY_EXPECTED_SHA1}"
`;

const RELEASE_SIGNING_CONFIGS = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (useReleaseSigning) {
                def keystoreProps = new Properties()
                keystoreProps.load(new FileInputStream(keystorePropsFile))
                storeFile releaseKeystoreFile
                storePassword keystoreProps['storePassword']
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
            }
        }
    }`;

// Release build: fail if not configured, use release key (no debug fallback)
const RELEASE_BUILD_TYPE = `        release {
            if (!useReleaseSigning) {
                throw new GradleException(
                    "Release signing is not configured. Place evenlysplit-release-key.keystore and keystore.properties in the app root (" + appRoot.absolutePath + "). " +
                    "Play Console expects SHA1: " + PLAY_EXPECTED_SHA1 + ". Do not use the debug keystore for release."
                )
            }
            signingConfig signingConfigs.release
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'`;

const DEFAULT_SIGNING_CONFIGS = /    signingConfigs \{\s*\n        debug \{\s*\n            storeFile file\('debug\.keystore'\)\s*\n            storePassword 'android'\s*\n            keyAlias 'androiddebugkey'\s*\n            keyPassword 'android'\s*\n        \}\s*\n    \}/;

// release { signingConfig signingConfigs.debug ... -> our release block
const DEFAULT_RELEASE_BLOCK = /        release \{\s*\n            signingConfig signingConfigs\.debug\s*\n            def enableShrinkResources/;
const PATCHED_RELEASE_BLOCK = RELEASE_BUILD_TYPE + '\n            def enableShrinkResources';

// Insert variables after projectRoot line (only if not already present)
const PROJECT_ROOT_LINE = /(def projectRoot = rootDir\.getAbsoluteFile\(\)\.getParentFile\(\)\.getAbsolutePath\(\)\n)/;

const CHECK_RELEASE_SIGNING_TASK = `
// Verify release signing and print keystore SHA1 (run: cd android && ./gradlew checkReleaseSigning)
tasks.register("checkReleaseSigning") {
    doLast {
        println "=== Release signing check ==="
        println "App root: " + appRoot.absolutePath
        println "Keystore exists: " + releaseKeystoreFile.exists() + " (" + releaseKeystoreFile.absolutePath + ")"
        println "keystore.properties exists: " + keystorePropsFile.exists() + " (" + keystorePropsFile.absolutePath + ")"
        println "Release signing will be used: " + useReleaseSigning
        println ""
        println "Play Console EXPECTS this certificate SHA1:"
        println "  " + PLAY_EXPECTED_SHA1
        if (useReleaseSigning) {
            def props = new Properties()
            props.load(new FileInputStream(keystorePropsFile))
            def storePass = props["storePassword"] ?: ""
            def keyAlias = props["keyAlias"] ?: ""
            println ""
            println "Your release keystore SHA1:"
            def outStream = new ByteArrayOutputStream()
            def errStream = new ByteArrayOutputStream()
            exec {
                commandLine "keytool", "-list", "-v", "-keystore", releaseKeystoreFile.absolutePath,
                    "-storepass", storePass,
                    "-alias", keyAlias
                standardOutput = outStream
                errorOutput = errStream
                ignoreExitValue = true
            }
            def out = outStream.toString()
            def sha1Lines = out.readLines().findAll { it.trim().startsWith("SHA1:") }
            if (sha1Lines) {
                sha1Lines.each { println "  " + it.trim() }
            } else {
                println "  (run manually: keytool -list -v -keystore \\"" + releaseKeystoreFile.absolutePath + "\\" -storepass <password> -alias " + keyAlias + ")"
            }
            println ""
            println "If the SHA1 above does not match Play's expected SHA1, you are using the wrong keystore file."
        } else {
            println ""
            println "WARNING: Release keystore/properties missing. Add them to the app root to build for Play Store."
        }
    }
}
`;

function main() {
  if (!fs.existsSync(BUILD_GRADLE)) {
    console.warn('android/app/build.gradle not found. Run "expo prebuild --platform android" first.');
    process.exit(0);
    return;
  }

  let content = fs.readFileSync(BUILD_GRADLE, 'utf8');

  if (content.includes(MARKER)) {
    console.log('Android release signing already applied.');
    process.exit(0);
    return;
  }

  if (!DEFAULT_SIGNING_CONFIGS.test(content)) {
    console.warn('Could not find default signingConfigs block in build.gradle. Skipping patch.');
    process.exit(0);
    return;
  }

  // 1) Insert appRoot, keystore paths, useReleaseSigning, PLAY_EXPECTED_SHA1 after projectRoot
  content = content.replace(PROJECT_ROOT_LINE, '$1' + VARIABLES_INSERT);

  // 2) Replace signingConfigs with our block (includes release)
  content = content.replace(DEFAULT_SIGNING_CONFIGS, RELEASE_SIGNING_CONFIGS);

  // 3) Replace release buildType: fail if !useReleaseSigning, use signingConfigs.release
  if (!DEFAULT_RELEASE_BLOCK.test(content)) {
    console.warn('Could not find release block with signingConfig signingConfigs.debug. Skipping release block patch.');
  } else {
    content = content.replace(DEFAULT_RELEASE_BLOCK, PATCHED_RELEASE_BLOCK);
  }

  // 4) Append checkReleaseSigning task if not present
  if (!content.includes('checkReleaseSigning')) {
    content = content.trimEnd() + CHECK_RELEASE_SIGNING_TASK + '\n';
  }

  fs.writeFileSync(BUILD_GRADLE, content, 'utf8');
  console.log('Android release signing applied to android/app/build.gradle');
  console.log('  - App root from projectDir; release fails if keystore missing; checkReleaseSigning task added.');
}

main();
