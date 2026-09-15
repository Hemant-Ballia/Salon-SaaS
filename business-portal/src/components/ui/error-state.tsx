import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load data",
  message,
  description,
  onRetry,
}) => {
  const displayMsg = description || message || "An error occurred while communicating with the backend API.";
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-rose-600 max-w-sm">{displayMsg}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};