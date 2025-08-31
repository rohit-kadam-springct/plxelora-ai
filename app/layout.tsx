import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from '@clerk/themes'
import "./globals.css";
import Provider from "./provider";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pixelora AI - Simple AI Visual Creation',
  description: 'Create stunning thumbnails with AI. Simple, powerful, and designed for creators who want results fast.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Pixelora AI - Simple AI Visual Creation',
    description: 'Turn your ideas into stunning thumbnails with just a few words',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#111111',
          colorInputBackground: '#1a1a1a',
          colorInputText: '#ffffff',
        }
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className={`${inter.className} bg-dark-900 text-white`}>
          <div className="dot-matrix-overlay" />
          <Provider>
            {children}
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
