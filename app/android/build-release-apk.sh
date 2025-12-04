#!/bin/bash

# Script to build Android Release APK
# This will create a signed release APK ready for distribution

cd "$(dirname "$0")"

echo "=========================================="
echo "Building Android Release APK"
echo "=========================================="
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build release APK
echo ""
echo "🔨 Building release APK..."
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Release APK built successfully!"
    echo ""
    echo "📦 APK Location:"
    echo "   app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "📊 APK Info:"
    if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
        ls -lh app/build/outputs/apk/release/app-release.apk
        echo ""
        echo "🔍 Verifying APK signature..."
        jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk | head -20
    fi
else
    echo ""
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

