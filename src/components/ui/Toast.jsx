// Toast's implementation lives in src/contexts/ToastContext.jsx because it needs to be
// triggerable from anywhere in the app (a global `showToast()`), which requires React Context,
// not just a standalone component. This file re-exports it here so it's still discoverable
// alongside the other reusable UI components.
export { useToast, ToastProvider } from "../../contexts/ToastContext.jsx";
