"use client";

import { useRouter } from "next/navigation";

export function BusinessSwitcher({ current, options }: { current: string; options: { slug: string; name: string }[] }) {
  const router = useRouter();
  return (
    <>
      <label htmlFor="business-switcher" className="sr-only">
        Cambiar de negocio
      </label>
      <select
        id="business-switcher"
        value={current}
        onChange={(e) => router.push(`/panel/${e.target.value}`)}
        className="h-9 w-full rounded-lg border border-line bg-white px-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.name}
          </option>
        ))}
      </select>
    </>
  );
}
