import Image from "next/image";

function isAbsoluteHttpUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

type Props = {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  /** Fixed box (e.g. thumbnail); omit when using fill in a sized parent */
  width?: number;
  height?: number;
  fill?: boolean;
};

/**
 * Marketplace / profile preview images: same-origin `/api/files/…` or external https.
 * External URLs use `unoptimized` so arbitrary hosts do not require `remotePatterns`.
 */
export function MarketplacePreviewImage({
  src,
  alt = "",
  className,
  sizes = "(max-width: 640px) 100vw, 33vw",
  width,
  height,
  fill,
}: Props) {
  const unopt = isAbsoluteHttpUrl(src);
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        unoptimized={unopt}
      />
    );
  }
  const w = width ?? 96;
  const h = height ?? 56;
  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={className}
      unoptimized={unopt}
    />
  );
}
