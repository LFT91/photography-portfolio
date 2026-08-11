import { redirect } from "next/navigation";
import { isAyoubSite } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Fatni After Dark collection retired — Ayoub keeps the project at /projects/after-dark. */
export default function AfterDarkPage() {
  if (isAyoubSite()) {
    redirect("/projects/after-dark");
  }
  redirect("/work");
}
