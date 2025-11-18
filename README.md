# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# erp-sakura

## Database schemas

- Supabase/Postgres (recommended): `supabase/schema-relational.sql`
  - Full schema with RLS policies, realtime publications, views, and RPC functions.
  - Works with the app’s Supabase client and realtime subscriptions out of the box.

- MariaDB/MySQL (minimal fallback): `supabase/schema-mariadb.sql`
  - Minimal tables to support the current relational bridge:
    - `kv_store` (for app-wide key-value state)
    - `penjahit_assignments` (Dropping Penjahit mapping)
    - `design_queue` (design data mirror)
  - No RLS, no realtime, no RPC — you’ll need to adjust the frontend data layer if you run entirely on MariaDB.
  - Use only if you cannot use Supabase/Postgres.

- MariaDB/MySQL (full tables only): `supabase/schema-mariadb-full.sql`
  - Creates all tables referenced by the frontend (tables only; no views/RLS/RPC).
  - Suitable for phpMyAdmin imports. Designed for compatibility (LONGTEXT for JSON, TIMESTAMP for timestamptz).
  - Use this if you want a complete MariaDB schema for data mirroring/analysis without Supabase-specific features.

> Tip: If you see MySQL/MariaDB errors like `#1064 near 'jsonb'` or `timezone('utc', now())`,
> you are likely running the Postgres script on MariaDB. Use the MariaDB script instead.
