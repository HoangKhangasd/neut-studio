import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '../providers/query-provider';
import { HeaderMegaMenu } from '../components/store/HeaderMegaMenu';
import { MiniCartDrawer } from '../components/store/MiniCartDrawer';
import { InstantSearchDrawer } from '../components/store/InstantSearchDrawer';
import { Footer } from '../components/store/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NEUT-STUDIO | Official Streetwear Store',
  description: 'Thương hiệu thời trang đường phố Việt Nam — High density fabrics, oversize silhouettes, industrial aesthetics.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-white text-black font-sans selection:bg-black selection:text-white">
        <QueryProvider>
          <HeaderMegaMenu />
          <main className="flex-1 w-full">{children}</main>
          <MiniCartDrawer />
          <InstantSearchDrawer />
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
