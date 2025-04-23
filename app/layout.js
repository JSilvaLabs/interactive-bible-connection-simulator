// app/layout.js (MVP v8.0 Update - Title/Description)
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

// Updated Metadata for MVP v8.0
export const metadata = {
  title: 'Bible Connections', // Changed title
  description: 'Explore the interconnectedness of Scripture visually.', // Updated description
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Apply dark mode based on system preference, requires Tailwind dark mode config */}
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900`}>
        {children}
      </body>
    </html>
  )
}