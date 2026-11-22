import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "md" | "lg" }) {
  const icon = size === "lg" ? 52 : 38;
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="Drive My Truck home">
      <Image src="/logo-icon.png" alt="" width={icon} height={Math.round(icon * 0.91)} priority />
      <span className={`leading-[0.9] font-extrabold tracking-tight ${size === "lg" ? "text-2xl" : "text-lg"}`}>
        <span className="block text-navy-900">Drive My</span>
        <span className="block text-brand-500">Truck</span>
      </span>
    </Link>
  );
}
