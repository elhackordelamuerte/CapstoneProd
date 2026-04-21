import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MeetingPi",
  description: "Local meeting recording, transcription and AI summarisation on Raspberry Pi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body className="flex min-h-screen">
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex min-w-0 flex-col">
              <header className="flex h-12 md:hidden items-center border-b px-4 shrink-0">
                <SidebarTrigger />
              </header>
              <main className="flex-1 overflow-y-auto w-full max-w-full">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
