'use client';

import { useEffect } from 'react';

const APP_STORE_URL = 'https://apps.apple.com/us/app/evenlysplit/id6756101586';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.nxtgenaidev.evenly';

export default function DownloadPage() {
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIOS) {
      window.location.href = APP_STORE_URL;
    } else if (isAndroid) {
      window.location.href = PLAY_STORE_URL;
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <img
        src="/icon.png"
        alt="EvenlySplit"
        className="w-24 h-24 rounded-2xl mb-6"
      />
      <h1 className="text-3xl font-bold text-white mb-2">Download EvenlySplit</h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        The easiest way to split bills with friends, roommates, and groups.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <a
          href={APP_STORE_URL}
          className="flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition"
        >
          <svg viewBox="0 0 384 512" className="w-5 h-5" fill="currentColor">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          iPhone (App Store)
        </a>
        <a
          href={PLAY_STORE_URL}
          className="flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition"
        >
          <svg viewBox="0 0 512 512" className="w-5 h-5" fill="currentColor">
            <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
          </svg>
          Android (Play Store)
        </a>
      </div>
    </div>
  );
}
