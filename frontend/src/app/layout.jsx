import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Digital Signage Platform',
  description: 'Enterprise digital signage management system for controlling displays and content',
  keywords: 'digital signage, display management, content management, enterprise',
  authors: [{ name: 'Digital Signage Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Digital Signage" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <div id="root" className="min-h-screen">
                {children}
              </div>
              
              {/* Accessibility announcements region */}
              <div 
                id="a11y-announcements" 
                aria-live="polite" 
                aria-atomic="true" 
                className="sr-only"
              />
              
              {/* Skip to main content for screen readers */}
              <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:p-4 focus:bg-blue-600 focus:text-white focus:no-underline"
              >
                Skip to main content
              </a>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}