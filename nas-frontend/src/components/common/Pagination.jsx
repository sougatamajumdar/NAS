export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {

  if (totalPages <= 1) {
    return null
  }

  const pages = []

  let start =
    Math.max(
      1,
      currentPage - 2
    )

  let end =
    Math.min(
      totalPages,
      currentPage + 2
    )

  for (
    let i = start;
    i <= end;
    i++
  ) {
    pages.push(i)
  }

  return (

    <div
      className="
        flex
        items-center
        justify-between
        mt-6
        flex-wrap
        gap-3
      "
    >

      <button
        disabled={currentPage === 1}
        onClick={() =>
          onPageChange(
            currentPage - 1
          )
        }
        className="
          px-4
          py-2
          rounded-xl
          border
          border-white/10
          disabled:opacity-40
        "
      >
        Previous
      </button>

      <div className="flex gap-2">

        {pages.map((page) => (

          <button
            key={page}
            onClick={() =>
              onPageChange(page)
            }
            className={`
              h-10
              min-w-10
              px-3
              rounded-xl
              border
              transition
              ${
                currentPage === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-white/10 hover:bg-white/5"
              }
            `}
          >
            {page}
          </button>

        ))}

      </div>

      <button
        disabled={
          currentPage === totalPages
        }
        onClick={() =>
          onPageChange(
            currentPage + 1
          )
        }
        className="
          px-4
          py-2
          rounded-xl
          border
          border-white/10
          disabled:opacity-40
        "
      >
        Next
      </button>

    </div>
  )
}