import {
  Bell,
  Command,
  HardDrive,
} from "lucide-react"

import UserMenu from "./UserMenu"

import GlobalSearch from "./GlobalSearch"

import { useLocation } from "react-router-dom"

export default function Topbar() {

  const location = useLocation()

  const titles = {
    "/drive": "My Drive",
    "/shared": "Shared Files",
    "/storage": "Storage Analytics",
    "/admin": "Admin Dashboard",
  }

  const currentTitle =
    Object.entries(titles).find(
      ([path]) =>
        location.pathname.startsWith(path)
    )?.[1] || "NAS"

  return (

    <header
      className="
        h-20
        border-b
        border-white/5
        glass
        px-6
        flex
        items-center
        justify-between
        gap-6
        shrink-0
      "
    >

      {/* LEFT */}
      <div className="flex items-center gap-4 min-w-0">

        <div
          className="
            h-11
            w-11
            rounded-2xl
            bg-primary/20
            border
            border-primary/30
            flex
            items-center
            justify-center
            shrink-0
          "
        >

          <HardDrive className="h-5 w-5 text-primary" />

        </div>

        <div className="min-w-0">

          <h1
            className="
              text-xl
              font-semibold
              truncate
            "
          >
            {currentTitle}
          </h1>

          <p
            className="
              text-sm
              text-muted-foreground
            "
          >
            Futuristic NAS Storage System
          </p>

        </div>

      </div>

      {/* CENTER */}
      <div className="flex-1 flex justify-center px-4">

        <GlobalSearch />

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        <button
          className="
            h-11
            w-11
            rounded-2xl
            glass
            border
            border-white/10
            flex
            items-center
            justify-center
            hover:bg-white/10
            transition
          "
        >

          <Bell className="h-5 w-5" />

        </button>

        <button
          className="
            hidden
            lg:flex
            items-center
            gap-2
            px-4
            h-11
            rounded-2xl
            glass
            border
            border-white/10
            text-sm
            text-muted-foreground
          "
        >

          <Command className="h-4 w-4" />

          CTRL + K

        </button>

        <UserMenu />

      </div>

    </header>
  )
}