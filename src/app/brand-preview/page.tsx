import type { Metadata } from "next";
import Image from "next/image";

import conceptSheet from "../../../public/brand/icon-concepts-generated-v1.png";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Brand concepts — Presidio Web",
  robots: { index: false, follow: false },
};

const concepts = [
  { id: "A", name: "Integrated frame", note: "The browser chrome and P share one strong, compact silhouette.", position: "top-left" },
  { id: "B", name: "Open frame", note: "A softer, more approachable mark with a continuous teal gesture.", position: "top-right" },
  { id: "C", name: "Workflow", note: "Adds document or processing lines to emphasize the tool in use.", position: "bottom-left" },
  { id: "D", name: "Local baseline", note: "A restrained browser frame with a teal local-processing signal.", position: "bottom-right" },
];

export default function BrandPreview() {
  return (
    <main className="brand-preview">
      <header className="brand-preview-header">
        <span className="eyebrow">Private working page · not linked</span>
        <h1>Presidio Web icon concepts</h1>
        <p>A browser frame and a capital P communicate the core idea: Presidio, made approachable directly in the browser.</p>
      </header>

      <section className="concept-grid" aria-label="Icon concept options">
        {concepts.map((concept) => (
          <article className="concept-card" key={concept.id}>
            <div className={`concept-crop ${concept.position}`}>
              <Image src={conceptSheet} alt={`${concept.name} Presidio Web icon concept`} priority />
            </div>
            <div className="concept-copy">
              <span>{concept.id}</span>
              <div><h2>{concept.name}</h2><p>{concept.note}</p></div>
            </div>
          </article>
        ))}
      </section>

      <section className="brand-preview-guidance">
        <div className="refined-mark">
          <Image src={`${basePath}/brand/presidio-web-mark-c4.svg`} width={512} height={512} alt="Refined concept C with a P and separated processing bars forming a W in the open baseline of a browser frame" />
        </div>
        <div>
          <span className="eyebrow">Selected direction · SVG draft</span>
          <h2>Concept C4 · Presidio Web</h2>
          <p>The browser border now opens along the baseline. Five separate processing bars sit lower in that whitespace, forming a compact W without colliding with the right edge.</p>
        </div>
      </section>
    </main>
  );
}
