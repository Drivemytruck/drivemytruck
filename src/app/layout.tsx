import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { getCurrentUser } from "@/lib/session";
import { getDict } from "@/lib/i18n";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://drivemytruck.co.uk"),
  title: { default: "Drive My Truck — HGV drivers & jobs, on demand", template: "%s · Drive My Truck" },
  description:
    "Connecting HGV drivers with transport companies for ad-hoc work across the UK. Verified drivers, honest reviews, no agency fees.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  openGraph: { images: ["/logo-full.png"] },
};

export const viewport: Viewport = { themeColor: "#0b2a5b", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const { lang, t } = await getDict();
  const navLabels =
    user?.role === "DRIVER"
      ? [t.nav.driverShort.jobs, t.nav.driverShort.work, t.nav.driverShort.availability, t.nav.driverShort.profile]
      : user?.role === "COMPANY"
        ? [t.nav.companyShort.home, t.nav.companyShort.post, t.nav.companyShort.drivers, t.nav.companyShort.company]
        : undefined;
  return (
    <html lang={lang === "pl" ? "pl" : "en-GB"} className={jakarta.variable}>
      <body className="min-h-dvh">
        <Header user={user ? { role: user.role } : null} t={t.nav} lang={lang} />
        <main className={user ? "pb-24 sm:pb-0" : ""}>{children}</main>
        {user && <BottomNav role={user.role} labels={navLabels} />}
        <footer className={`border-t border-slate-200 bg-white ${user ? "mb-20 sm:mb-0" : ""}`}>
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              <span className="font-semibold text-navy-900">Drive My Truck</span> · {t.footer.tagline}
            </p>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              <a href="/how-it-works" className="hover:text-navy-900">{t.footer.how}</a>
              <a href="/terms" className="hover:text-navy-900">{t.footer.terms}</a>
              <a href="/privacy" className="hover:text-navy-900">{t.footer.privacy}</a>
              <a href="/security" className="hover:text-navy-900">{t.footer.security}</a>
              <a href="mailto:hello@drivemytruck.co.uk" className="hover:text-navy-900">hello@drivemytruck.co.uk</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
