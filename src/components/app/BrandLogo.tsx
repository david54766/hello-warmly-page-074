import logoUrl from "@/assets/prima-donna-logo.png";

interface BrandLogoProps {
  className?: string;
}

// Bundled brand mark. Imported through Vite (not the Lovable-hosted /__l5e/
// URL) so it also resolves inside the Capacitor Android bundle, where the
// hosted asset path 404s. object-cover keeps the square logo filling any
// rounded frame the caller sizes it with (e.g. `size-8 rounded-lg`).
export function BrandLogo({ className = "size-8 rounded-lg" }: BrandLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="Prima Donna Social"
      className={`${className} object-cover`}
    />
  );
}
