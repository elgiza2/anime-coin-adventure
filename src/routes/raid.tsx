import { createFileRoute } from "@tanstack/react-router";
import { RaidPage } from "@/components/raid/RaidPage";

export const Route = createFileRoute("/raid")({
  head: () => ({
    meta: [
      { title: "غارات الأسوار — منجم الأسوار" },
      { name: "description", content: "لف العجلة، اهجم على أسوار اللاعيبة، انتقم، وافتح الخزينة الكبرى." },
      { property: "og:title", content: "غارات الأسوار — منجم الأسوار" },
      { property: "og:description", content: "غارات وانتقام وخزينة بتكبر مع كل لفة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RaidPage,
});
