/**
 * Reports what the apply form offers for a branch.
 *
 *   node scripts/_branch_field.js [origin]
 *
 * Confirms the shape of the field per campaign: a dropdown holding exactly the
 * branches that campaign runs at when there are several, a stated branch when
 * there is one, and every office when the form is reached without a campaign.
 */
const { launch, connect, sleep } = require("./_chrome");

const ORIGIN = process.argv[2] || "http://localhost:3300";

const CASES = [
  { label: "no campaign", path: "/join-us#apply" },
  { label: "Final Expense", path: "/join-us?campaign=Final%20Expense#apply" },
  { label: "Medicare", path: "/join-us?campaign=Medicare#apply" },
];

const READ = `(() => {
  const form = document.querySelector(".join-us-form");
  if (!form) return { error: "form not found" };

  const fixed = form.querySelector(".join-us-form__fixed");
  const labels = [...form.querySelectorAll(".join-us-form__label")].map((l) => l.textContent.trim());
  const branchIndex = labels.findIndex((t) => t.toLowerCase().startsWith("branch") || t.toLowerCase().includes("select a branch"));
  const selects = [...form.querySelectorAll("select")];
  const branchSelect = selects.find((s) => [...s.options].some((o) => /office|branch/i.test(o.textContent)) && !/experience/i.test(s.previousSibling?.textContent || ""));

  return {
    fieldLabel: branchIndex === -1 ? null : labels[branchIndex],
    stated: fixed ? fixed.textContent.trim() : null,
    options: branchSelect ? [...branchSelect.options].map((o) => o.textContent.trim()) : null,
    hint: form.querySelector(".join-us-form__hint")?.textContent.replace(/\\s+/g, " ").trim() ?? null,
    positionDisabled: selects.at(-1)?.disabled ?? null,
  };
})()`;

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    for (const testCase of CASES) {
      const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
      await cdp.send("Page.enable", {}, sessionId);
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
      await cdp.send("Page.navigate", { url: ORIGIN + testCase.path }, sessionId);
      await sleep(9000);

      const res = await cdp.send(
        "Runtime.evaluate",
        { expression: READ, returnByValue: true },
        sessionId
      );
      const value = res.result?.value ?? { error: "no result" };

      console.log(`\n${testCase.label}`);
      if (value.error) {
        console.log(`  ${value.error}`);
      } else {
        console.log(`  field         ${value.fieldLabel ?? "-"}`);
        console.log(`  stated        ${value.stated ?? "(none — it is a dropdown)"}`);
        console.log(`  options       ${value.options ? value.options.join(" | ") : "(no dropdown)"}`);
        console.log(`  hint          ${value.hint ?? "-"}`);
        console.log(`  position off  ${value.positionDisabled}`);
      }

      await cdp.send("Target.closeTarget", { targetId });
    }
  } finally {
    cdp.close();
    chrome.stop();
  }
  console.log("");
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
