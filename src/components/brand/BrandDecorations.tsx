export function BrandArcs({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`}>
      <div className="decorative-arc h-32 w-32 -left-4 top-0 opacity-40" />
      <div className="decorative-arc h-24 w-24 left-2 top-4 opacity-25" />
      <div className="decorative-arc h-16 w-16 left-6 top-8 opacity-15" />
    </div>
  );
}

export function BrandBubbles({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute flex gap-1.5 ${className}`}>
      <span className="brand-bubble h-3 w-3 opacity-90" />
      <span className="brand-bubble h-2 w-2 mt-2 opacity-70" />
      <span className="brand-bubble h-4 w-4 -mt-1 opacity-80" />
      <span className="brand-bubble h-2.5 w-2.5 mt-1 opacity-60" />
    </div>
  );
}
