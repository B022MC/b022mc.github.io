"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle size={18} />
      </div>
      <h3 className="mb-2 text-base font-semibold">{title}</h3>
      <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
        >
          <RefreshCcw size={14} />
          重试
        </button>
      )}
    </div>
  );
}
