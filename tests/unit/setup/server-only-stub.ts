// Vitest reads this empty module instead of the real `server-only` package (see the alias in
// vitest.config.ts). The real package throws when it is imported without the `react-server` export
// condition, and Vitest does not set that condition. Next.js sets it for Server Components, and
// `mise run hello` sets it with `--conditions=react-server`.
// The throwing behavior itself is checked in llm-call-basics-contract.test.ts with a child Node process.
export {};
