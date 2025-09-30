"use client";

import Image from "next/image";
import { useState } from "react";

type AvatarProps = {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
};

export default function Avatar({ src, alt = "avatar", width = 40, height = 40, className = "" }: AvatarProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || "/noAvatar.png");

  // If the source is an external URL (http/https), render a plain <img>
  // so we avoid Next.js remote image domain configuration issues in production
  // and can rely on the browser's onError fallback behavior.
  const isExternal = /^https?:\/\//i.test(currentSrc);

  if (isExternal) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          if (target.src && !target.src.endsWith("/noAvatar.png")) {
            target.src = "/noAvatar.png";
          }
        }}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (currentSrc !== "/noAvatar.png") setCurrentSrc("/noAvatar.png");
      }}
    />
  );
}
