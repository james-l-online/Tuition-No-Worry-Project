"use client";

import { ITEM_PER_PAGE } from "@/lib/settings";
import { useRouter } from "next/navigation";

const Pagination = ({ page, count }: { page: number; count: number }) => {
  const router = useRouter();

  const hasPrev = ITEM_PER_PAGE * (page - 1) > 0;
  const hasNext = ITEM_PER_PAGE * (page - 1) + ITEM_PER_PAGE < count;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };
  const totalPages = Math.max(1, Math.ceil(count / ITEM_PER_PAGE));
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  const pages: number[] = [];
  for (let p = startPage; p <= endPage; p++) pages.push(p);

  return (
    <div className="p-4 flex items-center justify-center text-gray-500">
      <div className="flex items-center gap-2 text-sm">
        <button
          disabled={!hasPrev}
          className="py-2 px-3 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => changePage(page - 1)}
        >
          Prev
        </button>

        {/* If there's a gap between 1 and startPage, show 1 and ellipsis */}
        {startPage > 1 && (
          <>
            <button
              className={`px-2 rounded-sm ${page === 1 ? "bg-lamaSky" : ""}`}
              onClick={() => changePage(1)}
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">…</span>}
          </>
        )}

        {pages.map((pg) => (
          <button
            key={pg}
            className={`px-3 py-1 rounded-sm ${page === pg ? "bg-lamaSky text-white" : ""}`}
            onClick={() => changePage(pg)}
          >
            {pg}
          </button>
        ))}

        {/* If there's a gap between endPage and totalPages, show ellipsis and last page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">…</span>}
            <button
              className={`px-2 rounded-sm ${page === totalPages ? "bg-lamaSky" : ""}`}
              onClick={() => changePage(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          className="py-2 px-3 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!hasNext}
          onClick={() => changePage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
