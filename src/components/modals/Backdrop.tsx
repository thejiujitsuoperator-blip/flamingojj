"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { useStore } from "@/lib/store";

export default function Backdrop({
  children,
  dialogStyle,
}: {
  children: ReactNode;
  dialogStyle?: CSSProperties;
}) {
  const { closeModal } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="dialog" style={dialogStyle}>
        {children}
      </div>
    </div>
  );
}
