export interface PromptDefinition {
  system: string;
  user?: string;
}

export type PromptMap =
  Record<string, PromptDefinition>;