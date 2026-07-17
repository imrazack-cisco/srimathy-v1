// ai/types.ts

/**
 * Common interface that every AI provider must implement.
 * This allows us to plug in different providers later
 * (Ollama, LM Studio, vLLM, etc.) without changing the agents.
 */
export interface AIProvider {
  /** Provider name */
  name: string;

  /** Check whether the provider is available */
  health(): Promise<boolean>;

  /**
   * Generate a response from the model.
   *
   * @param system System prompt
   * @param prompt User prompt
   * @returns Generated text
   */
  generate(
    system: string,
    prompt: string
  ): Promise<string>;
}