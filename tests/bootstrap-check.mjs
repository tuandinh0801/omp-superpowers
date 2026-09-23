import assert from "node:assert/strict";
import superpowersOmpExtension from "../extensions/superpowers.ts";

const handlers = {};
let warnCount = 0;
const fakePi = {
  on(evt, fn) {
    handlers[evt] = fn;
  },
  logger: {
    warn() {
      warnCount += 1;
    },
  },
};

superpowersOmpExtension(fakePi);

assert.equal(typeof handlers.session_start, "function", "session_start registered");
assert.equal(typeof handlers.session_compact, "function", "session_compact registered");
assert.equal(typeof handlers.agent_end, "function", "agent_end registered");
assert.equal(typeof handlers.context, "function", "context registered");

// 1. session_start -> context -> bootstrap injected
await handlers.session_start();
const r1 = await handlers.context({ type: "context", messages: [] });
assert.ok(r1, "r1 returned");
assert.equal(r1.messages.length, 1, "r1 contains 1 message");
const text1 = r1.messages[0].content[0].text;
assert.ok(text1.includes("superpowers:using-superpowers bootstrap for omp"), "contains bootstrap marker");
assert.ok(text1.includes("You have superpowers"), "contains superpowers greeting");
assert.ok(text1.includes("## OMP tool mapping"), "contains tool mapping");

// 2. dedup: context containing bootstrap marker does not re-inject
const r2 = await handlers.context({ type: "context", messages: [r1.messages[0]] });
assert.equal(r2, undefined, "r2 deduplicated");

// 3. agent_end -> disarmed
await handlers.agent_end();
const r3 = await handlers.context({ type: "context", messages: [] });
assert.equal(r3, undefined, "r3 disarmed on agent_end");

// 4. session_compact -> rearmed and inserted after compaction summary
await handlers.session_compact();
const r4 = await handlers.context({
  type: "context",
  messages: [{ role: "compactionSummary", content: "S" }],
});
assert.ok(r4, "r4 returned");
assert.equal(r4.messages.length, 2, "r4 contains summary and bootstrap");
assert.equal(r4.messages[0].role, "compactionSummary", "compactionSummary first");
assert.equal(r4.messages[1].role, "user", "bootstrap message second");
assert.ok(r4.messages[1].content[0].text.includes("superpowers:using-superpowers bootstrap for omp"), "bootstrap text valid");

assert.equal(warnCount, 0, "no unexpected warnings");
console.log("All bootstrap checks passed.");
