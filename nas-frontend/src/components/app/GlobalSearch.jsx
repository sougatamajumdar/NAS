import { useState } from "react"

import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"

import { useFileStore } from "@/store/fileStore"

import { useLocation } from "react-router-dom"

export default function GlobalSearch() {

  const location = useLocation()

  const [focused, setFocused] =
    useState(false)

  const searchQuery =
    useFileStore(
      (state) => state.searchQuery
    )

  const setSearchQuery =
    useFileStore(
      (state) => state.setSearchQuery
    )

  const searchNodes =
    useFileStore(
      (state) => state.searchNodes
    )

  const clearSearch =
    useFileStore(
      (state) => state.clearSearch
    )

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

  const handleSearch = (e) => {

    const value = e.target.value

    setSearchQuery(value)

    if (!value.trim()) {

      clearSearch()

      return

    }

    searchNodes(value)

  }

  return (

    <div
      className="
        w-full
        max-w-full
        lg:max-w-2xl
        xl:max-w-3xl
        mx-auto
      "
    >

      <div
        className={`
          relative
          transition-all
          duration-300

          ${
            focused
              ? "scale-[1.01]"
              : ""
          }
        `}
      >

        <Search
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            h-5
            w-5
            text-muted-foreground
            pointer-events-none
          "
        />

        <Input
          value={searchQuery}
          onChange={handleSearch}
          onFocus={() =>
            setFocused(true)
          }
          onBlur={() =>
            setFocused(false)
          }
          placeholder="Search files & folders..."
          className="
            h-11
            md:h-12

            pl-12
            pr-11

            rounded-2xl

            glass
            bg-white/5
            backdrop-blur-xl

            border-white/10

            transition-all
            duration-300

            focus-visible:ring-2
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

              rounded-full

              p-1

              hover:bg-white/10

              transition
            "
          >

            <X
              className="
                h-4
                w-4
              "
            />

          </button>

        )}

      </div>

    </div>

  )

}