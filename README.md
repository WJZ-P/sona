# 🎵 Sona

A League of Legends client plugin built with **React + Vite** for [Pengu Loader](https://pengu.lol/).

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 6
- **Language**: TypeScript
- **Plugin Loader**: Pengu Loader v1.1.0+

## Project Structure

```
sona/
├── src/
│   ├── lib/             # Utility libraries
│   │   ├── lcu.ts       # LCU API request helpers
│   │   └── hooks.ts     # React custom hooks
│   ├── styles/          # CSS stylesheets
│   │   ├── index.css    # Global styles
│   │   └── App.css      # App component styles
│   ├── App.tsx          # Main application component
│   ├── index.tsx        # Plugin entry point (init/load)
│   └── vite-env.d.ts   # Vite type declarations
├── assets/              # Static assets (images, etc.)
├── pengu.d.ts           # PenguLoader API type declarations
├── index.html           # Vite dev entry
├── package.json
├── tsconfig.json
└── vite.config.ts       # Vite config with Pengu Loader adapters
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) (recommended) or npm
- [Pengu Loader](https://pengu.lol/) installed

### Configuration

Edit `package.json` > `config` to match your setup:

```json
{
  "config": {
    "pluginName": "sona",
    "loaderPath": "../../"
  }
}
```

- `pluginName`: The folder name in Pengu Loader's `plugins/` directory
- `loaderPath`: Relative path to your Pengu Loader root directory

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

This starts a Vite dev server with HTTPS and HMR. A dev entry `index.js` will be auto-generated in the Pengu Loader plugins directory. Launch the League Client to see your changes in real-time.

### Build

```bash
pnpm build
```

This builds the plugin and copies the output to the Pengu Loader plugins directory. The built plugin can be used without the dev server.

## Plugin Entry Points

The plugin exports two functions recognized by Pengu Loader:

- **`init(context)`** - Called before the League Client initializes. Use for early hooks (RCP, socket).
- **`load()`** - Called after the window is loaded. Safe for DOM manipulation.

## LCU API

Use the built-in helper to interact with the League Client API:

```typescript
import { lcuGet, lcuPost } from '@/lib/lcu'

// Get current summoner
const summoner = await lcuGet('/lol-summoner/v1/current-summoner')

// Or use React hooks
import { useCurrentSummoner } from '@/lib/hooks'

function MyComponent() {
  const { data: summoner, loading } = useCurrentSummoner()
  // ...
}
```

## License

[AGPL-3.0](./LICENSE)
