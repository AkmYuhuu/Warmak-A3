"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Portal overlay ke <body>: lepas dari stacking context / transform ancestor.
export default function ModalPortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setTarget(document.body); }, []);
  if (!target) return null;
  return createPortal(children, target);
}
