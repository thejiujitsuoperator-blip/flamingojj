"use client";

import { useStore } from "@/lib/store";
import { IconCheck } from "./icons";

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="toast">
      <IconCheck size={13} />
      <span>{toast}</span>
    </div>
  );
}
