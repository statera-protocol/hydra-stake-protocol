/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_NETWORK_ID: string;
  readonly VITE_LOGGING_LEVEL: string;
  readonly VITE_INDEXER_URL: string;
  readonly VITE_INDEXER_WS_URL: string;
  readonly VITE_PROOF_SERVER_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
