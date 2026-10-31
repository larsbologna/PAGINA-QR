"use client";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod/v4";
import { loadAiSettings } from "./settings";

// Llamadas a Claude desde el navegador con la clave del usuario (sitio estático, sin
// servidor propio). dangerouslyAllowBrowser es correcto acá: la clave pertenece a quien
// usa la página y no se comparte con nadie más.

export class AiError extends Error {}

function client(): { client: Anthropic; model: string } {
  const { apiKey, model } = loadAiSettings();
  if (!apiKey.trim()) throw new AiError("Configurá tu clave de IA (botón «IA» arriba) para usar esta función.");
  return { client: new Anthropic({ apiKey: apiKey.trim(), dangerouslyAllowBrowser: true }), model };
}

/**
 * Pide una respuesta JSON validada con el esquema dado. Usa streaming (respuestas
 * largas sin cortes) y, en los modelos que lo admiten, el respaldo automático del
 * servidor si la solicitud es rechazada.
 */
export async function askJson<T extends z.ZodType>(opts: { system: string; prompt: string; schema: T; maxTokens?: number }): Promise<z.infer<T>> {
  const { client: c, model } = client();
  const withFallback = model !== "claude-haiku-5-5";
  try {
    const stream = c.beta.messages.stream({
      model,
      max_tokens: opts.maxTokens ?? 32000,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
      output_config: { format: betaZodOutputFormat(opts.schema) },
      ...(withFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") throw new AiError("La IA no pudo completar este pedido. Probá reformularlo.");
    if (message.stop_reason === "max_tokens") throw new AiError("La respuesta quedó incompleta. Probá con un pedido más simple.");
    if (!message.parsed_output) throw new AiError("La IA devolvió una respuesta que no se pudo leer. Probá de nuevo.");
    return message.parsed_output as z.infer<T>;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("La clave de IA no es válida. Revisala en la configuración de IA.");
    if (e instanceof Anthropic.PermissionDeniedError) throw new AiError("Tu clave no tiene permiso para usar este modelo.");
    if (e instanceof Anthropic.RateLimitError) throw new AiError("Llegaste al límite de uso de tu cuenta de IA. Esperá un momento y probá de nuevo.");
    if (e instanceof Anthropic.BadRequestError) throw new AiError(`La IA rechazó el pedido: ${e.message}`);
    if (e instanceof Anthropic.APIConnectionError) throw new AiError("No se pudo conectar con la IA. Revisá tu conexión.");
    if (e instanceof Anthropic.APIError) throw new AiError(`Error de la IA (${e.status ?? "sin código"}). Probá de nuevo en un rato.`);
    throw e;
  }
}

/** Prueba rápida de la clave: pide una respuesta mínima. */
export async function testAiKey(): Promise<void> {
  const { client: c, model } = client();
  try {
    await c.messages.create({ model, max_tokens: 64, messages: [{ role: "user", content: "Respondé solo: OK" }] });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("La clave no es válida.");
    if (e instanceof Anthropic.APIError) throw new AiError(`No se pudo verificar (${e.status ?? "error"}): ${e.message}`);
    if (e instanceof Anthropic.APIConnectionError) throw new AiError("No se pudo conectar con la IA.");
    throw e;
  }
}
