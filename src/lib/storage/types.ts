import type { DesignConfig, Project } from "../types";

// Contratos de persistencia. Hoy hay una implementación con localStorage; para
// pasar a la nube alcanza con implementar estas interfaces (por ejemplo contra una
// API propia) y cambiar la instancia que exporta storage/index.ts.

export interface ProjectRepository {
  /** Proyectos guardados, del más reciente al más viejo. */
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  remove(id: string): Promise<void>;
  /** Último proyecto abierto, para retomarlo al volver. */
  getLastOpened(): Promise<string | null>;
  setLastOpened(id: string): Promise<void>;
}

export interface DesignPreset {
  id: string;
  name: string;
  design: DesignConfig;
  createdAt: number;
}

export interface PresetRepository {
  list(): Promise<DesignPreset[]>;
  save(preset: DesignPreset): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Error al guardar porque el navegador se quedó sin espacio (suele pasar con muchas fotos). */
export class StorageFullError extends Error {
  constructor() {
    super("El navegador no tiene más espacio para guardar. Probá quitar imágenes grandes o eliminar proyectos viejos.");
    this.name = "StorageFullError";
  }
}
