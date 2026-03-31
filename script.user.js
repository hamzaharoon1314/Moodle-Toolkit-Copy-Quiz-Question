// ==UserScript==
// @name         Moodle Toolkit – Copy Quiz Question
// @namespace    https://github.com/hamzaharoon1314
// @version      2.0.0
// @description  Enables right-click, bypasses restrictions, and copies quiz questions instantly to clipboard. Designed for students who want speed and control.
// @author       Hamza Haroon
// @match        https://learn.*.edu.tr/mod/quiz/*
// @match        https://learn.*.edu.tr/*
// @match        https://learn.khas.edu.tr/*
// @match        *://*/mod/quiz/*
// @match        *://*/mod/quiz/view.php*
// @match        *://*/mod/quiz/attempt.php*
// @match        *://*/mod/quiz/review.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=edu.tr
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/hamzaharoon1314/Moodle-Toolkit-Copy-Quiz-Question
// @updateURL    https://github.com/hamzaharoon1314/Moodle-Toolkit-Copy-Quiz-Question/raw/main/script.user.js
// @downloadURL  https://github.com/hamzaharoon1314/Moodle-Toolkit-Copy-Quiz-Question/raw/main/script.user.js
// ==/UserScript==

(function () {
  "use strict";

  /* ─── Allow right-click ─────────────────────────────────────────── */
  document.addEventListener(
    "contextmenu",
    (e) => { e.returnValue = true; e.stopPropagation?.(); },
    true
  );

  /* ─── Find quiz content ──────────────────────────────────────────── */
  const content = document.querySelector('form > div > div > div[class="content"]');
  if (!content) return console.warn("[Moodle Copy] Content element not found.");

  /* ─── Inject styles ──────────────────────────────────────────────── */
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

    #mc-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 2147483647;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      white-space: nowrap;
      line-height: 1;

      padding: 11px 18px;
      border: none;
      border-radius: 12px;
      cursor: pointer;

      font-family: 'DM Mono', monospace;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.03em;
      color: #f0ede8;

      background: #18181b;
      box-shadow: 0 2px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset;

      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease;
      user-select: none;
      -webkit-user-select: none;
    }

    #mc-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.09) inset;
      background: #222226;
    }

    #mc-btn:active {
      transform: translateY(0px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    #mc-btn.mc-copied {
      color: #a1f4c0;
    }

    #mc-btn svg {
      flex-shrink: 0;
      display: block;
    }

    /* ── toast ── */
    #mc-toast {
      position: fixed;
      bottom: 82px;
      right: 28px;
      z-index: 2147483647;

      padding: 8px 14px;
      border-radius: 8px;
      background: #27272a;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);

      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: #a1f4c0;
      letter-spacing: 0.04em;
      white-space: nowrap;

      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.22s ease, transform 0.22s ease;
      pointer-events: none;
    }

    #mc-toast.mc-visible {
      opacity: 1;
      transform: translateY(0);
    }

    #mc-toast.mc-error {
      color: #f4a1a1;
    }
  `;
  document.head.appendChild(style);

  /* ─── SVG icons ──────────────────────────────────────────────────── */
  const ICON_COPY = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 2H3.5C2.67 2 2 2.67 2 3.5v8C2 12.33 2.67 13 3.5 13h8c.83 0 1.5-.67 1.5-1.5V10"
      stroke="#a0a0a8" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="5.5" y="1.5" width="8" height="8" rx="1.5"
      stroke="currentColor" stroke-width="1.4"/>
  </svg>`;

  const ICON_CHECK = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 7.5L6.5 11L12 4.5"
      stroke="#a1f4c0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  /* ─── Build button ───────────────────────────────────────────────── */
  const btn = document.createElement("button");
  btn.id = "mc-btn";

  const icon = document.createElement("span");
  icon.innerHTML = ICON_COPY;

  const label = document.createElement("span");
  label.textContent = "copy question";

  btn.appendChild(icon);
  btn.appendChild(label);
  document.body.appendChild(btn);

  /* ─── Build toast ────────────────────────────────────────────────── */
  const toast = document.createElement("div");
  toast.id = "mc-toast";
  document.body.appendChild(toast);

  let toastTimer = null;
  let btnTimer = null;

  function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = isError ? "mc-error mc-visible" : "mc-visible";
    toastTimer = setTimeout(() => {
      toast.classList.remove("mc-visible", "mc-error");
    }, 2200);
  }

  function flashButton() {
    clearTimeout(btnTimer);
    icon.innerHTML = ICON_CHECK;
    label.textContent = "copied!";
    btn.classList.add("mc-copied");
    btnTimer = setTimeout(() => {
      icon.innerHTML = ICON_COPY;
      label.textContent = "copy question";
      btn.classList.remove("mc-copied");
    }, 2200);
  }

  /* ─── Copy logic (with execCommand fallback) ─────────────────────── */
  function copyToClipboard(text) {
    if (navigator.clipboard?.write) {
      const item = new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
      });
      navigator.clipboard.write([item])
        .then(() => { flashButton(); showToast("✓ copied to clipboard"); })
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
    document.body.appendChild(ta);
    ta.select();
    try {
      const ok = document.execCommand("copy");
      if (ok) { flashButton(); showToast("✓ copied to clipboard"); }
      else showToast("✗ copy failed", true);
    } catch {
      showToast("✗ copy failed", true);
    } finally {
      document.body.removeChild(ta);
    }
  }

  btn.addEventListener("click", () => copyToClipboard(content.innerText));
})();
