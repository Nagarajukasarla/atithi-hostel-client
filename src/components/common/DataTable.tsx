import React, { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T, index: number) => React.ReactNode);
    sortable?: boolean;
    sortKey?: string;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    emptyTitle?: string;
    emptyDescription?: string;
    onRowClick?: (row: T) => void;
    pageSize?: number;
}

export function DataTable<T extends { id?: string | number }>({
    columns,
    data,
    emptyTitle = "No data found",
    emptyDescription = "There are no records to display here.",
    onRowClick,
    pageSize = 10,
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Handle Sorting
    const handleSort = (column: Column<T>) => {
        if (!column.sortable) return;
        const key = (column.sortKey || String(column.accessor)) as string;

        if (sortField === key) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(key);
            setSortDirection("asc");
        }
    };

    const getSortedData = () => {
        if (!sortField) return data;

        return [...data].sort((a, b) => {
            let aVal: any = a[sortField as keyof T];
            let bVal: any = b[sortField as keyof T];

            if (typeof aVal === "string") {
                aVal = aVal.toLowerCase();
                bVal = (bVal || "").toLowerCase();
            }

            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    };

    const sortedData = getSortedData();

    // Handle Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    if (data.length === 0) {
        return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }

    return (
        <div className="flex flex-col">
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-sm bg-white">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    onClick={() => handleSort(column)}
                                    className={`px-5 py-3.5 border-b border-slate-100 font-bold ${
                                        column.sortable ? "cursor-pointer hover:bg-slate-100/80 select-none" : ""
                                    } ${column.className || ""}`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>{column.header}</span>
                                        {column.sortable && <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                        {paginatedData.map((row, rowIndex) => (
                            <tr
                                key={row.id || rowIndex}
                                onClick={() => onRowClick?.(row)}
                                className={`hover:bg-slate-50/60 transition-colors ${
                                    onRowClick ? "cursor-pointer" : ""
                                }`}
                            >
                                {columns.map((column, colIndex) => {
                                    let content: React.ReactNode;

                                    if (typeof column.accessor === "function") {
                                        content = column.accessor(row, startIndex + rowIndex);
                                    } else {
                                        const value = row[column.accessor];
                                        content = value !== undefined && value !== null ? String(value) : "-";
                                    }

                                    return (
                                        <td
                                            key={colIndex}
                                            className={`px-5 py-3.5 whitespace-nowrap border-b border-slate-100 text-slate-700 ${column.className || ""}`}
                                        >
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4 mt-2">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">
                                Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{" "}
                                <span className="font-semibold text-slate-900">
                                    {Math.min(startIndex + pageSize, data.length)}
                                </span>{" "}
                                of <span className="font-semibold text-slate-900">{data.length}</span> entries
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-xl shadow-sm gap-1">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalPages }).map((_, idx) => {
                                    const pageNumber = idx + 1;
                                    const isCurrent = pageNumber === currentPage;
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={`relative inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${
                                                isCurrent
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
