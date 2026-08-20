/**
 * Extract a JSON object from an SLM response.
 *
 * This function does NOT validate the structure.
 * Structural validation is performed separately by Zod.
 */

export function extractJson(
  raw: string
): unknown {

  if (
    typeof raw !== "string" ||
    !raw.trim()
  ) {

    throw new Error(
      "Model returned an empty response."
    );

  }

  let text =
    raw.trim();


  /*
   * Remove common Markdown fences.
   */

  text =
    text
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      )
      .trim();


  /*
   * Fast path:
   * response is already valid JSON.
   */

  try {

    return JSON.parse(
      text
    );

  } catch {
    // Continue.
  }


  /*
   * Robust object extraction.
   *
   * We scan braces rather than simply using
   * first "{" + last "}" so nested JSON remains safe.
   */

  const start =
    text.indexOf("{");

  if (
    start === -1
  ) {

    throw new Error(
      "No JSON object found in model response."
    );

  }


  let depth =
    0;

  let inString =
    false;

  let escaped =
    false;

  for (
    let i = start;
    i < text.length;
    i++
  ) {

    const char =
      text[i];


    if (
      escaped
    ) {

      escaped =
        false;

      continue;

    }


    if (
      char === "\\"
      &&
      inString
    ) {

      escaped =
        true;

      continue;

    }


    if (
      char === '"'
    ) {

      inString =
        !inString;

      continue;

    }


    if (
      inString
    ) {

      continue;

    }


    if (
      char === "{"
    ) {

      depth++;

    }


    if (
      char === "}"
    ) {

      depth--;

      if (
        depth === 0
      ) {

        const candidate =
          text.slice(
            start,
            i + 1
          );

        try {

          return JSON.parse(
            candidate
          );

        } catch {

          throw new Error(
            "JSON object was found but could not be parsed."
          );

        }

      }

    }

  }


  throw new Error(
    "Incomplete JSON object returned by model."
  );

}
