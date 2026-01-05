import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'ETHStars Opportunities | Ethereum Jobs, Bounties & Grants',
  description:
    'Discover the best opportunities in the Ethereum ecosystem. Find jobs, bounties, grants, and projects from top Web3 companies.',
  openGraph: {
    title: 'ETHStars Opportunities | Ethereum Jobs, Bounties & Grants',
    description:
      'Discover the best opportunities in the Ethereum ecosystem. Find jobs, bounties, grants, and projects from top Web3 companies.',
    url: '/',
    siteName: 'ETHStars',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ETHStars Opportunities | Ethereum Jobs, Bounties & Grants',
    description:
      'Discover the best opportunities in the Ethereum ecosystem. Find jobs, bounties, grants, and projects from top Web3 companies.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="noise">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

