import { cn } from "@/lib/cn";
import { textOnColor } from "@/lib/color";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function BusinessLogo({
  name,
  logoUrl,
  color,
  size = 40,
  className,
}: {
  name: string;
  logoUrl: string | null;
  color: string;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={`Logo de ${name}`} width={size} height={size} className={cn("rounded-xl object-contain bg-white", className)} style={{ width: size, height: size }} />
    );
  }
  return (
    <div
      aria-hidden
      className={cn("flex items-center justify-center rounded-xl font-semibold", className)}
      style={{ width: size, height: size, background: color, color: textOnColor(color), fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}
