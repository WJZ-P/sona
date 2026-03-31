const reactPreamble = import("https://localhost:3000/@react-refresh").then(({ injectIntoGlobalHook }) => {
  injectIntoGlobalHook(window);
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  window.__vite_plugin_react_preamble_installed__ = true;
}).catch(e => {
  console.error("[Sona] Failed to install react preamble:", e);
  throw e;
});
const viteClient = reactPreamble.then(() => import("https://localhost:3000/@vite/client")).catch(e => {
  console.error("[Sona] Failed to load vite client:", e);
  throw e;
});
const pluginModule = () => viteClient.then(() => import("https://localhost:3000/src/index.tsx")).catch(e => {
  console.error("[Sona] Failed to load plugin module:", e);
  throw e;
});

export function init(context) {
//  console.log("[Sona] init called");
  pluginModule().then(m => m.init(context)).catch(e => console.error("[Sona] init error:", e));
}

export function load() {
//  console.log("[Sona] load called");
  pluginModule().then(m => m.load?.()).catch(e => console.error("[Sona] load error:", e));
}