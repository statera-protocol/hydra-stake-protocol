export {};

declare global {
  interface Window {
    midnight?: {
      mnLace?: {
        enable: () => Promise<any>;
        isEnabled: () => Promise<boolean>;
        state: () => Promise<{ address: string }>;
      };
    };
  }
}
