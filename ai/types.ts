export interface AIProvider {
  name: string;

  generate(
    system: string,
    prompt: string
  ): Promise<string>;

  health(): Promise<boolean>;
}