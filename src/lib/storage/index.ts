import { LocalPresetRepository, LocalProjectRepository } from "./localStorage";
import type { PresetRepository, ProjectRepository } from "./types";

// Punto único de guardado. Sin cuentas se usa el navegador; al ingresar con una cuenta,
// setStorageBackend() pasa a la nube y todo el editor sigue usando `projects` y `presets`.

const local = { projects: new LocalProjectRepository(), presets: new LocalPresetRepository() };
let current: { projects: ProjectRepository; presets: PresetRepository } = local;

export function setStorageBackend(next: { projects: ProjectRepository; presets: PresetRepository } | null): void {
  current = next ?? local;
}

/** Proyectos guardados solo en este navegador (para traerlos a una cuenta). */
export const localProjects: ProjectRepository = local.projects;

export const projects: ProjectRepository = {
  list: () => current.projects.list(),
  get: (id) => current.projects.get(id),
  save: (p) => current.projects.save(p),
  remove: (id) => current.projects.remove(id),
  getLastOpened: () => current.projects.getLastOpened(),
  setLastOpened: (id) => current.projects.setLastOpened(id),
};

export const presets: PresetRepository = {
  list: () => current.presets.list(),
  save: (p) => current.presets.save(p),
  remove: (id) => current.presets.remove(id),
};

export function usingCloud(): boolean {
  return current !== local;
}

export { normalizeProject } from "./normalize";
export { StorageFullError, type DesignPreset } from "./types";
