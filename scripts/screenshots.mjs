/**
 * Clicks through the guided flow as a first-time founder and saves screenshots, on desktop and
 * mobile, in light and dark mode. Uses the Microsoft Edge already installed on the machine
 * (playwright-core downloads no browsers).
 *
 *   node scripts/screenshots.mjs [baseUrl] [outDir]
 *   e.g. node scripts/screenshots.mjs http://localhost:3100 docs/screenshots/m3
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "docs/screenshots/m3";

const DEVICES = {
  desktop: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

async function walk(browser, device, scheme) {
  const context = await browser.newContext({ ...DEVICES[device], colorScheme: scheme });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const shot = async (name, fullPage = false) => {
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUT}/${device}-${scheme}-${name}.png`, fullPage });
  };
  const next = () =>
    page.getByRole("button", { name: /^(Next|Start|See what would have to be true)/ }).click();

  await page.goto(`${BASE}/`);
  await shot("0-landing");
  await page.getByRole("link", { name: "Test my idea" }).first().click();
  await page.waitForURL("**/idea");

  await page.getByPlaceholder("e.g. Meal-prep planner").fill("Meal-prep planner");
  await shot("1-start");
  await next();

  await page.getByText("An app people pay for monthly").click();
  await shot("2-q1-what-are-you-selling");
  await next();

  await page.getByText("Not sure", { exact: true }).click();
  await shot("3-q2-who-buys-it");
  await next();

  await page.getByLabel("Price", { exact: true }).fill("9");
  await shot("4-q3-how-you-charge");
  await next();

  await page.getByText("$5,000", { exact: true }).click();
  await shot("5-q4-budget");
  await next();

  await page.getByText("2 months", { exact: true }).click();
  await shot("6-q5-timing");
  await next();

  await page.getByText("Ads on Instagram and Facebook").click();
  await page.getByText("Creators or influencers talking about it").click();
  await page.getByText("I'll promote it myself").click();
  await page.getByText("3–5 hours a week").click();
  await shot("7-q6-channels", true);
  await next();

  await shot("8-review", true);
  await next();

  await page.getByText("What would have to be true", { exact: true }).waitFor({ timeout: 20000 });
  await shot("9-results", true);

  await page.goto(`${BASE}/idea/example`);
  await page.getByText("What would have to be true", { exact: true }).waitFor({ timeout: 20000 });
  await shot("10-example-results", true);

  await context.close();
  return errors;
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
let failed = false;
for (const device of ["desktop", "mobile"]) {
  for (const scheme of ["light", "dark"]) {
    const errors = await walk(browser, device, scheme);
    console.log(`${device} ${scheme}: ${errors.length ? `errors: ${errors.join(" | ")}` : "ok"}`);
    if (errors.length) failed = true;
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
