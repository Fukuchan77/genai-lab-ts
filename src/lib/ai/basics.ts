// Stage 2: one LLM call, with the settings that shape it and the failures that can happen.
// Only erasable syntax: scripts/hello.ts runs this file through Node's type stripping, and
// tsconfig.json (`erasableSyntaxOnly`, `verbatimModuleSyntax`) makes `mise run typecheck` enforce it.
// The only imports are `server-only` and `ai` (spec 002, 1.1, 1.9).
import "server-only";
import { APICallError, generateText, type LanguageModel, RetryError } from "ai";

/** A model object. A string model ID is refused by the type: the SDK would build a gateway model from it. */
export type ModelObject = Exclude<LanguageModel, string>;

export interface CallConfig {
  /** The user message. It must contain a character that is not whitespace. */
  readonly prompt: string;
  /** The system message. The SDK calls this setting `instructions`. */
  readonly system?: string;
  /** A finite number. Its useful range depends on the model. */
  readonly temperature?: number;
  /** An integer of 1 or more. */
  readonly maxOutputTokens?: number;
  /** How many times a failed call is tried again: an integer of 0 or more. */
  readonly maxRetries?: number;
}

/** A token count is `undefined` when the model did not report it. It is never filled with 0. */
export interface CallUsage {
  readonly inputTokens: number | undefined;
  readonly outputTokens: number | undefined;
}

export interface CallResult {
  readonly text: string;
  readonly usage: CallUsage;
}

export type CallConfigField = "prompt" | "temperature" | "maxOutputTokens" | "maxRetries";

/**
 * `retries-exhausted`: every attempt that was allowed has been used.
 * `not-retryable`: the SDK stopped early because the error cannot be fixed by trying again.
 */
export type CallFailureReason = "retries-exhausted" | "not-retryable";

export const DEFAULT_MAX_RETRIES = 2;

/** A setting was invalid. The model was not called. The message never contains the value. */
export class CallConfigError extends Error {
  override name = "CallConfigError";
  readonly field: CallConfigField;

  constructor(field: CallConfigField, requirement: string) {
    super(`${field} must be ${requirement}`);
    this.field = field;
  }
}

/**
 * The model call failed. `cause` is the error of the last attempt, as the SDK reported it. It can hold the
 * request body, so print its type, not the whole object. The message is built from `reason` and
 * `attempts` only, so it never contains the prompt or the system text.
 */
export class CallFailedError extends Error {
  override name = "CallFailedError";
  readonly reason: CallFailureReason;
  readonly attempts: number;

  constructor(reason: CallFailureReason, attempts: number, cause: unknown) {
    const why = reason === "retries-exhausted" ? "retries exhausted" : "not retryable";
    super(`The model call failed after ${attempts} attempt${attempts === 1 ? "" : "s"}: ${why}`, {
      cause,
    });
    this.reason = reason;
    this.attempts = attempts;
  }
}

/** Checks the settings in a fixed order and throws for the first invalid one. Omitted settings are skipped. */
function validate(config: CallConfig): void {
  if (config.prompt.trim() === "") {
    throw new CallConfigError("prompt", "a string with a character that is not whitespace");
  }
  if (config.temperature !== undefined && !Number.isFinite(config.temperature)) {
    throw new CallConfigError("temperature", "a finite number");
  }
  if (
    config.maxOutputTokens !== undefined &&
    !(Number.isInteger(config.maxOutputTokens) && config.maxOutputTokens >= 1)
  ) {
    throw new CallConfigError("maxOutputTokens", "an integer of 1 or more");
  }
  if (
    config.maxRetries !== undefined &&
    !(Number.isInteger(config.maxRetries) && config.maxRetries >= 0)
  ) {
    throw new CallConfigError("maxRetries", "an integer of 0 or more");
  }
}

/**
 * Turns what `generateText` threw into a CallFailedError. The SDK throws a RetryError once it has retried
 * (or stopped early after a retry), and the bare error when it did not retry at all. The decision uses the
 * SDK's own `reason` and `isRetryable`, never the text of a message.
 */
function toCallFailedError(error: unknown, maxRetries: number): CallFailedError {
  if (RetryError.isInstance(error)) {
    const reason = error.reason === "maxRetriesExceeded" ? "retries-exhausted" : "not-retryable";
    return new CallFailedError(reason, error.errors.length, error.lastError);
  }
  // Not wrapped: one attempt. With retries off, a retryable error ends the call as "exhausted".
  const wouldRetry = maxRetries === 0 && APICallError.isInstance(error) && error.isRetryable;
  return new CallFailedError(wouldRetry ? "retries-exhausted" : "not-retryable", 1, error);
}

/** Calls `model` once (the SDK may retry) and returns the text and the token usage. Rejects on failure. */
export async function callModel(model: ModelObject, config: CallConfig): Promise<CallResult> {
  validate(config);
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  try {
    // Only these settings are passed, one by one: nothing else in `config` can reach the SDK.
    const result = await generateText({
      model,
      instructions: config.system,
      prompt: config.prompt,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      maxRetries,
    });
    return {
      text: result.text,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
    };
  } catch (error) {
    throw toCallFailedError(error, maxRetries);
  }
}
