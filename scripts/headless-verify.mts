// Quick CDP-based driver: open wizard, fill step 1, advance to step 3, open simulator.
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const URL = "http://localhost:3001/admin_modern/rubrics/new";
const SCREENSHOT_OUT = "/tmp/rubric-step3.png";
const SIMULATOR_OUT = "/tmp/rubric-simulator.png";

const chrome = spawn("google-chrome", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--hide-scrollbars",
  "--window-size=1280,900",
  "--remote-debugging-port=9222",
  "--user-data-dir=/tmp/chrome-test",
  "about:blank",
]);

await wait(1500);

async function getJson(path: string) {
  const res = await fetch(`http://localhost:9222${path}`);
  return res.json();
}

const tabs = (await getJson("/json")).filter((t: any) => t.type === "page");
const wsUrl = tabs[0].webSocketDebuggerUrl;
const { WebSocket } = await import("ws").catch(() => ({ WebSocket: null as any }));
if (!WebSocket) {
  console.error("ws module not available");
  chrome.kill();
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map<number, (r: any) => void>();
ws.on("message", (data: any) => {
  const msg = JSON.parse(data.toString());
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)!(msg.result);
    pending.delete(msg.id);
  }
});
function send(method: string, params: any = {}) {
  return new Promise<any>((resolve) => {
    const cid = ++id;
    pending.set(cid, resolve);
    ws.send(JSON.stringify({ id: cid, method, params }));
  });
}
await new Promise<void>((r) => ws.on("open", () => r()));

await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url: URL });
await wait(2500);

// Fill name
await send("Runtime.evaluate", {
  expression: `(() => {
    const input = document.querySelector('input[id="rubric-name"], input[name="name"], input[placeholder*="Essay"]');
    if (!input) return 'no name input';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Demo Rubric');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`,
});

// Fill outcome (contenteditable)
await send("Runtime.evaluate", {
  expression: `(() => {
    const editor = document.querySelector('[contenteditable="true"]');
    if (!editor) return 'no editor';
    editor.focus();
    document.execCommand('insertText', false, 'Demonstrate the rubric outcome.');
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`,
});

// Click "Scored" type
await send("Runtime.evaluate", {
  expression: `(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const scored = labels.find((l) => l.textContent && l.textContent.includes('Scored'));
    if (scored) scored.click();
    return scored ? 'ok' : 'no scored label';
  })()`,
});

await wait(500);

// Click Continue
await send("Runtime.evaluate", {
  expression: `(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const cont = buttons.find((b) => b.textContent && b.textContent.trim() === 'Continue');
    if (cont && !cont.disabled) cont.click();
    return cont ? (cont.disabled ? 'disabled' : 'clicked') : 'no continue';
  })()`,
});

await wait(800);

// At step 2 — click Continue again (matrix has default 1 criterion + 1 level from createMockMatrix)
await send("Runtime.evaluate", {
  expression: `(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const cont = buttons.find((b) => b.textContent && b.textContent.trim() === 'Continue');
    if (cont && !cont.disabled) cont.click();
    return cont ? (cont.disabled ? 'disabled' : 'clicked') : 'no continue';
  })()`,
});
await wait(800);

await send("Page.captureScreenshot", { format: "png" }).then(async (r: any) => {
  const fs = await import("node:fs/promises");
  await fs.writeFile(SCREENSHOT_OUT, Buffer.from(r.data, "base64"));
  console.log("wrote", SCREENSHOT_OUT);
});

// Open simulator
await send("Runtime.evaluate", {
  expression: `(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const sim = buttons.find((b) => b.textContent && b.textContent.includes('Run simulator'));
    if (sim) sim.click();
    return sim ? 'clicked' : 'no simulator button';
  })()`,
});
await wait(800);

await send("Page.captureScreenshot", { format: "png" }).then(async (r: any) => {
  const fs = await import("node:fs/promises");
  await fs.writeFile(SIMULATOR_OUT, Buffer.from(r.data, "base64"));
  console.log("wrote", SIMULATOR_OUT);
});

ws.close();
chrome.kill();