import React from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Search...", ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs transition-all",
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              if (onClear) onClear();
            }}
            className="absolute right-3 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";