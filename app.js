const STORAGE_KEY = "qwik.cognigyEndpointConfigUrl";

export function parseInfoBody(event) {
  const info = event?.info ?? event;
  let body = info?.body ?? info?.request?.body ?? event?.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return null; }
  }
  return body && typeof body === "object" ? body : null;
}

export function unwrapData(payload) {
  let current = payload;
  for (let i = 0; i < 3; i += 1) {
    if (!current || typeof current !== "object" || !current.data || typeof current.data !== "object") break;
    current = current.data;
  }
  return current;
}

export function getXappUrl(payload) {
  const candidates = [];
  let current = payload;
  for (let i = 0; i < 4 && current && typeof current === "object"; i += 1) {
    candidates.push(current.xAppUrl, current.xappUrl, current.url);
    current = current.data;
  }
  const found = candidates.find((value) => typeof value === "string" && /^https:\/\//i.test(value));
  return found || null;
}

export function isCancellationMessage(payload) {
  const data = unwrapData(payload);
  return data?.type === "xapp" && (data?.action === "show" || data?.show === true);
}

export function isValidEndpointUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname.length > 1;
  } catch {
    return false;
  }
}

function setupPage() {
  const settingsButton = document.querySelector("#settings-button");
  const settingsDialog = document.querySelector("#settings-dialog");
  const settingsForm = document.querySelector("#settings-form");
  const endpointInput = document.querySelector("#endpoint-url");
  const clearButton = document.querySelector("#clear-settings");
  const errorText = document.querySelector("#settings-error");
  const status = document.querySelector("#connection-status");
  const placeholder = document.querySelector("#widget-placeholder");
  const companion = document.querySelector("#companion-panel");
  const xappLink = document.querySelector("#xapp-link");

  const setStatus = (text, state) => {
    status.textContent = text;
    status.dataset.state = state;
  };

  const showXapp = (url) => {
    if (!/^https:\/\//i.test(url)) return;
    xappLink.href = url;
    companion.hidden = false;
    companion.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const handleInfo = (event) => {
    if (event?.originator && event.originator !== "remote") return;
    const payload = parseInfoBody(event);
    if (!payload || !isCancellationMessage(payload)) return;
    const url = getXappUrl(payload);
    if (url) showXapp(url);
  };

  const connect = async (endpointUrl) => {
    if (!endpointUrl) {
      setStatus("Not connected", "pending");
      settingsDialog.showModal();
      return;
    }
    if (typeof window.initWebRTCWidget !== "function") {
      setStatus("Widget unavailable", "error");
      placeholder.textContent = "The Cognigy Click-to-Call library could not be loaded. Check the network connection and reload this page.";
      return;
    }
    try {
      setStatus("Connecting", "pending");
      const widget = await window.initWebRTCWidget(endpointUrl);
      placeholder.hidden = true;
      setStatus("Ready to call", "connected");
      widget.on("newRTCSession", (session) => {
        companion.hidden = true;
        session.on("newInfo", handleInfo);
        const reset = () => { companion.hidden = true; };
        session.on("ended", reset);
        session.on("terminated", reset);
      });
    } catch (error) {
      console.error("Click-to-Call initialization failed", error);
      setStatus("Connection failed", "error");
      placeholder.textContent = "The Voice Gateway Endpoint could not be initialized. Open Connection settings and verify the configuration URL.";
    }
  };

  settingsButton.addEventListener("click", () => {
    endpointInput.value = localStorage.getItem(STORAGE_KEY) || "";
    errorText.hidden = true;
    settingsDialog.showModal();
  });

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = endpointInput.value.trim();
    if (!isValidEndpointUrl(value)) {
      errorText.textContent = "Enter a complete HTTPS Endpoint configuration URL.";
      errorText.hidden = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, value);
    settingsDialog.close();
    location.reload();
  });

  clearButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    endpointInput.value = "";
    errorText.hidden = true;
  });

  const query = new URLSearchParams(location.search);
  if (query.get("demo") === "1") {
    setStatus("Demo mode", "connected");
    placeholder.textContent = "Demo mode simulates the message sent by the Cognigy Flow.";
    handleInfo({
      originator: "remote",
      info: { body: JSON.stringify({ data: { type: "xapp", action: "show", xAppUrl: "https://example.com/cancellation-confirmation" } }) }
    });
    return;
  }

  const configuredEndpoint = typeof window.QWIK_COGNIGY_ENDPOINT === "string"
    ? window.QWIK_COGNIGY_ENDPOINT.trim()
    : "";
  connect(configuredEndpoint || localStorage.getItem(STORAGE_KEY));
}

if (typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", setupPage);
}
