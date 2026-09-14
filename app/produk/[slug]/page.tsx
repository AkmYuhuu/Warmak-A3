import { headers, cookies } from "next/headers";
import DetailMobile from "./DetailMobile";
import DetailDesktop from "./DetailDesktop";
import { notFound } from "next/navigation";

export default async function DetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) notFound();
  const h = await headers();
  const c = await cookies();
  const override = c.get("view")?.value;
  const device = override === "mobile" || override === "desktop" ? override : h.get("x-device") === "mobile" ? "mobile" : "desktop";
  return device === "mobile" ? <DetailMobile slug={slug} /> : <DetailDesktop slug={slug} />;
}
