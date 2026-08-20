export function extractJson(
  raw: string
): unknown {

  let text = raw.trim();

  /*
   * Remove Markdown JSON fences.
   *
   * ```json
   * {...}
   * ```
   */

  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  /*
   * First attempt:
   * entire response is JSON.
   */

  try {
    return JSON.parse(text);
  } catch {
    // Continue with extraction.
  }

  /*
   * Second attempt:
   * find the outermost JSON object.
   */

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {
    throw new Error(
      "No JSON object found in model response."
    );
  }

  const candidate =
    text.slice(start, end + 1);

  return JSON.parse(candidate);
}