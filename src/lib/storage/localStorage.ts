import type { Project } from "../types";
import { normalizeProject } from "./normalize";
import { StorageFullError, type DesignPreset, type PresetRepository, type ProjectRepository } from "./types";

// Persistencia en el navegador. Cada proyecto va en su propia clave para no
// reescribir todo al guardar uno, y un índice lleva el orden.

const NS = "carrusel-studio:v1";
const K = {
  index: `${NS}:projects`,
  project: (id: string) => `${NS}:project:${id}`,
  last: `${NS}:last`,
  presets: `${NS}:presets`,
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22)) throw new StorageFullError();
    throw e;
  }
}

export class LocalProjectRepository implements ProjectRepository {
  private ids(): string[] {
    const ids = read<unknown>(K.index, []);
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
  }

  async list(): Promise<Project[]> {
    return this.ids()
      .map((id) => normalizeProject(read<unknown>(K.project(id), null)))
      .filter((p): p is Project => p !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async get(id: string): Promise<Project | null> {
    return normalizeProject(read<unknown>(K.project(id), null));
  }

  async save(project: Project): Promise<void> {
    write(K.project(project.id), project);
    const ids = this.ids();
    if (!ids.includes(project.id)) write(K.index, [project.id, ...ids]);
  }

  async remove(id: string): Promise<void> {
    try {
      localStorage.removeItem(K.project(id));
    } catch {
      /* ignorar */
    }
    write(
      K.index,
      this.ids().filter((x) => x !== id),
    );
    if (read<string | null>(K.last, null) === id) localStorage.removeItem(K.last);
  }

  async getLastOpened(): Promise<string | null> {
    return read<string | null>(K.last, null);
  }

  async setLastOpened(id: string): Promise<void> {
    try {
      write(K.last, id);
    } catch {
      /* no es grave */
    }
  }
}

export class LocalPresetRepository implements PresetRepository {
  async list(): Promise<DesignPreset[]> {
    const list = read<unknown>(K.presets, []);
    return Array.isArray(list) ? (list as DesignPreset[]).sort((a, b) => b.createdAt - a.createdAt) : [];
  }

  async save(preset: DesignPreset): Promise<void> {
    const list = (await this.list()).filter((p) => p.id !== preset.id);
    write(K.presets, [preset, ...list]);
  }

  async remove(id: string): Promise<void> {
    write(
      K.presets,
      (await this.list()).filter((p) => p.id !== id),
    );
  }
}
