"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap-register";

type TiltImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
};

export default function TiltImage({
  src,
  alt,
  className = "",
  fill,
  width,
  height,
  sizes,
}: TiltImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  const resetTilt = () => {
    registerGsap();
    if (!frameRef.current) return;
    gsap.to(frameRef.current, {
      duration: 0.3,
      rotateX: 0,
      rotateY: 0,
      ease: "power1.inOut",
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    registerGsap();
    const element = frameRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    gsap.to(element, {
      duration: 0.3,
      rotateX,
      rotateY,
      transformPerspective: 500,
      ease: "power1.inOut",
    });
  };

  return (
    <div
      ref={frameRef}
      className={`tilt-image-wrap relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
    >
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        className={fill ? "object-cover" : "h-full w-full object-cover"}
        draggable={false}
      />
    </div>
  );
}
