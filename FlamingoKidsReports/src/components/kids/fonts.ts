import { Fredoka, Luckiest_Guy, Noto_Color_Emoji, Permanent_Marker, Quicksand } from "next/font/google";

// Report-card typefaces, exposed as CSS variables used by report.module.css.
export const brush = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "block", variable: "--kr-brush" });
export const display = Luckiest_Guy({ weight: "400", subsets: ["latin"], display: "block", variable: "--kr-display" });
export const round = Fredoka({ weight: ["500", "600"], subsets: ["latin"], display: "block", variable: "--kr-round" });
export const body = Quicksand({ weight: ["400", "500", "700"], subsets: ["latin"], display: "block", variable: "--kr-body" });
export const emoji = Noto_Color_Emoji({ weight: "400", subsets: ["emoji"], display: "block", variable: "--kr-emoji" });

export const fontVariables = [brush, display, round, body, emoji].map((f) => f.variable).join(" ");
