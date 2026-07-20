export class RuntimeMetrics {

  private static instance: RuntimeMetrics;

  private constructor() {}

  static getInstance() {
    if (!RuntimeMetrics.instance) {
      RuntimeMetrics.instance = new RuntimeMetrics();
    }
    return RuntimeMetrics.instance;
  }

  serverStarted = Date.now();

  promptCount = 0;

  totalResponseTime = 0;

  lastResponseTime = 0;

  lastPrompt = "";

  lastPromptTime = "";

  currentModel = "";

  increment(prompt: string, responseTime: number) {

    this.promptCount++;

    this.lastPrompt = prompt;

    this.lastPromptTime = new Date().toLocaleTimeString();

    this.lastResponseTime = responseTime;

    this.totalResponseTime += responseTime;

  }

  get averageResponseTime() {

    if (this.promptCount === 0) return 0;

    return Math.round(
      this.totalResponseTime / this.promptCount
    );

  }

  get uptimeSeconds() {

    return Math.floor(
      (Date.now() - this.serverStarted) / 1000
    );

  }

}

export const runtimeMetrics =
  RuntimeMetrics.getInstance();