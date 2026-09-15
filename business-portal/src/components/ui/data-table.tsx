import React from "react";
import { Skeleton } from "./skeleton";
import { EmptyState } from "./empty-state";
import { Pagination } from "./pagination";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  pagination?: {
    page: number;
    totalPages: number;
    totalCount?: number;
    limit?: number;
    onPageChange: (newPage: number) => void;
  };
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription,
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-5 py-4 ${col.className || ""}`}>
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={item.id ?? rowIdx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors hover:bg-slate-50/80 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-5 py-3.5 ${col.className || ""}`}>
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? String(item[col.accessorKey] ?? "-")
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="border-t border-slate-100 bg-slate-50/40">
          <Pagination {...pagination} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}
