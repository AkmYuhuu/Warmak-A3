import { headers, cookies } from "next/headers";
import HomeMobile from "./HomeMobile";
import HomeDesktop from "./HomeDesktop";

export default async function Page() {
  const h = await headers();
  const c = await cookies();
  const override = c.get("view")?.value;
  const device = override === "mobile" || override === "desktop" ? override : h.get("x-device") === "mobile" ? "mobile" : "desktop";
  return device === "mobile" ? <HomeMobile /> : <HomeDesktop />;
}
