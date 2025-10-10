import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { transformThinking } from "./main.ts";

Deno.test("transformThinking - strip mode", () => {
    const content = "<details>thinking</details>content";
    const result = transformThinking(content, "strip");
    assertEquals(result, "thinkingcontent");
});

Deno.test("transformThinking - thinking mode", () => {
    const content = "<details>thinking</details>content";
    const result = transformThinking(content, "thinking");
    assertEquals(result, "<thinking>thinking</thinking>content");
});

Deno.test("transformThinking - think mode", () => {
    const content = "<details>thinking</details>content";
    const result = transformThinking(content, "think");
    assertEquals(result, "<think>thinking</think>content");
});

Deno.test("transformThinking - raw mode", () => {
    const content = "<details>thinking</details>content";
    const result = transformThinking(content, "raw");
    assertEquals(result, content);
});

Deno.test("transformThinking - separate mode", () => {
    const content = "<details>thinking</details>content";
    const result = transformThinking(content, "separate");
    assertEquals(result, { reasoning: "thinking", content: "content" });
});

Deno.test("transformThinking - empty content", () => {
    const content = "";
    const resultStrip = transformThinking(content, "strip");
    assertEquals(resultStrip, "");
    const resultSeparate = transformThinking(content, "separate");
    assertEquals(resultSeparate, { reasoning: "", content: "" });
});

Deno.test("transformThinking - no tags", () => {
    const content = "just content";
    const resultStrip = transformThinking(content, "strip");
    assertEquals(resultStrip, "just content");
    const resultSeparate = transformThinking(content, "separate");
    assertEquals(resultSeparate, { reasoning: "", content: "just content" });
});

Deno.test("transformThinking - partial details tag", () => {
    const content = "thinking</details>content";
    const result = transformThinking(content, "think");
    assertEquals(result, "<think>thinking</think>content");
});