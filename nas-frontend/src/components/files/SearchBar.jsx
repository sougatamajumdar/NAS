import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

import { useFileStore } from "@/store/fileStore"

export default function SearchBar() {

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

    <div className="relative max-w-md">

      <Search
        size={18}
        className="
          absolute
          left-3
          top-1/2
          -translate-y-1/2
          text-zinc-500
        "
      />

      <Input
        placeholder="Search files..."
        value={searchQuery}
        onChange={handleSearch}
        className="
          pl-10
          bg-zinc-900
          border-zinc-800
        "
      />

    </div>
  )
}