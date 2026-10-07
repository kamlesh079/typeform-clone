"use client";
import { useEffect } from "react";
export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-ink px-5 py-3 text-sm text-white shadow-xl">
      {message}
    </div>
  );
}
