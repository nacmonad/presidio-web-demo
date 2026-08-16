import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const serverHeaders: Pick<NextConfig, "headers"> = isStaticExport ? {} : {
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      ],
    }];
  },
};

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const } : {}),
  ...serverHeaders,
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: isStaticExport,
  images: { unoptimized: true },
};

export default nextConfig;
