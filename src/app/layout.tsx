import type { Metadata } from "next"
import "./globals.css"
import { QueryProvider } from "@/components/providers/QueryProvider"

export const metadata: Metadata = {
  title: "Pocket Trader",
  description: "AI 기반 자동 트레이딩",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
