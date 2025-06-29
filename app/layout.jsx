import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// DEMI AS OF 4:10 PM ON 6/28/2025: Thank fuck this is the only page on the site.

export const metadata = {
  title: 'Demi\'s Corner',
  description: 'Track 01.',
  keywords: ['Demi', 'personal website', 'music', 'Last.FM', 'portfolio'],
  authors: [{ name: 'Demi' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  // This is also what Discord uses for their website embeds, if you want to tweak it.
  openGraph: {
    title: 'Demi\'s Corner',
    description: 'Track 01.',
    type: 'website',
  },
  twitter: {
    title: 'Demi\'s Corner',
    description: 'Track 01.',
    card: 'summary_large_image', // does this thing even work?
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
