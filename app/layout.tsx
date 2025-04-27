import { Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Geist } from 'next/font/google';
import { hasEnvVars } from '@/utils/supabase/check-env-vars';
import { EnvVarWarning } from '@/components/env-var-warning';
import NavBar from '@/components/layout/nav-bar';
import './globals.css';
import ThemeSwitcherWrapper from '@/components/layout/theme-switcher-wrapper';
import RouteCacheProvider from '@/components/layout/route-cache-provider';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'NS Collab - Network School Collaboration Hub',
  description:
    'Discover NS members, share ideas, and form teams within the Network School ',
};

const geistSans = Geist({
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Route Cache Provider for faster navigation */}
          <RouteCacheProvider />
          {!hasEnvVars && <EnvVarWarning />}
          <main className="min-h-screen flex flex-col">
            {/* Navigation with authentication */}
            <Suspense
              fallback={<div className="h-14 border-b border-border"></div>}
            >
              <NavBar />
            </Suspense>

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col gap-8 w-full">
                <Suspense
                  fallback={
                    <div className="animate-pulse h-96 bg-muted rounded-lg"></div>
                  }
                >
                  {children}
                </Suspense>
              </div>
            </div>

            <footer className="border-t border-border py-6 md:py-0">
              <div className="container flex items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  &copy; {new Date().getFullYear()} NS Collab
                </p>
                <ThemeSwitcherWrapper />
              </div>
            </footer>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
