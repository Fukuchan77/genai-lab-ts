// The only place in the repository where model IDs are defined (spec 001, 6.1). `check:model-ids`
// rejects any other occurrence. Each ID was confirmed on the provider's official documentation on
// 2026-11-23; the URLs and evidence are in specs/001-dev-environment-and-gates/research.md R-5.
// Only erasable syntax: scripts/check-model-ids.mjs imports this file with Node's type stripping.

export const PROVIDERS = ["openai", "anthropic", "google", "ollama"] as const;

export type Provider = (typeof PROVIDERS)[number];

export const MODEL_ALLOWLIST = {
  openai: ["gpt-6.2-sol"],
  anthropic: ["claude-fable-5-2", "claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
  google: ["gemini-3.1-flash-lite"],
  ollama: ["llama3.2:3b"],
} as const satisfies Record<Provider, readonly string[]>;

export type AllowedModelId<P extends Provider = Provider> = (typeof MODEL_ALLOWLIST)[P][number];
