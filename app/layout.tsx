import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vikash AI Job Application Agent",
  description: "A private review console for screened Data Analyst opportunities and tailored application documents.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
