import type { AIProvider } from "../types";

/**
 * ============================================================
 * SRIMATHY — CISCO CIRCUIT AI PROVIDER
 * ============================================================
 *
 * Responsibilities:
 *   1. Obtain / cache Cisco OAuth token
 *   2. Call Cisco CIRCUIT
 *   3. Automatically refresh expired tokens
 *   4. Expose runtime model / latency metrics
 *   5. Conform to the common AIProvider interface
 *
 * IMPORTANT:
 *   CIRCUIT credentials remain server-side.
 *   Never expose them to the browser.
 * ============================================================
 */


/* ============================================================
   CONFIGURATION
   ============================================================ */

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


/* ============================================================
   TOKEN CACHE
   ============================================================ */

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache:
  TokenCache | null = null;


/* ============================================================
   GET CISCO ACCESS TOKEN
   ============================================================ */

async function getCircuitAccessToken(): Promise<string> {

  const now =
    Date.now();


  /*
   * Reuse cached token while it is still safely valid.
   *
   * 60-second safety buffer prevents us from starting
   * a request with a token that is about to expire.
   */

  if (
    tokenCache &&
    now <
      tokenCache.expiresAt - 60_000
  ) {

    return tokenCache.accessToken;

  }


  /*
   * Validate credentials.
   */

  if (
    !CIRCUIT_CLIENT_ID ||
    !CIRCUIT_CLIENT_SECRET
  ) {

    throw new Error(
      "CIRCUIT_CLIENT_ID or CIRCUIT_CLIENT_SECRET is missing."
    );

  }


  console.log(
    "\n======================================"
  );

  console.log(
    "🔐 SRIMATHY CIRCUIT AUTHENTICATION"
  );

  console.log(
    "======================================"
  );

  console.log(
    "Requesting fresh Cisco OAuth access token..."
  );


  const body =
    new URLSearchParams({

      grant_type:
        "client_credentials",

      client_id:
        CIRCUIT_CLIENT_ID,

      client_secret:
        CIRCUIT_CLIENT_SECRET,

    });


  const response =
    await fetch(
      CIRCUIT_TOKEN_URL,
      {
        method: "POST",

        headers: {

          "Content-Type":
            "application/x-www-form-urlencoded",

          "Accept":
            "application/json",

        },

        body:
          body.toString(),

      }
    );


  const raw =
    await response.text();


  let data: any = {};


  try {

    data =
      JSON.parse(raw);

  } catch {

    throw new Error(
      `CIRCUIT token endpoint returned non-JSON response: ${raw.slice(0, 300)}`
    );

  }


  if (
    !response.ok
  ) {

    throw new Error(
      `CIRCUIT token request failed (${response.status}): ${
        data?.error_description ??
        data?.error ??
        raw
      }`
    );

  }


  const accessToken =
    data?.access_token;


  const expiresIn =
    Number(
      data?.expires_in ??
      3600
    );


  if (
    !accessToken
  ) {

    throw new Error(
      "CIRCUIT token response did not contain access_token."
    );

  }


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
    `⏳ Token lifetime: ${expiresIn}s`
  );


  return accessToken;

}


/* ============================================================
   CIRCUIT GENERATION
   ============================================================ */

async function generateWithCircuit(
  system: string,
  prompt: string
): Promise<{
  content: string;
  latencyMs: number;
}> {

  const start =
    performance.now();


  let accessToken =
    await getCircuitAccessToken();


  /*
   * Make the actual CIRCUIT request.
   */

  async function makeRequest(
    token: string
  ): Promise<Response> {

    return fetch(
      CIRCUIT_URL,
      {
        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Accept":
            "application/json",

          /*
           * Cisco CIRCUIT expects the OAuth
           * access token in api-key.
           */

          "api-key":
            token,

        },

        body:
          JSON.stringify({

            messages: [

              {
                role:
                  "system",

                content:
                  system ||
                  "You are an educational assistant. Explain concepts clearly for school students.",

              },

              {
                role:
                  "user",

                content:
                  prompt,

              },

            ],

            /*
             * Cisco CIRCUIT application identity.
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


  /*
   * First attempt.
   */

  let response =
    await makeRequest(
      accessToken
    );


  /*
   * TOKEN AUTO-REFRESH
   *
   * If Cisco rejects the token, invalidate the cache
   * and retry exactly once.
   */

  if (
    response.status === 401 ||
    response.status === 403
  ) {

    console.warn(
      "⚠ CIRCUIT token rejected. Refreshing token..."
    );


    tokenCache =
      null;


    accessToken =
      await getCircuitAccessToken();


    response =
      await makeRequest(
        accessToken
      );

  }


  const raw =
    await response.text();


  /*
   * Handle HTTP failure.
   */

  if (
    !response.ok
  ) {

    throw new Error(
      `CIRCUIT generation failed (${response.status}): ${raw.slice(0, 500)}`
    );

  }


  /*
   * Parse response.
   */

  let data: any = {};


  try {

    data =
      JSON.parse(raw);

  } catch {

    throw new Error(
      `CIRCUIT returned invalid JSON: ${raw.slice(0, 300)}`
    );

  }


  /*
   * OpenAI-compatible response format.
   */

  const content =
    data?.choices?.[0]?.message?.content ??
    "";


  if (
    !content
  ) {

    throw new Error(
      "CIRCUIT returned an empty response."
    );

  }


  const latencyMs =
    Math.round(
      performance.now() -
      start
    );


  console.log(
    "\n======================================"
  );

  console.log(
    "🧠 SRIMATHY CIRCUIT GENERATION"
  );

  console.log(
    "======================================"
  );

  console.log(
    `Model   : ${CIRCUIT_MODEL}`
  );

  console.log(
    `Provider: circuit`
  );

  console.log(
    `Latency : ${latencyMs} ms`
  );

  console.log(
    "======================================"
  );


  return {

    content,

    latencyMs,

  };

}


/* ============================================================
   SRIMATHY CIRCUIT PROVIDER
   ============================================================ */

export const CircuitProvider:
  AIProvider & {
    lastMetrics?: {
      model: string;
      latencyMs?: number;
      fallback?: boolean;
    };
  } = {

    name:
      "circuit",


    lastMetrics:
      undefined,


    /* ========================================================
       HEALTH CHECK
       ======================================================== */

    async health() {

      try {

        await getCircuitAccessToken();

        return true;

      } catch (
        error
      ) {

        console.warn(
          "⚠ CIRCUIT health check failed:",
          error
        );

        return false;

      }

    },


    /* ========================================================
       GENERATE
       ======================================================== */

    async generate(
      system: string,
      prompt: string
    ): Promise<string> {

      const result =
        await generateWithCircuit(
          system,
          prompt
        );


      /*
       * Store metrics separately.
       *
       * This keeps generate() compatible with:
       *
       * AIProvider.generate()
       *
       * which must return Promise<string>.
       */

      this.lastMetrics = {

        model:
          CIRCUIT_MODEL,

        latencyMs:
          result.latencyMs,

        fallback:
          false,

      };


      /*
       * IMPORTANT:
       *
       * Return ONLY the generated text.
       *
       * Do NOT return an object here.
       */

      return result.content;

    },

  };
