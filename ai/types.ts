/**
 * ai/types.ts
 *
 * Common AI provider interface.
 *
 * Providers may optionally receive a JSON Schema.
 * Ollama uses this natively for deterministic structured
 * generation. Providers that do not support structured
 * decoding may safely ignore it.
 */

export type StructuredOutputFormat =
  | "json"
  | Record<string, unknown>;


export interface AIProvider {

  /** Provider name */
  name: string;


  /** Check whether provider is available */
  health(): Promise<boolean>;


  /**
   * Generate a response.
   *
   * structuredFormat:
   * Optional JSON / JSON-Schema constraint.
   */
  generate(
    system: string,
    prompt: string,
    structuredFormat?: StructuredOutputFormat
  ): Promise<any>;

}
