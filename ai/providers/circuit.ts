import { AIProvider } from "../types";

const CIRCUIT_URL =
  process.env.CIRCUIT_URL || "";

const CIRCUIT_MODEL =
  process.env.CIRCUIT_MODEL ||
  "gemini-3.1-flash-lite";

const CIRCUIT_APP_KEY =
  process.env.CIRCUIT_APP_KEY || "";

const CIRCUIT_CLIENT_ID =
  process.env.CIRCUIT_CLIENT_ID || "";

const CIRCUIT_CLIENT_SECRET =
  process.env.CIRCUIT_CLIENT_SECRET || "";

const CIRCUIT_TOKEN_URL =
  process.env.CIRCUIT_TOKEN_URL ||
  "https://id.cisco.com/oauth2/default/v1/token";


export interface CircuitMetrics {

  model: string;

  latencyMs?: number;

  fallback?: boolean;

}


/**
 * Cached OAuth access token.
 *
 * We deliberately keep this in memory rather than
 * writing the token to disk.
 */
let tokenCache: {
  accessToken: string;
  expiresAt: number;
} | null = null;


/**
 * Get a valid Cisco OAuth access token.
 *
 * The token is cached in memory and automatically
 * refreshed shortly before expiry.
 */
async function getCircuitAccessToken(): Promise<string> {

  const now =
    Date.now();


  /*
   * Reuse cached token while it is still safely valid.
   *
   * 60-second buffer prevents us from starting a
   * request with a token that is about to expire.
   */
  if (
    tokenCache &&
    now <
      tokenCache.expiresAt - 60_000
  ) {

    return tokenCache.accessToken;

  }


  if (
    !CIRCUIT_CLIENT_ID ||
    !CIRCUIT_CLIENT_SECRET
  ) {

    throw new Error(
      "CIRCUIT_CLIENT_ID or CIRCUIT_CLIENT_SECRET is missing."
    );

  }


  console.log(
    "🔐 Requesting fresh Cisco CIRCUIT access token..."
  );


  const form =
    new URLSearchParams();


  form.set(
    "grant_type",
    "client_credentials"
  );

  form.set(
    "client_id",
    CIRCUIT_CLIENT_ID
  );

  form.set(
    "client_secret",
    CIRCUIT_CLIENT_SECRET
  );


  const response =
    await fetch(
      CIRCUIT_TOKEN_URL,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/x-www-form-urlencoded",

          "Accept":
            "application/json",

        },

        body:
          form.toString(),

      }
    );


  const raw =
    await response.text();


  let data: any;


  try {

    data =
      JSON.parse(raw);

  } catch {

    throw new Error(
      `CIRCUIT token endpoint returned invalid JSON: ${raw.slice(0, 300)}`
    );

  }


  if (
    !response.ok
  ) {

    throw new Error(
      `CIRCUIT token request failed: HTTP ${response.status} - ${
        data?.error_description ??
        data?.error ??
        raw.slice(0, 300)
      }`
    );

  }


  const accessToken =
    data?.access_token;


  if (
    typeof accessToken !==
    "string" ||
    !accessToken
  ) {

    throw new Error(
      "CIRCUIT token response did not contain access_token."
    );

  }


  const expiresIn =
    Number(
      data?.expires_in ??
      3600
    );


  /*
   * Store token only in memory.
   */
  tokenCache = {

    accessToken,

    expiresAt:
      Date.now() +
      expiresIn * 1000,

  };


  console.log(
    "✅ Cisco CIRCUIT access token acquired."
  );

  console.log(
    `⏳ CIRCUIT token lifetime: ${expiresIn}s`
  );


  return accessToken;

}


/**
 * Clear cached token.
 *
 * Used when CIRCUIT returns 401/403.
 */
function clearCircuitToken(): void {

  tokenCache =
    null;

}


/**
 * Perform one CIRCUIT request.
 */
async function callCircuit(
  system: string,
  prompt: string,
  accessToken: string
): Promise<Response> {

  return fetch(
    CIRCUIT_URL,
    {

      method:
        "POST",

      headers: {

        "Content-Type":
          "application/json",

        "Accept":
          "application/json",

        /*
         * IMPORTANT:
         *
         * Cisco CIRCUIT expects the OAuth
         * access token in api-key.
         */
        "api-key":
          accessToken,

      },

      body:
        JSON.stringify({

          messages: [

            {
              role:
                "system",

              content:
                system,
            },

            {
              role:
                "user",

              content:
                prompt,
            },

          ],

          /*
           * Cisco CIRCUIT expects the AppKey
           * inside the user JSON field.
           */
          user:
            JSON.stringify({

              appkey:
                CIRCUIT_APP_KEY,

            }),

          stop: [
            "<|im_end|>",
          ],

          temperature:
            0.2,

        }),

    }
  );

}


/**
 * Parse CIRCUIT response.
 */
async function parseCircuitResponse(
  response: Response
): Promise<string> {

  const raw =
    await response.text();


  let data: any;


  try {

    data =
      JSON.parse(raw);

  } catch {

    throw new Error(
      `CIRCUIT returned invalid JSON: ${raw.slice(0, 500)}`
    );

  }


  if (
    !response.ok
  ) {

    throw new Error(
      `CIRCUIT request failed: HTTP ${response.status} - ${
        data?.error?.message ??
        data?.message ??
        data?.error ??
        raw.slice(0, 500)
      }`
    );

  }


  const content =
    data?.choices?.[0]?.message?.content;


  if (
    typeof content !==
    "string" ||
    !content.trim()
  ) {

    throw new Error(
      "CIRCUIT returned no message content."
    );

  }


  return content;

}


/**
 * SRIMATHY Cisco CIRCUIT Provider.
 */
export const CircuitProvider:
  AIProvider & {
    lastMetrics?: CircuitMetrics;
  } = {

    name:
      "circuit",


    lastMetrics:
      undefined,


    async health(): Promise<boolean> {

      try {

        /*
         * Health verifies that we can obtain
         * a valid OAuth token.
         */
        await getCircuitAccessToken();

        return true;

      } catch (error) {

        console.warn(
          "⚠ CIRCUIT health check failed:",
          error instanceof Error
            ? error.message
            : String(error)
        );

        return false;

      }

    },


    async generate(
      system: string,
      prompt: string
    ): Promise<string> {

      if (
        !CIRCUIT_URL
      ) {

        throw new Error(
          "CIRCUIT_URL is not configured."
        );

      }


      const start =
        performance.now();


      let accessToken =
        await getCircuitAccessToken();


      /*
       * First request.
       */
      let response =
        await callCircuit(
          system,
          prompt,
          accessToken
        );


      /*
       * If the token was rejected despite
       * our expiry protection, obtain a fresh
       * token and retry exactly once.
       */
      if (
        response.status === 401 ||
        response.status === 403
      ) {

        console.warn(
          "⚠ CIRCUIT access token rejected."
        );

        console.warn(
          "🔄 Refreshing Cisco OAuth token..."
        );


        clearCircuitToken();


        accessToken =
          await getCircuitAccessToken();


        response =
          await callCircuit(
            system,
            prompt,
            accessToken
          );

      }


      const content =
        await parseCircuitResponse(
          response
        );


      const latencyMs =
        Math.round(
          performance.now() -
          start
        );


      this.lastMetrics = {

        model:
          CIRCUIT_MODEL,

        latencyMs,

      };


      console.log(
        "\n======================================"
      );

      console.log(
        "☁️ SRIMATHY CIRCUIT"
      );

      console.log(
        "======================================"
      );

      console.log(
        "Model   :",
        CIRCUIT_MODEL
      );

      console.log(
        "Provider: Cisco CIRCUIT"
      );

      console.log(
        "Latency :",
        `${latencyMs} ms`
      );

      console.log(
        "======================================"
      );


      return content;

    },

  };
