import { AI_CONFIG } from "./config";

import {
  OllamaProvider,
} from "./providers/ollama";

import {
  CircuitProvider,
} from "./providers/circuit";

import type {
  AIProvider,
  StructuredOutputFormat,
} from "./types";


export interface AIResponse {

  provider:
    string;

  response:
    string;

  latency:
    number;

  fallback:
    boolean;

}


class AIManager {


  private getProvider(
    name: string
  ): AIProvider {

    switch (
      name.toLowerCase()
    ) {

      case "ollama":
        return OllamaProvider;


      case "circuit":
        return CircuitProvider;


      default:
        throw new Error(
          `Unknown AI provider: ${name}`
        );

    }

  }


  private modelFor(
    provider: AIProvider
  ): string {

    return provider.name === "ollama"

      ? AI_CONFIG.ollama.model

      : AI_CONFIG.circuit.model;

  }


  private runtimeFor(
    provider: AIProvider
  ): string {

    return provider.name === "ollama"

      ? "Local / Offline"

      : "Online / Cisco CIRCUIT";

  }


  private async execute(

    provider:
      AIProvider,

    system:
      string,

    prompt:
      string,

    fallback:
      boolean,

    structuredFormat?:
      StructuredOutputFormat

  ): Promise<AIResponse> {


    const start =
      Date.now();


    const model =
      this.modelFor(
        provider
      );


    console.log(
      "\n======================================"
    );

    console.log(
      "🦙 SRIMATHY AI ENGINE"
    );

    console.log(
      "======================================"
    );

    console.log(
      "🧠 Model   :",
      model
    );

    console.log(
      "🔌 Provider:",
      provider.name
    );

    console.log(
      "📡 Runtime :",
      this.runtimeFor(
        provider
      )
    );

    console.log(
      "🔄 Fallback:",
      fallback
        ? "YES"
        : "NO"
    );

    console.log(
      "📐 Structured:",
      structuredFormat
        ? "YES"
        : "NO"
    );


    try {

      const response =
        await provider.generate(

          system,

          prompt,

          structuredFormat

        );


      const latency =
        Date.now() -
        start;


      /*
       * Providers in the current project return
       * an object containing response.
       *
       * Keep compatibility with older providers
       * that may return a plain string.
       */

      const text =
        typeof response === "string"

          ? response

          : response?.response ??
            response?.text ??
            "";


      if (
        !text
      ) {

        throw new Error(
          `${provider.name} returned an empty response.`
        );

      }


      console.log(
        "✅ Generation Successful"
      );

      console.log(
        "Model      :",
        model
      );

      console.log(
        "Provider   :",
        provider.name
      );

      console.log(
        "Fallback   :",
        fallback
          ? "YES"
          : "NO"
      );

      console.log(
        "Structured :",
        structuredFormat
          ? "YES"
          : "NO"
      );

      console.log(
        "Latency    :",
        `${latency} ms`
      );

      console.log(
        "======================================\n"
      );


      return {

        provider:
          provider.name,

        response:
          text,

        latency,

        fallback,

      };

    } catch (
      error
    ) {

      const message =
        error instanceof Error

          ? error.message

          : String(error);


      console.error(
        `❌ ${provider.name.toUpperCase()} generation failed:`,
        message
      );


      throw error;

    }

  }


  async generate(

    system:
      string,

    prompt:
      string,

    structuredFormat?:
      StructuredOutputFormat

  ): Promise<AIResponse> {


    const primaryName =
      AI_CONFIG.primaryProvider;


    const fallbackName =
      AI_CONFIG.fallbackProvider;


    const primary =
      this.getProvider(
        primaryName
      );


    const fallback =

      fallbackName &&

      fallbackName.toLowerCase() !==
        primaryName.toLowerCase()

        ? this.getProvider(
            fallbackName
          )

        : null;


    console.log(
      "\n======================================"
    );

    console.log(
      "🚀 SRIMATHY PROVIDER ROUTER"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Primary  :",
      primary.name
    );

    console.log(
      "Fallback :",
      fallback?.name ??
      "none"
    );

    console.log(
      "Structured:",
      structuredFormat
        ? "YES"
        : "NO"
    );

    console.log(
      "======================================"
    );


    /*
     * ========================================================
     * PRIMARY
     * ========================================================
     */

    try {

      return await this.execute(

        primary,

        system,

        prompt,

        false,

        structuredFormat

      );

    } catch (
      primaryError
    ) {


      const primaryMessage =
        primaryError instanceof Error

          ? primaryError.message

          : String(primaryError);


      /*
       * ======================================================
       * FALLBACK
       * ======================================================
       */

      if (
        !fallback
      ) {

        throw primaryError;

      }


      console.warn(
        "\n======================================"
      );

      console.warn(
        "🔄 SRIMATHY PROVIDER FAILOVER"
      );

      console.warn(
        "======================================"
      );

      console.warn(
        "Primary Provider :",
        primary.name
      );

      console.warn(
        "Primary Status   : ❌ Failed"
      );

      console.warn(
        "Reason           :",
        primaryMessage
      );

      console.warn(
        "Fallback Provider:",
        fallback.name
      );

      console.warn(
        "======================================"
      );


      try {

        const result =
          await this.execute(

            fallback,

            system,

            prompt,

            true,

            structuredFormat

          );


        console.log(
          "🔄 Failover successful"
        );


        return result;

      } catch (
        fallbackError
      ) {


        const fallbackMessage =
          fallbackError instanceof Error

            ? fallbackError.message

            : String(
                fallbackError
              );


        console.error(
          "\n======================================"
        );

        console.error(
          "❌ ALL AI PROVIDERS FAILED"
        );

        console.error(
          "======================================"
        );

        console.error(
          "Primary :",
          primary.name,
          primaryMessage
        );

        console.error(
          "Fallback:",
          fallback.name,
          fallbackMessage
        );

        console.error(
          "======================================"
        );


        throw new Error(
          `AI generation failed. ` +
          `${primary.name}: ${primaryMessage}. ` +
          `${fallback.name}: ${fallbackMessage}.`
        );

      }

    }

  }

}


export const AI =
  new AIManager();
