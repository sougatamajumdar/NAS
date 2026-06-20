export const getPageInfo = (
  currentUrl,
  previousUrl,
  nextUrl,
  count,
  pageSize = 10
) => {

  let currentPage = 1

  if (currentUrl) {

    const params =
      new URL(
        currentUrl,
        window.location.origin
      )

    currentPage =
      Number(
        params.searchParams.get("page")
      ) || 1
  }

  else if (nextUrl) {

    const params =
      new URL(
        nextUrl,
        window.location.origin
      )

    currentPage =
      Number(
        params.searchParams.get("page")
      ) - 1
  }

  else if (previousUrl) {

    const params =
      new URL(
        previousUrl,
        window.location.origin
      )

    currentPage =
      Number(
        params.searchParams.get("page")
      ) + 1
  }

  const totalPages =
    Math.ceil(
      count / pageSize
    )

  return {
    currentPage,
    totalPages,
  }
}