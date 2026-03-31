const viteClient = import("https://localhost:3000/@vite/client");
const pluginModule = () => viteClient.then(() => import("https://localhost:3000/src/index.tsx"));

export function init(context) {
  pluginModule().then(m => m.init(context));
}

export function load() {
  pluginModule().then(m => m.load?.());
}