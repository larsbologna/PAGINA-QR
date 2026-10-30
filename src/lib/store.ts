"use client";
import { useCallback, useMemo, useReducer } from "react";
import type { Project } from "./types";
import type { Recipe } from "./projectOps";

// Store del editor con historial. Las ediciones de texto seguidas sobre el mismo campo
// se agrupan (coalesceKey) para que deshacer no vaya letra por letra.

const LIMIT = 100;
const COALESCE_MS = 1200;

interface State {
  past: Project[];
  present: Project;
  future: Project[];
  lastKey: string | null;
  lastAt: number;
}

type Action =
  | { type: "apply"; recipe: Recipe; key?: string; at: number }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "load"; project: Project };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "apply": {
      const next = action.recipe(state.present);
      if (next === state.present) return state;
      const stamped = { ...next, updatedAt: Date.now() };
      const coalesce = action.key != null && action.key === state.lastKey && action.at - state.lastAt < COALESCE_MS;
      return {
        past: coalesce ? state.past : [...state.past, state.present].slice(-LIMIT),
        present: stamped,
        future: [],
        lastKey: action.key ?? null,
        lastAt: action.at,
      };
    }
    case "undo": {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: prev, future: [state.present, ...state.future], lastKey: null, lastAt: 0 };
    }
    case "redo": {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest, lastKey: null, lastAt: 0 };
    }
    case "load":
      return { past: [], present: action.project, future: [], lastKey: null, lastAt: 0 };
  }
}

export function useProjectStore(initial: () => Project) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    past: [],
    present: initial(),
    future: [],
    lastKey: null,
    lastAt: 0,
  }));

  const apply = useCallback((recipe: Recipe, key?: string) => dispatch({ type: "apply", recipe, key, at: Date.now() }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const load = useCallback((project: Project) => dispatch({ type: "load", project }), []);

  return useMemo(
    () => ({
      project: state.present,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      apply,
      undo,
      redo,
      load,
    }),
    [state, apply, undo, redo, load],
  );
}

export type ProjectStore = ReturnType<typeof useProjectStore>;

/** El reducer, exportado para las pruebas. */
export const __reducer = reducer;
