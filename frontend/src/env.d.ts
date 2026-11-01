/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// The installed TypeScript's DOM lib predates these members of <dialog>.
interface HTMLDialogElement {
  open: boolean;
  showModal(): void;
  close(returnValue?: string): void;
}
