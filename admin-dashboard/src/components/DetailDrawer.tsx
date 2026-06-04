import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./ui";

type Props = {
  title: string;
  subtitle?: string;
  open: boolean;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function DetailDrawer({ title, subtitle, open, wide = false, onClose, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm">
      <button className="absolute inset-0 cursor-default" aria-label="Close detail drawer" onClick={onClose} />
      <aside className={wide ? "relative h-full w-full max-w-4xl overflow-y-auto border-l border-border bg-white p-7 shadow-soft" : "relative h-full w-full max-w-xl overflow-y-auto border-l border-border bg-white p-7 shadow-soft"}>
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm font-bold text-gray-500">{subtitle}</p> : null}
          </div>
          <Button className="bg-gray-100 p-3 text-gray-700" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function DetailGrid({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <div className="divide-y divide-gray-100 rounded-[20px] border border-border">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-5 px-5 py-4">
          <span className="text-sm font-extrabold text-gray-500">{label}</span>
          <span className="max-w-[60%] text-right text-sm font-black text-ink">{value}</span>
        </div>
      ))}
    </div>
  );
}
