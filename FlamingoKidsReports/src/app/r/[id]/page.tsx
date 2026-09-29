import type { Metadata } from "next";
import ParentView from "@/app/view/ParentView";
import { firstName } from "@/lib/kidsReport";
import { loadReport } from "@/lib/shareStore";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/r/[id]">): Promise<Metadata> {
  const report = await loadReport((await params).id);
  const title = report
    ? `${firstName(report.name)}'s Jiu-Jitsu Journey · Flamingo Jiu-Jitsu`
    : "My Jiu-Jitsu Journey · Flamingo Jiu-Jitsu";
  return { title, robots: { index: false } };
}

export default async function SharedReportPage({ params }: PageProps<"/r/[id]">) {
  const report = await loadReport((await params).id);
  return <ParentView initial={report} />;
}
