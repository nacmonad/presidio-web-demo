import Image from "next/image";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type BrandMarkProps = {
  className?: string;
  size: number;
};

export function BrandMark({ className, size }: BrandMarkProps) {
  return (
    <Image
      className={className}
      src={`${basePath}/brand/presidio-web-mark.svg`}
      width={size}
      height={size}
      alt=""
      priority
    />
  );
}
