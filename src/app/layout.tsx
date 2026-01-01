import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { CopilotProvider } from "@/components/providers/copilot-provider";
import { CopilotSidebar } from "@/components/copilot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Landeed Bot - AI-Powered Task Management",
  description:
    "Manage your tasks with an intelligent AI copilot that helps you plan, prioritize, and execute.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            <CopilotProvider>
              {children}
              <CopilotSidebar />
              <Toaster position="top-right" />
            </CopilotProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
