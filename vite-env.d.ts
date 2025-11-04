/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Virtual module declarations
declare module 'virtual:npc-list' {
  export const npcList: string[];
  export const npcPaths: Array<{ id: string; path: string }>;
}
