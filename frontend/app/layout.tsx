import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: {
    default: 'FRIENDS — AI App Builder',
    template: '%s | FRIENDS',
  },
  description:
    'Describe any idea. FRIENDS enhances the prompt, designs architecture, generates code, validates it, repairs issues, and exports a runnable project.',
  keywords: [
    'AI app builder',
    'code generator',
    'FRIENDS platform',
    'AI development',
    'project generator',
    'prompt to code',
  ],
  authors: [{ name: 'FRIENDS Team' }],
  openGraph: {
    type: 'website',
    title: 'FRIENDS — AI App Builder',
    description:
      'Framework for Rapid Intelligent Execution, Networking, Design, and Strategy. Build complete apps with your AI team.',
    siteName: 'FRIENDS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FRIENDS — AI App Builder',
    description:
      'Build complete apps with your AI team. Prompt → Enhance → Generate → Validate → Export.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(5, 5, 26, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              color: '#f1f5f9',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.1)',
            },
          }}
        />
      </body>
    </html>
  );
}
