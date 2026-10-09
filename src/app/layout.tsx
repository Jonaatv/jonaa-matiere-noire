import type { Metadata, Viewport } from "next";

import { CosmicBackdrop } from "@/components/cosmos/CosmicBackdrop";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { siteConfig } from "@/config/site";
import { displayFont, sansFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  ...(siteConfig.url ? { metadataBase: new URL(siteConfig.url) } : {}),
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    locale: siteConfig.locale,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050508",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${displayFont.variable} ${sansFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <CosmicBackdrop />
        <div className="relative z-10 flex min-h-svh flex-col">
          <SkipLink />
          <Header />
          <main id="contenu" className="flex flex-1 flex-col">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
