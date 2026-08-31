"use client";

import Shell from "@/components/Shell";
import { StoreProvider } from "@/lib/store";

export default function Home() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
