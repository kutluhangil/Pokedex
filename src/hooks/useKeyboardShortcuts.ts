import { useEffect } from 'react';

type Handler = (e: KeyboardEvent) => void;

export interface Shortcut {
  /** Key combination, e.g. "/", "s", "Escape", "ArrowLeft" */
  key: string;
  /** Whether the shortcut should fire while typing in inputs (default false) */
  allowInInputs?: boolean;
  handler: Handler;
}

const isTyping = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
};

/**
 * Global keyboard shortcut hook.
 * Pass a list of shortcuts; matching keys fire their handler.
 * Skips firing while the user is typing unless allowInInputs=true.
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = isTyping(e.target);
      for (const s of shortcuts) {
        if (typing && !s.allowInInputs) continue;
        // Match either e.key directly or its lowercase
        if (e.key === s.key || e.key.toLowerCase() === s.key.toLowerCase()) {
          s.handler(e);
          break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcuts, enabled]);
}
