import type { Metadata } from "next";

import { OpenHiggsfieldApp } from "@/openhiggsfield/openhiggsfield-app";

/* Inter is self-hosted rather than fetched at build time. `next/font/google`
   reaches Google Fonts during every render (and every build), which fails on a
   machine without outbound access to fonts.googleapis.com — the studio would
   then paint in a fallback face and the build would not come out at all. The
   woff2 files ship in the package, so the font is part of the deploy. */
import "@fontsource-variable/inter/wght.css";

import "@/openhiggsfield/openhiggsfield.css";
import "@/openhiggsfield/motion.css";

/* Title, description and the Open Graph block all come from the root, which
   already describes this surface. Only the canonical link is route-specific. */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function OpenHiggsfieldPage() {
  /* The studio reads its face from `--font-ohf-inter`; this is that variable,
     pointed at the packaged family instead of a Next-managed one. */
  return <OpenHiggsfieldApp fontClassName="ohf-font-inter" />;
}
