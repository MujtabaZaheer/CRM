/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_DEMO_MODE?: string
  readonly VITE_REQUIRE_VERIFIED_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "mammoth" {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
}

declare module "pdfjs-dist/build/pdf.worker.mjs?url" {
  const url: string;
  export default url;
}
