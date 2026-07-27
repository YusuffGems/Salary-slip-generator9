import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "Salary Slip Generator",
  description: "Automatic salary slip generation and payroll email automation",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen overflow-hidden antialiased">
        <NextTopLoader color="#3d64f4" height={3} showSpinner={false} />
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="app-main h-screen flex-1 overflow-y-auto md:ml-64 p-4 pt-20 pb-24 md:p-8">{children}</main>
            </div>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}