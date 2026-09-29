import type { Metadata } from "next";
import { fontVariables } from "@/components/kids/fonts";

export const metadata: Metadata = {
  title: "My Jiu-Jitsu Journey · Flamingo Jiu-Jitsu",
  description: "Kids progress reports from Flamingo Jiu-Jitsu.",
};

export default function KidsReportsLayout({ children }: LayoutProps<"/kids-reports">) {
  return <div className={fontVariables}>{children}</div>;
}
