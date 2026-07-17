import { AIProvider } from "../types";
import { AI_CONFIG } from "../config";

const DEPLOYMENT = "gemini-3.1-flash-lite";

export const CiscoProvider: AIProvider = {
  name: "Cisco CIRCUIT",

  async health(): Promise<boolean> {
    const token = process.env.CISCO_ACCESS_TOKEN;

    return !!token;
  },

  async generate(
    system: string,
    prompt: string
  ): Promise<string> {
    const token = process.env.CISCO_ACCESS_TOKEN;

    if (!token) {
      throw new Error(
        "Cisco access token not configured."
      );
    }

    const endpoint =
      `${AI_CONFIG.cisco.endpoint.replace("{model}", DEPLOYMENT)}`;

    console.log("🌐 Cisco CIRCUIT");
    console.log("Model:", DEPLOYMENT);

    const response = await fetch(endpoint, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Cisco API Error:");
      console.error(errorText);

      throw new Error(
        `Cisco CIRCUIT Error (${response.status})`
      );
    }

    const json = await response.json();

    if (
      !json.choices ||
      !json.choices[0] ||
      !json.choices[0].message
    ) {
      console.error(json);

      throw new Error(
        "Unexpected Cisco response format."
      );
    }

    return json.choices[0].message.content;
  },
};