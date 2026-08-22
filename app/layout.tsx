import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'B.B Cooperative',
  description: 'A cooperative platform for advertising partnerships and currency investments. Earn daily returns, weekly salary and referral commissions.',
  keywords: 'investment, cooperative, daily returns, forex, advertising',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'B.B Cooperative',
    description: 'Earn daily returns through advertising and forex partnerships.',
    url: 'https://bbc-org.vercel.app',
    siteName: 'B.B Cooperative',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
