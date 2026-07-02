import { Link, useLocation } from "react-router-dom"

import {
  Folder,
  Share2,
  HardDrive,
  Shield,
  Sparkles,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

import { useUIStore } from "@/store/uiStore"

const items = [
  {
    name: "My Drive",
    icon: Folder,
    path: "/drive",
  },
  {
    name: "Shared",
    icon: Share2,
    path: "/shared",
  },
  {
    name: "Storage",
    icon: HardDrive,
    path: "/storage",
  },
  {
    name: "Admin",
    icon: Shield,
    path: "/admin",
  },
]

export default function MobileSidebar() {

  const location = useLocation()

  const {
    sidebarOpen,
    closeSidebar,
  } = useUIStore()

  return (

    <Sheet
      open={sidebarOpen}
      onOpenChange={(open) => {

        if (!open) {

          closeSidebar()

        }

      }}
    >

      <SheetContent
        side="left"
        className="
          w-72
          p-0
          glass
          border-r
          border-white/10
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
            px-6
            py-6
            border-b
            border-white/10
          "
        >

          <div
            className="
              h-12
              w-12
              rounded-2xl
              bg-primary
              flex
              items-center
              justify-center
              text-white
            "
          >

            <Sparkles />

          </div>

          <div>

            <h2
              className="
                font-bold
                text-lg
              "
            >
              NAS OS
            </h2>

            <p
              className="
                text-xs
                text-muted-foreground
              "
            >
              Personal Cloud
            </p>

          </div>

        </div>

        <nav
          className="
            p-4
            space-y-2
          "
        >

          {items.map((item) => {

            const Icon = item.icon

            const active =
              location.pathname.startsWith(
                item.path
              )

            return (

              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
              >

                <div
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    px-4
                    py-3
                    transition-all

                    ${
                      active

                        ? `
                          bg-primary
                          text-primary-foreground
                        `

                        : `
                          hover:bg-white/5
                        `
                    }
                  `}
                >

                  <Icon className="h-5 w-5" />

                  <span>

                    {item.name}

                  </span>

                </div>

              </Link>

            )

          })}

        </nav>

      </SheetContent>

    </Sheet>

  )

}