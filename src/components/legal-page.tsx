import Link from "next/link";
import { config } from "@/server/config";

export function LegalPage({ title, sections }: { title: string; sections: { title: string; body: string }[] }) {
  const fill = (s: string) =>
    s
      .replaceAll("{producto}", config.productName)
      .replaceAll("{proveedor}", config.providerName)
      .replaceAll("{email}", config.providerEmail || "el contacto del proveedor del servicio");
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm text-brand-700 hover:underline">
        ← {config.productName}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <div className="mt-8 space-y-6">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold">{s.title}</h2>
            <p className="mt-1 leading-relaxed text-slate-700">{fill(s.body)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
