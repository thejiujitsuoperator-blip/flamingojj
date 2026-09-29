import type { Metadata } from "next";
import ParentView from "./ParentView";

export const metadata: Metadata = {
  title: "My Jiu-Jitsu Journey · Flamingo Jiu-Jitsu",
};

export default function ViewPage() {
  return <ParentView />;
}
