import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"

import { useFileStore } from "@/store/fileStore"

import { useLocation } from "react-router-dom"

export default function GlobalSearch() {

  const location = useLocation()

  const searchQuery = useFileStore(
    (state) => state.searchQuery
  )

  const setSearchQuery = useFileStore(
    (state) => state.setSearchQuery
  )

  const searchNodes = useFileStore(
    (state) => state.searchNodes
  )

  const clearSearch = useFileStore(
    (state) => state.clearSearch
  )

  // ONLY SHOW IN THESE PAGES
  const allowedRoutes = [
    "/drive",
    "/shared",
    "/storage",
    "/admin",
  ]

  const shouldShow =
    allowedRoutes.some((route) =>
      location.pathname.startsWith(route)
    )

  if (!shouldShow) {
    return null
  }

  const handleSearch = async (e) => {

    const value = e.target.value

    setSearchQuery(value)

    if (!value.trim()) {

      clearSearch()

      return
    }

    searchNodes(value)
  }

  return (

    <div className="relative w-full max-w-xl">

      <Search
        size={18}
        className="
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          text-muted-foreground
        "
      />

      <Input
        placeholder="Search files, folders"
        value={searchQuery}
        onChange={handleSearch}
        className="
          pl-11
          pr-10
          h-11
          rounded-2xl
          glass
          border-white/10
          bg-white/5
          backdrop-blur-xl
          focus-visible:ring-1
          focus-visible:ring-primary
        "
      />

      {searchQuery && (

        <button
          onClick={clearSearch}
          className="
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-muted-foreground
            hover:text-foreground
          "
        >

          <X size={16} />

        </button>
      )}

    </div>
  )
}