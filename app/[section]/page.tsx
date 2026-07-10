import { notFound } from "next/navigation";
import SectionPage from "../components/SectionPage";

const sections = ["tasks", "calendar", "categories", "habits", "focus", "stats", "settings"];

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  return <SectionPage section={section} />;
}
