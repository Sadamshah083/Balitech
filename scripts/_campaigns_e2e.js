/**
 * Drives the real campaigns admin screen through add, edit and delete.
 *
 *   node scripts/_campaigns_e2e.js [url]
 *
 * Written because the reported faults were invisible from the code alone: the
 * form opened off-screen on a scrolled table, `window.confirm` can stop
 * returning true for the rest of a session, and every rejected request was
 * swallowed by a bare `if (res.ok)`. Those only show up by actually clicking
 * the buttons, so this asserts on the DOM the way a person would read it.
 *
 * Safe to run: DATABASE_URL points at localhost, and the row it creates is
 * inactive, uniquely named, and deleted by the last step.
 */
const fs = require("node:fs");
const path = require("node:path");
const { launch, connect, sleep } = require("./_chrome");

const BASE = process.argv[2] || "http://127.0.0.1:3200";
const TITLE = `ZZ E2E Campaign ${Date.now()}`;
const EDITED = `${TITLE} (edited)`;

function readEnv() {
  const file = path.join(__dirname, "..", ".env");
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/* React listens on its own value descriptor, so assigning `.value` alone does
   not update state. This is the standard native-setter escape hatch. */
const REACT_SET = `
function reactSet(el, value) {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}`;

/* A real pointer click focuses the button it hits; a bare `.click()` does not.
   Without the focus step the dialog has no prior element to hand focus back to,
   which looks like a bug in the dialog rather than in the harness. */
const CLICK = `function hit(el) { el.focus(); el.click(); }`;

/* The dialog holds several checkboxes now that a campaign can name more than
   one branch, so neither the branches nor the Active toggle can be reached as
   "the checkbox" any more. */
const CONTROLS = `
function branchBoxes(dialog) {
  return [...dialog.querySelectorAll(".admin-branch-picker__option")].map((label) => ({
    name: label.textContent.trim(),
    box: label.querySelector('input[type="checkbox"]'),
  }));
}
function checkedBranches(dialog) {
  return branchBoxes(dialog).filter((b) => b.box.checked).map((b) => b.name);
}
function activeBox(dialog) {
  return [...dialog.querySelectorAll('input[type="checkbox"]')].find((cb) =>
    (cb.closest("label")?.textContent || "").includes("Active")
  );
}
function setBranches(dialog, names) {
  for (const { name, box } of branchBoxes(dialog)) {
    if (box.checked !== names.includes(name)) box.click();
  }
}`;

const TWO_BRANCHES = ["Iran Road Office", "Commercial Office"];

let passes = 0;
let failures = 0;

function check(label, ok, detail = "") {
  if (ok) passes++;
  else failures++;
  console.log(`   ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

(async () => {
  const env = readEnv();
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD missing from .env");
  }

  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    /* Without this the new tab stays in the background, where rAF callbacks and
       animations are paused — the page would sit on its loading state. */
    await cdp.send("Page.bringToFront", {}, sessionId);

    const evaluate = async (expression, awaitPromise = false) => {
      const { result, exceptionDetails } = await cdp.send(
        "Runtime.evaluate",
        { expression, returnByValue: true, awaitPromise },
        sessionId
      );
      if (exceptionDetails) {
        throw new Error(exceptionDetails.exception?.description || "eval failed");
      }
      return result.value;
    };

    /** Polls until `expression` is truthy, so we never race the network. */
    const waitFor = async (expression, label, timeout = 90000) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (await evaluate(`Boolean(${expression})`)) return true;
        await sleep(250);
      }

      /* A bare timeout says nothing useful when a dev build is still compiling
         or the page bounced to the login screen. */
      const state = await evaluate(`JSON.stringify({
        url: location.pathname,
        title: document.title,
        rows: document.querySelectorAll("table tbody tr").length,
        text: document.body.innerText.slice(0, 300),
      })`);
      throw new Error(`timed out waiting for ${label}\n   page state: ${state}`);
    };

    console.log(`\n${BASE}/admin/campaigns\n`);

    /* Warms the route so the first dev-mode compile is not inside a timeout. */
    await cdp.send("Page.navigate", { url: `${BASE}/admin/login` }, sessionId);
    await sleep(2500);

    const login = await evaluate(
      `fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(${JSON.stringify({
          email: env.ADMIN_EMAIL,
          password: env.ADMIN_PASSWORD,
        })}),
      }).then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.ok && body.token) sessionStorage.setItem("balitech_admin_jwt", body.token);
        return { status: r.status, ok: r.ok, error: body.error || null };
      })`,
      true
    );
    check("signed in as admin", login.ok, login.error || `HTTP ${login.status}`);
    if (!login.ok) throw new Error("cannot continue without a session");

    await cdp.send("Page.navigate", { url: `${BASE}/admin/campaigns` }, sessionId);
    await waitFor(`document.querySelector("table tbody tr")`, "campaigns table");

    const rowsBefore = await evaluate(
      `document.querySelectorAll("table tbody tr").length`
    );
    console.log(`   (${rowsBefore} existing campaigns)\n`);

    /* ── Add ── */
    console.log("Add Campaign");
    await evaluate(
      `(() => { ${CLICK} hit([...document.querySelectorAll("button")].find((b) => b.textContent.includes("Add Campaign"))); })()`
    );
    await sleep(400);

    const dialog = await evaluate(`(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return null;
      return {
        modal: d.getAttribute("aria-modal"),
        title: d.querySelector(".admin-modal__title")?.textContent || "",
        labelled: Boolean(d.getAttribute("aria-labelledby")),
        focusInside: d.contains(document.activeElement),
        centred: (() => {
          const r = d.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= innerHeight + 1;
        })(),
        fields: d.querySelectorAll("input, select, textarea").length,
        unlabelled: [...d.querySelectorAll("input, select, textarea")].filter(
          (el) => !el.labels?.length && !el.getAttribute("aria-label")
        ).length,
      };
    })()`);

    check("a dialog opens", dialog !== null);
    check("marked aria-modal", dialog?.modal === "true");
    check("titled 'New Campaign'", dialog?.title === "New Campaign", dialog?.title);
    check("has an accessible name", Boolean(dialog?.labelled));
    check("focus moved into the dialog", Boolean(dialog?.focusInside));
    check("panel sits inside the viewport", Boolean(dialog?.centred));
    check("every field has a label", dialog?.unlabelled === 0, `${dialog?.unlabelled} without`);

    check(
      "one branch is preselected",
      (await evaluate(
        `(() => { ${CONTROLS} return checkedBranches(document.querySelector('[role="dialog"]')).length; })()`
      )) === 1
    );

    await evaluate(`(() => {
      ${REACT_SET}
      ${CONTROLS}
      const d = document.querySelector('[role="dialog"]');
      reactSet(d.querySelector('input[type="text"]'), ${JSON.stringify(TITLE)});
      reactSet(d.querySelector("textarea"), "Created by the end-to-end check.");
      setBranches(d, ${JSON.stringify(TWO_BRANCHES)});
      const active = activeBox(d);
      if (active.checked) active.click();
    })()`);

    const picked = await evaluate(
      `(() => { ${CONTROLS} return checkedBranches(document.querySelector('[role="dialog"]')); })()`
    );
    check(
      "two branches can be selected at once",
      [...picked].sort().join(" | ") === [...TWO_BRANCHES].sort().join(" | "),
      picked.join(", ")
    );

    await evaluate(
      `(() => { ${CLICK} hit([...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === "Create")); })()`
    );

    await waitFor(
      `[...document.querySelectorAll("table tbody tr")].some((tr) => tr.textContent.includes(${JSON.stringify(TITLE)}))`,
      "the new row"
    );
    check("row appears in the table", true);
    check(
      "dialog closed after saving",
      (await evaluate(`document.querySelector('[role="dialog"]') === null`))
    );
    check(
      "saved as Hidden (checkbox respected)",
      await evaluate(
        `[...document.querySelectorAll("table tbody tr")]
          .find((tr) => tr.textContent.includes(${JSON.stringify(TITLE)}))
          .textContent.includes("Hidden")`
      )
    );

    const rowBranches = await evaluate(
      `[...document.querySelectorAll("table tbody tr")]
        .find((tr) => tr.textContent.includes(${JSON.stringify(TITLE)}))
        .children[2].getAttribute("title")`
    );
    check(
      "both branches saved on the row",
      TWO_BRANCHES.every((b) => (rowBranches || "").includes(b)),
      rowBranches
    );

    /* ── Edit ── */
    console.log("\nEdit");
    await evaluate(`(() => {
      ${CLICK}
      const row = [...document.querySelectorAll("table tbody tr")]
        .find((tr) => tr.textContent.includes(${JSON.stringify(TITLE)}));
      row.scrollIntoView({ block: "center" });
      hit(row.querySelector('button[aria-label^="Edit"]'));
    })()`);
    await sleep(400);

    const editDialog = await evaluate(`(() => {
      ${CONTROLS}
      const d = document.querySelector('[role="dialog"]');
      if (!d) return null;
      return {
        title: d.querySelector(".admin-modal__title")?.textContent || "",
        value: d.querySelector('input[type="text"]')?.value || "",
        activeChecked: activeBox(d)?.checked,
        branches: checkedBranches(d),
      };
    })()`);

    check("edit opens a dialog", editDialog !== null);
    check("titled 'Edit Campaign'", editDialog?.title === "Edit Campaign", editDialog?.title);
    check("prefilled with the row's title", editDialog?.value === TITLE, editDialog?.value);
    check("prefilled with the row's status", editDialog?.activeChecked === false);
    check(
      "prefilled with the row's branches",
      [...(editDialog?.branches ?? [])].sort().join(" | ") ===
        [...TWO_BRANCHES].sort().join(" | "),
      (editDialog?.branches ?? []).join(", ")
    );

    /* A campaign at no branch cannot be applied to, and checkboxes cannot say
       "required" the way the select they replaced could. */
    await evaluate(
      `(() => { ${CONTROLS} setBranches(document.querySelector('[role="dialog"]'), []); })()`
    );
    await evaluate(
      `(() => { ${CLICK} hit([...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === "Update")); })()`
    );
    await sleep(600);
    check(
      "refuses to save with no branch",
      await evaluate(
        `Boolean(document.querySelector('[role="dialog"]')) &&
         (document.querySelector('[role="dialog"] .admin-modal__error')?.textContent || "").includes("branch")`
      ),
      await evaluate(
        `document.querySelector('[role="dialog"] .admin-modal__error')?.textContent || "no error shown"`
      )
    );

    await evaluate(`(() => {
      ${REACT_SET}
      ${CONTROLS}
      const d = document.querySelector('[role="dialog"]');
      reactSet(d.querySelector('input[type="text"]'), ${JSON.stringify(EDITED)});
      setBranches(d, ["Commercial Office"]);
    })()`);
    await evaluate(
      `(() => { ${CLICK} hit([...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === "Update")); })()`
    );

    await waitFor(
      `[...document.querySelectorAll("table tbody tr")].some((tr) => tr.textContent.includes(${JSON.stringify(EDITED)}))`,
      "the edited row"
    );
    check("edit persisted to the table", true);

    const narrowed = await evaluate(
      `[...document.querySelectorAll("table tbody tr")]
        .find((tr) => tr.textContent.includes(${JSON.stringify(EDITED)}))
        .children[2].getAttribute("title")`
    );
    check(
      "dropping a branch persisted too",
      narrowed === "Commercial Office",
      narrowed
    );

    /* Escape must close without saving — the old inline form had no way out. */
    await evaluate(`(() => {
      ${CLICK}
      const row = [...document.querySelectorAll("table tbody tr")]
        .find((tr) => tr.textContent.includes(${JSON.stringify(EDITED)}));
      hit(row.querySelector('button[aria-label^="Edit"]'));
    })()`);
    await sleep(300);
    await cdp.send(
      "Input.dispatchKeyEvent",
      { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 },
      sessionId
    );
    await sleep(300);
    check(
      "Escape closes the dialog",
      await evaluate(`document.querySelector('[role="dialog"]') === null`)
    );
    check(
      "focus returned to the Edit button",
      await evaluate(
        `(document.activeElement?.getAttribute("aria-label") || "").startsWith("Edit")`
      ),
      await evaluate(`document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName`)
    );

    /* ── Delete ── */
    console.log("\nDelete");

    /* If the component still used window.confirm this would suppress it, which
       is exactly the state a browser gets into after repeated prompts. */
    await evaluate(`window.confirm = () => false; window.__confirmCalled = false;`);

    await evaluate(`(() => {
      ${CLICK}
      const row = [...document.querySelectorAll("table tbody tr")]
        .find((tr) => tr.textContent.includes(${JSON.stringify(EDITED)}));
      hit(row.querySelector('button[aria-label^="Delete"]'));
    })()`);
    await sleep(400);

    const confirmDialog = await evaluate(`(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return null;
      return {
        title: d.querySelector(".admin-modal__title")?.textContent || "",
        mentionsRow: d.textContent.includes(${JSON.stringify(EDITED)}),
        hasDelete: [...d.querySelectorAll("button")].some(
          (b) => b.textContent.trim() === "Delete"
        ),
      };
    })()`);

    check("in-app confirm appears (not window.confirm)", confirmDialog !== null);
    check("names the campaign being deleted", Boolean(confirmDialog?.mentionsRow));
    check("offers a Delete action", Boolean(confirmDialog?.hasDelete));

    await evaluate(
      `(() => { ${CLICK} hit([...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === "Delete")); })()`
    );

    await waitFor(
      `![...document.querySelectorAll("table tbody tr")].some((tr) => tr.textContent.includes(${JSON.stringify(EDITED)}))`,
      "the row to disappear"
    );
    check("row removed from the table", true);
    check(
      "confirm dialog closed",
      await evaluate(`document.querySelector('[role="dialog"]') === null`)
    );

    /* Proves it left the database, not just the client state. */
    const stillThere = await evaluate(
      `fetch("/api/campaigns", {
        headers: { Authorization: "Bearer " + sessionStorage.getItem("balitech_admin_jwt") },
      })
        .then((r) => r.json())
        .then((d) => d.campaigns.some((c) => c.title.startsWith("ZZ E2E Campaign")))`,
      true
    );
    check("deleted server-side, not just locally", stillThere === false);

    const rowsAfter = await evaluate(
      `document.querySelectorAll("table tbody tr").length`
    );
    check("table back to its original size", rowsAfter === rowsBefore, `${rowsBefore} -> ${rowsAfter}`);

    console.log(`\n${failures === 0 ? "ALL PASS" : "FAILURES"}: ${passes} passed, ${failures} failed\n`);
    process.exitCode = failures === 0 ? 0 : 1;
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((error) => {
  console.error(`\nERROR: ${error.message || error}\n`);
  process.exit(1);
});
