import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <div className="landing-mark" aria-hidden="true">P</div>
      <h1>Presidio Web</h1>
      <p>Private PII detection, entirely in your browser.</p>
      <nav aria-label="Primary navigation">
        <Link href="/docs/">Documentation</Link>
        <span aria-hidden="true">·</span>
        <Link href="/demo/">Demo</Link>
      </nav>
    </main>
  );
}
