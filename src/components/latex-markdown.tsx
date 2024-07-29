"use client";
import { MathpixMarkdown, MathpixLoader } from "mathpix-markdown-it";

export default function LatexMarkdown({ lmd }: { lmd: string }) {
  return (
    <MathpixLoader>
      <MathpixMarkdown text={lmd} />
    </MathpixLoader>
  );
}
