import { execSync } from "child_process";

const MODEL = "gemma3:4b";

const PROMPT =
  "Explain equivalent fractions to a Grade 5 student using one simple example and three practice questions.";

interface OllamaResponse {
  model: string;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

function runInference(): OllamaResponse {

  const result = execSync(
    `curl -s http://localhost:11434/api/generate ` +
    `-H "Content-Type: application/json" ` +
    `-d '${JSON.stringify({
      model: MODEL,
      prompt: PROMPT,
      stream: false,
    })}'`,
    {
      encoding: "utf8",
    }
  );

  return JSON.parse(result);
}

function ms(ns: number) {
  return ns / 1_000_000;
}

function tokensPerSecond(
  tokens: number,
  durationNs: number
) {
  return tokens / (durationNs / 1_000_000_000);
}

console.log("");
console.log("======================================");
console.log(" SRIMATHY OLLAMA EDGE BASELINE");
console.log("======================================");
console.log("");
console.log("Model:", MODEL);
console.log("Runs : 3");
console.log("");

const results: OllamaResponse[] = [];

for (let i = 1; i <= 3; i++) {

  console.log(`Running experiment ${i}/3...`);

  const result = runInference();

  results.push(result);

  console.log(
    `  Total       : ${ms(result.total_duration).toFixed(2)} ms`
  );

  console.log(
    `  Prefill     : ${ms(result.prompt_eval_duration).toFixed(2)} ms`
  );

  console.log(
    `  Generation  : ${ms(result.eval_duration).toFixed(2)} ms`
  );

  console.log(
    `  Tokens      : ${result.eval_count}`
  );

  console.log(
    `  Tokens/sec  : ${tokensPerSecond(
      result.eval_count,
      result.eval_duration
    ).toFixed(2)}`
  );

  console.log("");
}

const avg = (values: number[]) =>
  values.reduce((a, b) => a + b, 0) / values.length;

const prefill = results.map(
  r => ms(r.prompt_eval_duration)
);

const generation = results.map(
  r => ms(r.eval_duration)
);

const total = results.map(
  r => ms(r.total_duration)
);

const speed = results.map(
  r => tokensPerSecond(
    r.eval_count,
    r.eval_duration
  )
);

console.log("======================================");
console.log("           AGGREGATE RESULTS");
console.log("======================================");
console.log("");

console.log(
  "Average Prefill    :",
  avg(prefill).toFixed(2),
  "ms"
);

console.log(
  "Average Generation :",
  avg(generation).toFixed(2),
  "ms"
);

console.log(
  "Average Total      :",
  avg(total).toFixed(2),
  "ms"
);

console.log(
  "Average Tokens/sec :",
  avg(speed).toFixed(2)
);

console.log("");

console.log("Quantization       : Q4_K_M");
console.log("Processor          : Apple M5 Pro GPU");
console.log("Model Size         : ~3.7 GB resident");

console.log("");
console.log("======================================");
