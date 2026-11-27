// Stage 2 hello: call the local Ollama model once through callModel and print the reply and the usage.
// Run it with `mise run hello`. Ollama must be running. It is not part of `mise run verify`.
//
// The script is read top to bottom: constants, the model, the call, then what to print.
// Only erasable syntax and `import type`, because Node runs this file with its type stripping.
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { APICallError } from "ai";
import { CallConfigError, CallFailedError, callModel } from "../src/lib/ai/basics.ts";
import { MODEL_ALLOWLIST } from "../src/lib/ai/model-allowlist.ts";

// Ollama's OpenAI-compatible API on this machine (Ollama's documentation lists this address).
// Nothing is read from the environment, so the script behaves the same on every machine.
const OLLAMA_BASE_URL = "http://localhost:11434/v1";

// The model comes from the allowlist, so a model ID is never typed here.
const MODEL_ID = MODEL_ALLOWLIST.ollama[0];

const SYSTEM = "You are a concise assistant.";
const PROMPT = "Say hello in one short sentence.";

// To use another provider, replace this line and its import (see docs/stages/2-llm-call-basics.md).
const model = createOpenAICompatible({ name: "ollama", baseURL: OLLAMA_BASE_URL })(MODEL_ID);

/** The model ID is allowlisted, so it is safe to print in the commands below. */
const PULL_COMMAND = `ollama pull ${MODEL_ID}`;

/** Describes a failure for a person. It never prints the prompt, the system text, or an error object. */
function explain(error: unknown): string {
  if (error instanceof CallFailedError && error.cause instanceof APICallError) {
    const { statusCode } = error.cause;
    if (statusCode === undefined) {
      return [
        "Could not connect to Ollama.",
        "Start it (open the Ollama app, or run `ollama serve`), then pull the model:",
        `  ${PULL_COMMAND}`,
      ].join("\n");
    }
    if (statusCode === 404) {
      return [
        "Ollama is running, but the model is not pulled yet. Pull it:",
        `  ${PULL_COMMAND}`,
      ].join("\n");
    }
  }
  if (error instanceof CallFailedError) {
    const causeName = error.cause instanceof Error ? error.cause.name : typeof error.cause;
    const status = error.cause instanceof APICallError ? error.cause.statusCode : undefined;
    const detail = status === undefined ? causeName : `${causeName}, HTTP ${status}`;
    return `The call failed (${error.reason} after ${error.attempts} attempt(s)): ${detail}`;
  }
  if (error instanceof CallConfigError) {
    return `A setting is invalid: ${error.field}`;
  }
  return `Unexpected error: ${error instanceof Error ? error.name : typeof error}`;
}

try {
  const result = await callModel(model, {
    system: SYSTEM,
    prompt: PROMPT,
    temperature: 0.2,
    maxOutputTokens: 256,
    // The default, written out so that it can be changed here. Retrying a refused connection takes
    // about 6 seconds before the message below appears.
    maxRetries: 2,
  });
  console.log(`model: ${MODEL_ID}`);
  console.log(`reply: ${result.text}`);
  console.log(`inputTokens: ${result.usage.inputTokens ?? "unknown"}`);
  console.log(`outputTokens: ${result.usage.outputTokens ?? "unknown"}`);
} catch (error) {
  console.error(explain(error));
  process.exitCode = 1;
}
