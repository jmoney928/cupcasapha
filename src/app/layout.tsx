import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/cart-context";
import { MetaPixelRouteTracker } from "@/components/meta-pixel";

const META_PIXEL_ID = "2179463309497237";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cupcasa.com"),
  title: {
    default: "cupcasa — Fully PHA Compostable Cups, Unbranded",
    template: "%s · cupcasa cups",
  },
  description:
    "Marine-degradable, home & industrial compostable PHA cups. Blank, unbranded, and built to make your café look as good as it does good. Buy online or order wholesale by the case.",
  keywords: [
    "PHA cups",
    "compostable cups",
    "marine degradable",
    "unbranded cups",
    "wholesale compostable cups",
    "plastic-free cups",
  ],
  openGraph: {
    title: "cupcasa — Fully PHA Compostable Cups",
    description:
      "Marine-degradable, compostable PHA cups. Blank & unbranded. Buy online or wholesale.",
    type: "website",
    url: "https://cupcasa.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        <CartProvider>
          <MetaPixelRouteTracker />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
