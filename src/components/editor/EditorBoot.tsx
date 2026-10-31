"use client";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { projects } from "@/lib/storage";
import { createGoogleMapsProject } from "@/data/templates/googleMaps";
import { Editor } from "./Editor";
import type { Session } from "@/lib/firebase/accounts";

/** Retoma el último proyecto abierto; la primera vez deja precargada la plantilla de ejemplo. */
async function initialProject(): Promise<Project> {
  try {
    const lastId = await projects.getLastOpened();
    const last = lastId ? await projects.get(lastId) : null;
    if (last) return last;
    const [recent] = await projects.list();
    if (recent) return recent;
  } catch {
    /* sin almacenamiento: se sigue con la plantilla */
  }
  const sample = createGoogleMapsProject();
  await projects.save(sample).catch(() => undefined);
  return sample;
}

export function EditorBoot({ session }: { session?: Session }) {
  const [project, setProject] = useState<Project | null>(null);
  useEffect(() => {
    initialProject().then(setProject);
  }, []);
  if (!project) return <div className="grid h-dvh place-items-center bg-bg text-sm text-muted">Abriendo tus proyectos…</div>;
  return <Editor initial={project} session={session} />;
}
