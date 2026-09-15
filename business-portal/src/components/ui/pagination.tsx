import React from "react";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount?: number;
  limit?: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalCount,
  limit = 15,
  onPageChange,
  isLoading = false,
}) => {
  const startItem = (page - 1) * limit + 1;
  const endItem = totalCount ? Math.min(page * limit, totalCount) : page * limit;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      <div className="text-xs text-slate-500">
        {totalCount !== undefined ? (
          <>
            Showing <span className="font-semibold text-slate-700">{startItem}</span> to{" "}
            <span className="font-semibold text-slate-700">{endItem}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalCount}</span> entries
          </>
        ) : (
          <>
            Page <span className="font-semibold text-slate-700">{page}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalPages || 1}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <span className="px-2 text-xs font-medium text-slate-600">
          {page} / {Math.max(totalPages, 1)}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || totalPages === 0 || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
