import { LocalPresetRepository, LocalProjectRepository } from "./localStorage";
import type { PresetRepository, ProjectRepository } from "./types";

// Punto único para elegir dónde se guarda. Para usar la nube, reemplazar estas
// instancias por implementaciones remotas de las mismas interfaces.
export const projects: ProjectRepository = new LocalProjectRepository();
export const presets: PresetRepository = new LocalPresetRepository();

export { normalizeProject } from "./normalize";
export { StorageFullError, type DesignPreset } from "./types";
