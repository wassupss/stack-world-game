// ============================================================
// STACKWORLD - 커맨드 파서
// "work PLAN_FE_001" → { name: "work", args: ["PLAN_FE_001"], flags: {} }
// ============================================================

export interface ParsedCommand {
  name: string;
  subcommand?: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
}

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return null;

  const [name, ...rest] = tokens;
  const flags: Record<string, string | boolean> = {};
  const args: string[] = [];
  let subcommand: string | undefined;

  let i = 0;
  // 첫 번째 인자가 플래그가 아니면 subcommand로 처리
  if (rest.length > 0 && !rest[0].startsWith("-")) {
    subcommand = rest[0];
    i = 1;
  }

  while (i < rest.length) {
    const token = rest[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      if (i + 1 < rest.length && !rest[i + 1].startsWith("-")) {
        flags[key] = rest[i + 1];
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
    } else if (token.startsWith("-")) {
      const key = token.slice(1);
      flags[key] = true;
      i += 1;
    } else {
      args.push(token);
      i += 1;
    }
  }

  return {
    name: name.toLowerCase(),
    subcommand: subcommand?.toLowerCase(),
    args,
    flags,
    raw: trimmed,
  };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (const char of input) {
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
        if (current) tokens.push(current);
        current = "";
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === " " || char === "\t") {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) tokens.push(current);
  return tokens;
}
