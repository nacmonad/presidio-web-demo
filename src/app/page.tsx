import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function Home() {
  return (
    <main className="landing">
      <BrandMark className="landing-mark" size={92} />
      <h1>Presidio Web</h1>
      <p>Presidio, right in your browser.</p>
      <nav aria-label="Primary navigation">
        <Link href="/docs/">Documentation</Link>
        <span aria-hidden="true">·</span>
        <Link href="/demo/">Demo</Link>
        <span aria-hidden="true">·</span>
        <a href="https://github.com/nacmonad/presidio-web" target="_blank" rel="noreferrer">GitHub</a>
        <span aria-hidden="true">·</span>
        <a href="https://www.npmjs.com/package/presidio-web" target="_blank" rel="noreferrer">npm</a>
      </nav>
    </main>
  );
}
