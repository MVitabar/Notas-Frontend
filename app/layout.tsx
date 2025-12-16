import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { Toaster } from "sonner"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Sistema de Notas - Liceo Cristiano Zapaneco",
  description: "Sistema de Notas - Liceo Cristiano Zapaneco",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>
          <AuthProvider>
            <Toaster />
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
