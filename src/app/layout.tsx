import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientProviders } from "@/components/client-providers";
import "./globals.css";

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
  themeColor: "#2ECC71",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased`}>
        <TooltipProvider>
          <ClientProviders>{children}</ClientProviders>
        </TooltipProvider>
      </body>
    </html>
  );
}
