import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientProviders } from "@/components/client-providers";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import Analytics from "./analytics";
import CookieBanner from "@/components/ui/cookie-banner";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SmashScheduler",
  description: "Badminton club session scheduler",
  icons: {
    icon: "/icon-48.png",
    apple: "/icon-180.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#2ECC71",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} antialiased`} suppressHydrationWarning>
        <Analytics />
        <CookieBanner />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <ClientProviders>{children}</ClientProviders>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
