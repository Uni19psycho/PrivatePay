// src/polyfills.js
// Make Node-style `global` available in the browser for SDKs that expect it.
if (typeof global === "undefined" && typeof window !== "undefined") {
  // eslint-disable-next-line no-global-assign
  window.global = window;
}
