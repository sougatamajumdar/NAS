import { Button } from "@/components/ui/button"
import { useFileStore } from "@/store/fileStore"

export default function PaginationBar() {

  const {
    pagination,
    currentFolder,
    searchMode,
    searchQuery,
    fetchNodes,
    searchNodes,
  } = useFileStore()

  const {
    currentPage,
    next,
    previous,
    count,
  } = pagination

  if (count === 0) {
    return null
  }

  const totalPages =
    Math.ceil(count / 20)

  const handlePrev = () => {

    const page =
      currentPage - 1

    if (searchMode) {

      searchNodes(
        searchQuery,
        page
      )

    } else {

      fetchNodes(
        currentFolder,
        page
      )
    }
  }

  const handleNext = () => {

    const page =
      currentPage + 1

    if (searchMode) {

      searchNodes(
        searchQuery,
        page
      )

    } else {

      fetchNodes(
        currentFolder,
        page
      )
    }
  }

  return (

    <div
      className="
        flex
        items-center
        justify-center
        gap-4
        py-6
      "
    >

      <Button
        variant="outline"
        disabled={!previous}
        onClick={handlePrev}
      >
        Previous
      </Button>

      <span
        className="
          text-sm
          text-muted-foreground
        "
      >
        Page {currentPage}
        {" / "}
        {totalPages}
      </span>

      <Button
        variant="outline"
        disabled={!next}
        onClick={handleNext}
      >
        Next
      </Button>

    </div>
  )
}