'use client';

import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { FuturisticNavbar } from '@/components/layout/FuturisticNavbar';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <FuturisticNavbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
