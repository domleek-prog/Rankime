import { useEffect } from 'react';

export default function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
      <div className="bg-[#0f1830] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 shadow-xl flex items-start gap-3">
        <span className="text-violet-400 mt-0.5">ℹ</span>
        <span>{message}</span>
        <button onClick={onDismiss} className="ml-auto text-gray-500 hover:text-white shrink-0">✕</button>
      </div>
    </div>
  );
}
