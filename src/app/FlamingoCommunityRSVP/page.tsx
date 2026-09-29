import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import CommunityRsvp from "./CommunityRsvp";

const fraunces = Fraunces({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const manrope = Manrope({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "RSVP · Flamingo Jiu-Jitsu Community Day",
  description:
    "Sun, Oct 11 @ HSR Layout — free movement & self-defense workshop, kids & adults competitions, meet & greet. RSVP in 30 seconds.",
};

export default function FlamingoCommunityRsvpPage() {
  return (
    <div className={`${fraunces.variable} ${manrope.variable}`}>
      <CommunityRsvp />
    </div>
  );
}
