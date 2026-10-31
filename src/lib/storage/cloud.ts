"use client";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import type { Project } from "../types";
import { firestore } from "../firebase/app";
import { normalizeProject } from "./normalize";
import type { DesignPreset, PresetRepository, ProjectRepository } from "./types";

// Proyectos en la nube, uno por documento en cs_accounts/{uid}/projects. Las imágenes
// (data URLs) se guardan aparte en cs_accounts/{uid}/assets, identificadas por su
// contenido, porque cada documento de Firestore admite hasta 1 MB.

const ASSET_PREFIX = "asset:";

async function hashOf(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

export class CloudProjectRepository implements ProjectRepository {
  private savedAssets = new Set<string>();
  private assetCache = new Map<string, string>();

  constructor(private uid: string) {}

  private projects() {
    return collection(firestore(), "cs_accounts", this.uid, "projects");
  }
  private asset(id: string) {
    return doc(firestore(), "cs_accounts", this.uid, "assets", id);
  }

  /** Reemplaza cada imagen por una referencia y la sube si todavía no existe. */
  private async extractImages(p: Project): Promise<Project> {
    const copy: Project = JSON.parse(JSON.stringify(p));
    for (const s of copy.slides) {
      const img = s.visual.image;
      if (!img || !img.startsWith("data:")) continue;
      const id = await hashOf(img);
      if (!this.savedAssets.has(id)) {
        const existing = await getDoc(this.asset(id));
        if (!existing.exists()) await setDoc(this.asset(id), { data: img, createdAt: Date.now() });
        this.savedAssets.add(id);
      }
      this.assetCache.set(id, img);
      s.visual.image = ASSET_PREFIX + id;
    }
    return copy;
  }

  private async inlineImages(p: Project): Promise<Project> {
    await Promise.all(
      p.slides.map(async (s) => {
        const ref = s.visual.image;
        if (!ref?.startsWith(ASSET_PREFIX)) return;
        const id = ref.slice(ASSET_PREFIX.length);
        let data = this.assetCache.get(id);
        if (!data) {
          const snap = await getDoc(this.asset(id));
          data = snap.exists() ? String(snap.data().data ?? "") : "";
          if (data) this.assetCache.set(id, data);
        }
        s.visual.image = data || undefined;
        this.savedAssets.add(id);
      }),
    );
    return p;
  }

  private async fromDoc(raw: unknown): Promise<Project | null> {
    if (raw && typeof raw === "object") {
      // Las referencias asset: no son data URLs: se restauran antes de normalizar.
      const r = raw as { slides?: { visual?: { image?: string } }[] };
      const refs = (r.slides ?? []).map((s) => s.visual?.image);
      const p = normalizeProject(raw);
      if (!p) return null;
      p.slides.forEach((s, i) => {
        if (refs[i]?.startsWith(ASSET_PREFIX)) s.visual.image = refs[i];
      });
      return this.inlineImages(p);
    }
    return null;
  }

  async list(): Promise<Project[]> {
    const snap = await getDocs(this.projects());
    const all = await Promise.all(snap.docs.map((d) => this.fromDoc(d.data())));
    return all.filter((p): p is Project => p !== null).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async get(id: string): Promise<Project | null> {
    const snap = await getDoc(doc(this.projects(), id));
    return snap.exists() ? this.fromDoc(snap.data()) : null;
  }

  async save(project: Project): Promise<void> {
    await setDoc(doc(this.projects(), project.id), await this.extractImages(project));
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.projects(), id));
  }

  private lastKey() {
    return `carrusel-studio:last:${this.uid}`;
  }

  async getLastOpened(): Promise<string | null> {
    try {
      return localStorage.getItem(this.lastKey());
    } catch {
      return null;
    }
  }

  async setLastOpened(id: string): Promise<void> {
    try {
      localStorage.setItem(this.lastKey(), id);
    } catch {
      /* no es grave */
    }
  }
}

export class CloudPresetRepository implements PresetRepository {
  constructor(private uid: string) {}

  private col() {
    return collection(firestore(), "cs_accounts", this.uid, "presets");
  }

  async list(): Promise<DesignPreset[]> {
    const snap = await getDocs(this.col());
    return snap.docs.map((d) => d.data() as DesignPreset).sort((a, b) => b.createdAt - a.createdAt);
  }

  async save(preset: DesignPreset): Promise<void> {
    await setDoc(doc(this.col(), preset.id), JSON.parse(JSON.stringify(preset)));
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.col(), id));
  }
}
