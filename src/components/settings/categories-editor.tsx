"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Archive, ArchiveRestore, Pencil } from "lucide-react";
import { createCategoryAction, moveCategoryAction, renameCategoryAction, setCategoryStatusAction } from "@/app/panel/[slug]/actions";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_NAME_MAX, MAX_CATEGORIES_PER_BUSINESS } from "@/lib/validation";

interface Cat {
  id: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  uses: number;
}

function RenameRow({ slug, cat, onDone }: { slug: string; cat: Cat; onDone: () => void }) {
  const [state, action] = useActionState(renameCategoryAction.bind(null, slug, cat.id), null);
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="flex flex-1 flex-wrap items-center gap-2">
      <label htmlFor={`rename-${cat.id}`} className="sr-only">Nuevo nombre</label>
      <Input id={`rename-${cat.id}`} name="name" defaultValue={cat.name} maxLength={CATEGORY_NAME_MAX} className="h-8 max-w-56" autoFocus required />
      <SubmitButton size="sm" pendingText="…">Guardar</SubmitButton>
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
      {state?.error && <p className="w-full text-xs text-red-700">{state.error}</p>}
    </form>
  );
}

export function CategoriesEditor({ slug, categories }: { slug: string; categories: Cat[] }) {
  const [createState, createAction] = useActionState(createCategoryAction.bind(null, slug), null);
  const [editing, setEditing] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (createState?.ok) formRef.current?.reset();
  }, [createState]);

  const active = categories.filter((c) => c.status === "ACTIVE");
  const archived = categories.filter((c) => c.status === "ARCHIVED");

  async function toggle(c: Cat) {
    setRowError(null);
    const r = await setCategoryStatusAction(slug, c.id, c.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE");
    if (r?.error) setRowError(r.error);
  }

  const row = (c: Cat, i: number, list: Cat[]) => (
    <li key={c.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
      {editing === c.id ? (
        <RenameRow slug={slug} cat={c} onDone={() => setEditing(null)} />
      ) : (
        <>
          <span className={`flex-1 text-sm ${c.status === "ARCHIVED" ? "text-muted line-through" : ""}`}>{c.name}</span>
          <span className="text-xs text-muted">{c.uses} {c.uses === 1 ? "uso" : "usos"}</span>
          {c.status === "ACTIVE" && (
            <>
              <form action={moveCategoryAction.bind(null, slug, c.id, "up")}>
                <Button type="submit" variant="ghost" size="sm" disabled={i === 0} aria-label={`Subir ${c.name}`}><ArrowUp className="size-4" aria-hidden /></Button>
              </form>
              <form action={moveCategoryAction.bind(null, slug, c.id, "down")}>
                <Button type="submit" variant="ghost" size="sm" disabled={i === list.length - 1} aria-label={`Bajar ${c.name}`}><ArrowDown className="size-4" aria-hidden /></Button>
              </form>
            </>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(c.id)} aria-label={`Renombrar ${c.name}`}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => toggle(c)}>
            {c.status === "ACTIVE" ? <Archive className="size-4" aria-hidden /> : <ArchiveRestore className="size-4" aria-hidden />}
            {c.status === "ACTIVE" ? "Archivar" : "Reactivar"}
          </Button>
        </>
      )}
    </li>
  );

  return (
    <div className="space-y-4">
      {rowError && <Alert tone="error">{rowError}</Alert>}
      <ul className="divide-y divide-line rounded-lg border border-line">
        {active.length ? active.map((c, i) => row(c, i, active)) : <li className="px-4 py-6 text-center text-sm text-muted">No hay categorías activas.</li>}
      </ul>
      <form ref={formRef} action={createAction} className="flex flex-wrap items-start gap-2">
        <label htmlFor="new-category" className="sr-only">Nueva categoría</label>
        <Input id="new-category" name="name" placeholder="Nueva categoría, ej.: Estacionamiento" maxLength={CATEGORY_NAME_MAX} className="max-w-xs" required />
        <SubmitButton variant="secondary" pendingText="Agregando…" disabled={active.length >= MAX_CATEGORIES_PER_BUSINESS}>Agregar</SubmitButton>
        {createState?.error && <p className="w-full text-sm text-red-700">{createState.error}</p>}
      </form>
      <p className="text-xs text-muted">
        Hasta {MAX_CATEGORIES_PER_BUSINESS} activas. Archivar oculta la categoría del formulario pero conserva el historial de opiniones que la usaron.
      </p>
      {archived.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Archivadas <Badge>{archived.length}</Badge>
          </summary>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">{archived.map((c, i) => row(c, i, archived))}</ul>
        </details>
      )}
    </div>
  );
}
