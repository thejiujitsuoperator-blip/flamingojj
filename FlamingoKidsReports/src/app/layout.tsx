import type { Metadata } from "next";
import { fontVariables } from "@/components/kids/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flamingo Kids Reports",
  description: "My Jiu-Jitsu Journey — kids progress reports from Flamingo Jiu-Jitsu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
