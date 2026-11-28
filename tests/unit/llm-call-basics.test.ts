import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import {
  type CallConfig,
  CallConfigError,
  type CallConfigField,
  CallFailedError,
  callModel,
  DEFAULT_MAX_RETRIES,
} from "@/lib/ai/basics";

/**
 * Acceptance tests of `callModel` (spec 002, requirements 1 to 4 and 6). Only `MockLanguageModelV4`
 * is used: no real model, no Ollama, no network. Attempts are counted with `doGenerateCalls.length`.
 * Every `describe` has a 1000 ms timeout per test (non-functional requirement). The retry tests stay
 * under it because the retryable errors carry `retry-after-ms: "0"` (plan ADR-6), so the SDK does not
 * wait. If the SDK stopped reading that header, these tests would time out instead of passing slowly.
 */

type GenerateResult = Awaited<ReturnType<MockLanguageModelV4["doGenerate"]>>;
type Step = GenerateResult | Error;

const PER_TEST_TIMEOUT = { timeout: 1000 } as const;
const PROMPT_MARKER = "PROMPT-BODY-MARKER-4f1a";
const SYSTEM_MARKER = "SYSTEM-BODY-MARKER-9c2e";

/** Token counts of one generation. `undefined` models a provider that does not report the count. */
interface Tokens {
  readonly input: number | undefined;
  readonly output: number | undefined;
}

/**
 * A successful generation. The counts are an object, not default parameters: a default would replace an
 * explicit `undefined` with a number and hide the case this helper exists to build.
 */
function success(text = "ok", tokens: Tokens = { input: 3, output: 5 }): GenerateResult {
  const { input, output } = tokens;
  return {
    content: [{ type: "text", text }],
    finishReason: { unified: "stop", raw: "stop" },
    usage: {
      inputTokens: { total: input, noCache: input, cacheRead: undefined, cacheWrite: undefined },
      outputTokens: { total: output, text: output, reasoning: undefined },
    },
    warnings: [],
  };
}

/** An error the SDK retries, with a zero wait so that no real time passes. */
function retryable(message = "busy"): APICallError {
  return new APICallError({
    message,
    url: "https://provider.invalid/v1",
    requestBodyValues: { prompt: PROMPT_MARKER },
    statusCode: 503,
    responseHeaders: { "retry-after-ms": "0" },
    isRetryable: true,
  });
}

/** An error the SDK does not retry (an authentication failure, for example). */
function fatal(message = "denied"): APICallError {
  return new APICallError({
    message,
    url: "https://provider.invalid/v1",
    requestBodyValues: { prompt: PROMPT_MARKER },
    statusCode: 401,
    responseHeaders: { "retry-after-ms": "0" },
    isRetryable: false,
  });
}

/** A model that answers each call with the next step: a result is returned, an error is thrown. */
function scripted(steps: readonly Step[]): MockLanguageModelV4 {
  let index = 0;
  return new MockLanguageModelV4({
    doGenerate: async () => {
      const step = steps[index];
      index += 1;
      if (step === undefined) throw new Error("the scripted model ran out of steps");
      if (step instanceof Error) throw step;
      return step;
    },
  });
}

function succeeding(result: GenerateResult = success()): MockLanguageModelV4 {
  return new MockLanguageModelV4({ doGenerate: result });
}

/** `count` distinct retryable errors, so that a test can tell which one was the last. */
function retryables(count: number): APICallError[] {
  return Array.from({ length: count }, (_, index) => retryable(`busy-${index + 1}`));
}

/** Runs `callModel` and returns what it rejected with. Fails the test when it resolved. */
async function rejection(model: MockLanguageModelV4, config: CallConfig): Promise<unknown> {
  const outcome = await callModel(model, config).then(
    (result) => ({ resolved: result }),
    (error: unknown) => ({ rejected: error }),
  );
  if ("resolved" in outcome) {
    throw new Error(`callModel resolved with ${JSON.stringify(outcome.resolved)}`);
  }
  return outcome.rejected;
}

describe("roles and settings (1.1, 1.2, 1.4 to 1.8)", PER_TEST_TIMEOUT, () => {
  it("calls the model it was given (1.1)", async () => {
    const model = succeeding();

    await callModel(model, { prompt: "hello" });

    expect(model.doGenerateCalls).toHaveLength(1);
  });

  it("sends the system text first as a system message, then the prompt as a user message (1.4)", async () => {
    const model = succeeding();

    await callModel(model, { prompt: "USER TEXT", system: "SYSTEM TEXT" });

    expect(model.doGenerateCalls[0]?.prompt).toEqual([
      { role: "system", content: "SYSTEM TEXT" },
      { role: "user", content: [{ type: "text", text: "USER TEXT" }] },
    ]);
  });

  it("sends only one user message when system is omitted (1.5)", async () => {
    const model = succeeding();

    await callModel(model, { prompt: "USER TEXT" });

    expect(model.doGenerateCalls[0]?.prompt).toEqual([
      { role: "user", content: [{ type: "text", text: "USER TEXT" }] },
    ]);
  });

  it("passes temperature and maxOutputTokens through as given (1.6)", async () => {
    const model = succeeding();

    await callModel(model, { prompt: "p", temperature: 0.3, maxOutputTokens: 42 });

    expect(model.doGenerateCalls[0]?.temperature).toBe(0.3);
    expect(model.doGenerateCalls[0]?.maxOutputTokens).toBe(42);
  });

  it("leaves temperature and maxOutputTokens undefined in the request when omitted (1.7)", async () => {
    const model = succeeding();

    await callModel(model, { prompt: "p" });

    expect(model.doGenerateCalls[0]?.temperature).toBeUndefined();
    expect(model.doGenerateCalls[0]?.maxOutputTokens).toBeUndefined();
  });

  it("makes one non-streaming call with no tools (1.8)", async () => {
    const model = succeeding();

    await callModel(model, { prompt: "p", system: "s" });

    expect(model.doGenerateCalls).toHaveLength(1);
    expect(model.doStreamCalls).toHaveLength(0);
    expect(model.doGenerateCalls[0]?.tools).toBeUndefined();
  });

  it("does not forward keys that are not part of the settings, even when the type is widened (1.2)", async () => {
    const model = succeeding();
    // The type is widened on purpose: the compile-time check is in llm-call-basics-contract.test.ts.
    // An aborted signal would make the SDK reject, and `messages` next to `prompt` would be refused.
    const widened: CallConfig & Record<string, unknown> = {
      prompt: "USER TEXT",
      topP: 0.25,
      instructions: "SNEAKED INSTRUCTIONS",
      abortSignal: AbortSignal.abort(),
      messages: [{ role: "user", content: "SNEAKED MESSAGE" }],
      tools: { sneaked: {} },
    };

    await callModel(model, widened);

    const request = model.doGenerateCalls[0];
    expect(request?.prompt).toEqual([
      { role: "user", content: [{ type: "text", text: "USER TEXT" }] },
    ]);
    expect(request?.topP).toBeUndefined();
    expect(request?.tools).toBeUndefined();
    expect(request?.abortSignal).toBeUndefined();
  });
});

describe("result and usage (2.1 to 2.4)", PER_TEST_TIMEOUT, () => {
  it("returns the generated text as is, including surrounding whitespace (2.1)", async () => {
    const result = await callModel(succeeding(success("  padded text\n")), { prompt: "p" });

    expect(result.text).toBe("  padded text\n");
  });

  it("returns the input and output token counts as reported (2.2)", async () => {
    const result = await callModel(succeeding(success("t", { input: 11, output: 22 })), {
      prompt: "p",
    });

    expect(result.usage.inputTokens).toBe(11);
    expect(result.usage.outputTokens).toBe(22);
  });

  it.each([
    { label: "output only", input: 5, output: undefined },
    { label: "input only", input: undefined, output: 7 },
    { label: "both", input: undefined, output: undefined },
  ])(
    "keeps a token count the model did not report as undefined, not 0: $label (2.3)",
    async ({ input, output }) => {
      const result = await callModel(succeeding(success("t", { input, output })), { prompt: "p" });

      // toStrictEqual tells a key that is present with `undefined` from a missing key.
      expect(result.usage).toStrictEqual({ inputTokens: input, outputTokens: output });
    },
  );

  it("returns exactly text and usage, and exactly two token counts, as plain values (2.4)", async () => {
    const result = await callModel(succeeding(success("t", { input: 1, output: 2 })), {
      prompt: "p",
    });

    expect(Object.keys(result).sort()).toEqual(["text", "usage"]);
    expect(Object.keys(result.usage).sort()).toEqual(["inputTokens", "outputTokens"]);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(result.usage)).toBe(Object.prototype);
    expect(typeof result.text).toBe("string");
    expect(typeof result.usage.inputTokens).toBe("number");
    expect(typeof result.usage.outputTokens).toBe("number");
  });
});

describe(
  "rejecting invalid settings before the model is called (3.1 to 3.5)",
  PER_TEST_TIMEOUT,
  () => {
    /** Asserts the rejection is a CallConfigError for `field` and that the model was never called. */
    async function expectConfigRejected(config: CallConfig, field: CallConfigField): Promise<void> {
      const model = succeeding();

      const error = await rejection(model, config);

      expect(error).toBeInstanceOf(CallConfigError);
      expect(error).toMatchObject({ name: "CallConfigError", field });
      expect(model.doGenerateCalls).toHaveLength(0);
    }

    it.each([
      { label: "empty string", value: "" },
      { label: "one space", value: " " },
      { label: "several spaces", value: "     " },
      { label: "a newline", value: "\n" },
      { label: "a tab", value: "\t" },
      { label: "a full-width space", value: "　" },
      { label: "mixed whitespace", value: " \n\t　 " },
    ])("rejects a prompt that is $label (3.1)", async ({ value }) => {
      await expectConfigRejected({ prompt: value }, "prompt");
    });

    it("accepts a prompt that has a non-whitespace character, with whitespace around it (3.1)", async () => {
      const model = succeeding();

      await callModel(model, { prompt: "  x\n" });

      expect(model.doGenerateCalls).toHaveLength(1);
    });

    it.each([
      { label: "NaN", value: Number.NaN },
      { label: "Infinity", value: Number.POSITIVE_INFINITY },
      { label: "-Infinity", value: Number.NEGATIVE_INFINITY },
    ])("rejects temperature $label (3.2)", async ({ value }) => {
      await expectConfigRejected({ prompt: "p", temperature: value }, "temperature");
    });

    it.each([0, -1, 0.7])("accepts the finite temperature %s (3.2)", async (value) => {
      const model = succeeding();

      await callModel(model, { prompt: "p", temperature: value });

      expect(model.doGenerateCalls[0]?.temperature).toBe(value);
    });

    it.each([
      { label: "0", value: 0 },
      { label: "-1", value: -1 },
      { label: "1.5", value: 1.5 },
      { label: "NaN", value: Number.NaN },
      { label: "Infinity", value: Number.POSITIVE_INFINITY },
    ])("rejects maxOutputTokens $label (3.3)", async ({ value }) => {
      await expectConfigRejected({ prompt: "p", maxOutputTokens: value }, "maxOutputTokens");
    });

    it("accepts maxOutputTokens 1, the smallest valid value (3.3)", async () => {
      const model = succeeding();

      await callModel(model, { prompt: "p", maxOutputTokens: 1 });

      expect(model.doGenerateCalls[0]?.maxOutputTokens).toBe(1);
    });

    it.each([
      { label: "-1", value: -1 },
      { label: "1.5", value: 1.5 },
      { label: "NaN", value: Number.NaN },
      { label: "Infinity", value: Number.POSITIVE_INFINITY },
    ])("rejects maxRetries $label (3.4)", async ({ value }) => {
      await expectConfigRejected({ prompt: "p", maxRetries: value }, "maxRetries");
    });

    it("accepts maxRetries 0, the smallest valid value (3.4)", async () => {
      const model = succeeding();

      await callModel(model, { prompt: "p", maxRetries: 0 });

      expect(model.doGenerateCalls).toHaveLength(1);
    });

    it("names the first invalid setting in the order prompt, temperature, maxOutputTokens, maxRetries (3.5)", async () => {
      const allInvalid = {
        prompt: "",
        temperature: Number.NaN,
        maxOutputTokens: 0,
        maxRetries: -1,
      };

      await expectConfigRejected(allInvalid, "prompt");
      await expectConfigRejected({ ...allInvalid, prompt: "valid" }, "temperature");
      await expectConfigRejected(
        { ...allInvalid, prompt: "valid", temperature: 0 },
        "maxOutputTokens",
      );
      await expectConfigRejected(
        { ...allInvalid, prompt: "valid", temperature: 0, maxOutputTokens: 1 },
        "maxRetries",
      );
    });

    it("puts the setting name in the message, and never the prompt, the system text, or the value (3.5)", async () => {
      const cases: Array<{ config: CallConfig; field: CallConfigField; value: string }> = [
        {
          config: { prompt: PROMPT_MARKER, system: SYSTEM_MARKER, temperature: Number.NaN },
          field: "temperature",
          value: "NaN",
        },
        {
          config: { prompt: PROMPT_MARKER, system: SYSTEM_MARKER, maxOutputTokens: 123456.789 },
          field: "maxOutputTokens",
          value: "123456.789",
        },
        {
          config: { prompt: PROMPT_MARKER, system: SYSTEM_MARKER, maxRetries: -987654 },
          field: "maxRetries",
          value: "-987654",
        },
      ];

      for (const { config, field, value } of cases) {
        const error = await rejection(succeeding(), config);

        expect(error).toBeInstanceOf(CallConfigError);
        const message = (error as CallConfigError).message;
        expect(message, `${field}: message`).toContain(field);
        expect(message, `${field}: message`).not.toContain(PROMPT_MARKER);
        expect(message, `${field}: message`).not.toContain(SYSTEM_MARKER);
        expect(message, `${field}: message`).not.toContain(value);
      }
    });

    it("does not put the prompt or the system text in the message of a prompt rejection (3.5)", async () => {
      const error = await rejection(succeeding(), { prompt: "   ", system: SYSTEM_MARKER });

      expect(error).toBeInstanceOf(CallConfigError);
      expect((error as CallConfigError).message).not.toContain(SYSTEM_MARKER);
    });
  },
);

describe("retries and failures (2.5, 4.1 to 4.8)", PER_TEST_TIMEOUT, () => {
  /** Asserts a rejection is a CallFailedError with these properties. */
  function expectFailure(
    error: unknown,
    expected: { reason: "retries-exhausted" | "not-retryable"; attempts: number },
  ): CallFailedError {
    expect(error).toBeInstanceOf(CallFailedError);
    expect(error).toMatchObject({ name: "CallFailedError", ...expected });
    return error as CallFailedError;
  }

  describe.each([0, 1, 2, 3])("with maxRetries %s", (maxRetries) => {
    const failuresBeforeSuccess = Array.from({ length: maxRetries }, (_, index) => index + 1);

    it.each(failuresBeforeSuccess)(
      "succeeds on attempt %s + 1 after %s retryable failure(s) (4.1)",
      async (failures) => {
        const model = scripted([...retryables(failures), success("recovered")]);

        const result = await callModel(model, { prompt: "p", maxRetries });

        expect(result.text).toBe("recovered");
        expect(model.doGenerateCalls).toHaveLength(failures + 1);
      },
    );

    it("stops after maxRetries + 1 attempts of retryable failures with retries-exhausted (4.2, 4.4)", async () => {
      const model = scripted(retryables(maxRetries + 1));

      const error = await rejection(model, { prompt: "p", maxRetries });

      expectFailure(error, { reason: "retries-exhausted", attempts: maxRetries + 1 });
      expect(model.doGenerateCalls).toHaveLength(maxRetries + 1);
    });

    it("stops after one attempt on an error that is not retryable, with not-retryable (4.3, 4.4)", async () => {
      const model = scripted([fatal()]);

      const error = await rejection(model, { prompt: "p", maxRetries });

      expectFailure(error, { reason: "not-retryable", attempts: 1 });
      expect(model.doGenerateCalls).toHaveLength(1);
    });

    it("treats an error that is not an API call error as not retryable (4.3)", async () => {
      const model = scripted([new Error("boom")]);

      const error = await rejection(model, { prompt: "p", maxRetries });

      expectFailure(error, { reason: "not-retryable", attempts: 1 });
      expect(model.doGenerateCalls).toHaveLength(1);
    });
  });

  it("returns the usage of the attempt that succeeded after a retry (2.5)", async () => {
    const model = scripted([retryable(), success("late", { input: 20, output: 200 })]);

    const result = await callModel(model, { prompt: "p", maxRetries: 2 });

    expect(result.usage).toStrictEqual({ inputTokens: 20, outputTokens: 200 });
  });

  it.each([
    // r = retryable failures first, then one error that is not retryable.
    { maxRetries: 2, retryableFirst: 1, reason: "not-retryable", attempts: 2 },
    { maxRetries: 3, retryableFirst: 1, reason: "not-retryable", attempts: 2 },
    { maxRetries: 3, retryableFirst: 2, reason: "not-retryable", attempts: 3 },
    // The error that is not retryable arrives on the last attempt that was allowed: the SDK reports
    // that the retries ran out (plan ADR-5), and cause is the error that is not retryable.
    { maxRetries: 1, retryableFirst: 1, reason: "retries-exhausted", attempts: 2 },
    { maxRetries: 2, retryableFirst: 2, reason: "retries-exhausted", attempts: 3 },
    { maxRetries: 3, retryableFirst: 3, reason: "retries-exhausted", attempts: 4 },
  ] as const)(
    "after $retryableFirst retryable failure(s) and then an error that is not retryable, with maxRetries $maxRetries: $reason after $attempts attempts (4.8)",
    async ({ maxRetries, retryableFirst, reason, attempts }) => {
      const last = fatal("final denial");
      const model = scripted([...retryables(retryableFirst), last]);

      const error = await rejection(model, { prompt: "p", maxRetries });

      const failure = expectFailure(error, { reason, attempts });
      expect(model.doGenerateCalls).toHaveLength(attempts);
      expect(failure.cause).toBe(last);
    },
  );

  it("allows 2 retries, so 3 attempts, when maxRetries is omitted (4.5)", async () => {
    expect(DEFAULT_MAX_RETRIES).toBe(2);
    const model = scripted(retryables(3));

    const error = await rejection(model, { prompt: "p" });

    expectFailure(error, { reason: "retries-exhausted", attempts: 3 });
    expect(model.doGenerateCalls).toHaveLength(3);
  });

  it("succeeds on the third attempt when maxRetries is omitted (4.5)", async () => {
    const model = scripted([...retryables(2), success("third time")]);

    const result = await callModel(model, { prompt: "p" });

    expect(result.text).toBe("third time");
    expect(model.doGenerateCalls).toHaveLength(3);
  });

  it("keeps the error of the last attempt, the same object, as cause (4.6)", async () => {
    const errors = retryables(3);
    const [, , last] = errors;

    const error = await rejection(scripted(errors), { prompt: "p", maxRetries: 2 });

    expect(expectFailure(error, { reason: "retries-exhausted", attempts: 3 }).cause).toBe(last);
  });

  it("keeps the unwrapped error as cause when retries are off or the first error is final (4.6)", async () => {
    const only = retryable("only attempt");
    const denied = fatal();

    const noRetries = await rejection(scripted([only]), { prompt: "p", maxRetries: 0 });
    const notRetryable = await rejection(scripted([denied]), { prompt: "p", maxRetries: 2 });

    expect(expectFailure(noRetries, { reason: "retries-exhausted", attempts: 1 }).cause).toBe(only);
    expect(expectFailure(notRetryable, { reason: "not-retryable", attempts: 1 }).cause).toBe(
      denied,
    );
  });

  it("does not copy the message of the SDK error, or the prompt in it, into its own message (4.7)", async () => {
    const leaky = (steps: readonly Step[]) => scripted(steps);
    const cases: Array<{ model: MockLanguageModelV4; maxRetries: number }> = [
      // Wrapped by the SDK: its RetryError message embeds the last error's message.
      {
        model: leaky(Array.from({ length: 3 }, () => retryable(`leak ${PROMPT_MARKER}`))),
        maxRetries: 2,
      },
      // Not wrapped by the SDK.
      { model: leaky([retryable(`leak ${PROMPT_MARKER}`)]), maxRetries: 0 },
      { model: leaky([fatal(`leak ${PROMPT_MARKER}`)]), maxRetries: 2 },
    ];

    for (const { model, maxRetries } of cases) {
      const error = await rejection(model, {
        prompt: PROMPT_MARKER,
        system: SYSTEM_MARKER,
        maxRetries,
      });

      expect(error).toBeInstanceOf(CallFailedError);
      const message = (error as CallFailedError).message;
      expect(message).not.toContain(PROMPT_MARKER);
      expect(message).not.toContain(SYSTEM_MARKER);
      expect(message).not.toContain("leak");
    }
  });
});
