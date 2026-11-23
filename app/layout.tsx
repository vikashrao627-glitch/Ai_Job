import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vikash AI Job Agent",
  description: "A human-approved workspace for finding and preparing relevant data analyst applications.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}