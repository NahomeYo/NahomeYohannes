(function () {
  const body = document.body;
  const sourcePath = body.dataset.source;
  const outputEl = document.getElementById("exampleBox");
  const codeEl = document.getElementById("codeBox");
  const noteEl = document.getElementById("algorithm-note");
  const logs = [];

  function formatValue(value) {
    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  function renderLogs() {
    if (!outputEl) {
      return;
    }

    if (logs.length === 0) {
      outputEl.textContent = "No console output captured on this page.";
      outputEl.classList.add("algorithm-empty");
      return;
    }

    outputEl.textContent = logs.join("\n");
    outputEl.classList.remove("algorithm-empty");
  }

  function patchConsole() {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = function (...args) {
      logs.push(args.map(formatValue).join(" "));
      originalLog.apply(console, args);
    };

    console.error = function (...args) {
      logs.push("ERROR: " + args.map(formatValue).join(" "));
      originalError.apply(console, args);
    };

    window.addEventListener("error", (event) => {
      logs.push("ERROR: " + event.message);
      renderLogs();
    });
  }

  async function renderSource() {
    if (!sourcePath || !codeEl) {
      return;
    }

    const response = await fetch(sourcePath);
    const source = await response.text();
    codeEl.textContent = source;
  }

  patchConsole();

  window.addEventListener("DOMContentLoaded", async () => {
    await renderSource();
    renderLogs();

    if (noteEl && body.dataset.runtime === "python") {
      noteEl.textContent = "This page displays the Python source exactly as written. It is not executed in the browser.";
    }
  });
})();
