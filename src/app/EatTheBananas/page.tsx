import type { Metadata } from "next";
import BananaGame from "./BananaGame";

export const metadata: Metadata = {
  title: "Eat the Bananas",
  description: "A calm little game for toddlers: press any key or tap to feed the monkey.",
};

export default function EatTheBananasPage() {
  return <BananaGame />;
}
