import {
  Bell,
  Command,
  HardDrive,
  Menu,
} from "lucide-react"

import { useLocation } from "react-router-dom"

import UserMenu from "./UserMenu"

import GlobalSearch from "./GlobalSearch"

import { useUIStore } from "@/store/uiStore"

export default function Topbar() {

  const location = useLocation()

  const openSidebar =
    useUIStore(
      (state) => state.openSidebar
    )

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
        shrink-0
        border-b
        border-white/5
        glass
      "
    >

      {/* TOP ROW */}

      <div
        className="
          h-16
          lg:h-20
          px-4
          md:px-6
          flex
          items-center
          justify-between
          gap-3
        "
      >

        {/* LEFT */}

        <div
          className="
            flex
            items-center
            gap-3
            min-w-0
            flex-1
          "
        >

          {/* MOBILE MENU */}

          <button
            onClick={openSidebar}
            className="
              lg:hidden
              h-10
              w-10
              rounded-xl
              glass
              border
              border-white/10
              flex
              items-center
              justify-center
              hover:bg-white/10
              transition
              shrink-0
            "
          >

            <Menu className="h-5 w-5" />

          </button>

          {/* ICON */}

          <div
            className="
              hidden
              sm:flex
              h-10
              w-10
              lg:h-11
              lg:w-11
              rounded-2xl
              bg-primary/20
              border
              border-primary/30
              items-center
              justify-center
              shrink-0
            "
          >

            <HardDrive
              className="
                h-5
                w-5
                text-primary
              "
            />

          </div>

          {/* TITLE */}

          <div
            className="
              min-w-0
            "
          >

            <h1
              className="
                text-lg
                lg:text-xl
                font-semibold
                truncate
              "
            >
              {currentTitle}
            </h1>

            <p
              className="
                hidden
                md:block
                text-sm
                text-muted-foreground
              "
            >
              Futuristic NAS Storage System
            </p>

          </div>

        </div>

        {/* RIGHT */}

        <div
          className="
            flex
            items-center
            gap-2
            shrink-0
          "
        >

          {/* Notification */}

          <button
            className="
              hidden
              sm:flex
              h-10
              w-10
              lg:h-11
              lg:w-11
              rounded-2xl
              glass
              border
              border-white/10
              items-center
              justify-center
              hover:bg-white/10
              transition
            "
          >

            <Bell className="h-5 w-5" />

          </button>

          {/* Shortcut */}

          <button
            className="
              hidden
              xl:flex
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

      </div>

      {/* SEARCH */}

      <div
        className="
          px-4
          md:px-6
          pb-4
          lg:pb-5
        "
      >

        <GlobalSearch />

      </div>

    </header>

  )

}