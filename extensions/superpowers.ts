import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ContextEvent, ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

const BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for omp";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(extensionDir, "..");
const bootstrapSkillPath = resolve(packageRoot, "skills", "using-superpowers", "SKILL.md");

let cachedBootstrap: string | null | undefined;

export default function superpowersOmpExtension(pi: ExtensionAPI) {
  let armed = true;

  pi.on("session_start", async () => { armed = true; });
  pi.on("session_compact", async () => { armed = true; });
  pi.on("agent_end", async () => { armed = false; });

  pi.on("context", async (event: ContextEvent) => {
    if (!armed) return;
    const messages = event.messages;
    if (messages.some(containsMarker)) return;
    const bootstrap = getBootstrap(pi);
    if (bootstrap === null) return;
    const bootstrapMessage = {
      role: "user" as const,
      content: [{ type: "text" as const, text: bootstrap }],
      timestamp: Date.now(),
    };
    const at = firstNonCompactionSummaryIndex(messages);
    return {
      messages: [...messages.slice(0, at), bootstrapMessage, ...messages.slice(at)],
    };
  });
}

function getBootstrap(pi: ExtensionAPI): string | null {
  if (cachedBootstrap !== undefined) return cachedBootstrap;
  try {
    const body = stripFrontmatter(readFileSync(bootstrapSkillPath, "utf8"));
    cachedBootstrap = `<EXTREMELY_IMPORTANT>
${BOOTSTRAP_MARKER}

You have superpowers.

The using-superpowers skill content is included below and is already loaded for this OMP session. Follow it now. Do not reload using-superpowers.

${body}

${ompToolMapping()}
</EXTREMELY_IMPORTANT>`;
    return cachedBootstrap;
  } catch (error) {
    cachedBootstrap = null;
    const logger = (pi as { logger?: { warn?: (...a: unknown[]) => void } }).logger;
    const warn = logger?.warn?.bind(logger) ?? console.warn;
    warn("Superpowers bootstrap unavailable", {
      path: bootstrapSkillPath,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return (match ? match[1] : content).trim();
}

function firstNonCompactionSummaryIndex(messages: unknown[]): number {
  let index = 0;
  while (index < messages.length) {
    const item = messages[index];
    if (item && typeof item === "object" && (item as { role?: unknown }).role === "compactionSummary") {
      index += 1;
    } else {
      break;
    }
  }
  return index;
}

function containsMarker(message: unknown): boolean {
  if (!message || typeof message !== "object") return false;
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content.includes(BOOTSTRAP_MARKER);
  if (!Array.isArray(content)) return false;
  return content.some(
    (part) =>
      part &&
      typeof part === "object" &&
      (part as { type?: unknown }).type === "text" &&
      typeof (part as { text?: unknown }).text === "string" &&
      (part as { text: string }).text.includes(BOOTSTRAP_MARKER),
  );
}

function ompToolMapping(): string {
  return `## OMP tool mapping

Use OMP native skill discovery when a Superpowers instruction says to invoke a skill: read \`skill://<name>\` (or \`skill://<name>/<relative-path>\` for a skill's bundled asset) when the skill applies; \`/skill:<name>\` is available for explicit human invocation.

OMP's lowercase built-ins are \`read\`, \`write\`, \`edit\`, \`bash\`, \`grep\`, and \`glob\`. Use them for the corresponding file, shell, and search actions.

For Superpowers subagent workflows, use the built-in lowercase \`task\`.

For legacy \`TodoWrite\` task tracking, use the built-in lowercase \`todo\`.

Never invent capitalized \`Skill\`, \`Task\`, or \`TodoWrite\` calls.`;
}
