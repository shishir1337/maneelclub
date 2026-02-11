import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 5; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis")
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
      <div className="text-sm text-muted-foreground">
        {totalItems !== undefined && itemsPerPage !== undefined ? (
          <>
            Showing{" "}
            <span className="font-medium text-foreground">
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-medium text-foreground">{totalItems}</span>{" "}
            orders
          </>
        ) : (
          <>
            Page <span className="font-medium text-foreground">{currentPage}</span>{" "}
            of <span className="font-medium text-foreground">{totalPages}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 w-9 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        {pageNumbers.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <Button
                key={`ellipsis-${index}`}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                disabled
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More pages</span>
              </Button>
            )
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className={cn(
                "h-9 w-9 p-0",
                currentPage === page && "pointer-events-none"
              )}
            >
              {page}
            </Button>
          )
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="h-9 w-9 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  )
}
