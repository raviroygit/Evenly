import type { Metadata } from 'next';

const SITE_URL = 'https://evenlysplit.nxtgenaidev.com';

export const metadata: Metadata = {
  title: 'Download EvenlySplit - Split Bills Effortlessly',
  description:
    'Download EvenlySplit - the easiest way to split bills with friends, roommates, and groups. Available on iPhone and Android.',
  openGraph: {
    title: 'EvenlySplit - Split Bills Effortlessly',
    description:
      'Download EvenlySplit - the easiest way to split bills with friends, roommates, and groups.',
    url: `${SITE_URL}/download`,
    siteName: 'EvenlySplit',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/icon.png`,
        width: 512,
        height: 512,
        alt: 'EvenlySplit App Icon',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'EvenlySplit - Split Bills Effortlessly',
    description:
      'Download EvenlySplit - the easiest way to split bills with friends.',
    images: [`${SITE_URL}/icon.png`],
  },
};

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
