import { Link, useLocation }
from "react-router-dom"

import {
  HardDrive,
  Folder,
  Share2,
  Shield,
  Sparkles,
} from "lucide-react"

import { motion }
from "framer-motion"

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

export default function Sidebar() {

  const location =
    useLocation()

  return (
    <aside
      className="
        hidden
        md:flex
        w-72
        shrink-0
        flex-col
        glass
        border-r
        border-white/5
        p-4
      "
    >

      <div
        className="
          flex
          items-center
          gap-3
          px-3
          py-4
        "
      >

        <div
          className="
            h-12
            w-12
            rounded-2xl
            bg-primary
            text-primary-foreground
            flex
            items-center
            justify-center
          "
        >
          <Sparkles />
        </div>

        <div>
          <h1 className="font-bold text-xl">
            NAS OS
          </h1>

          <p className="text-xs text-muted-foreground">
            Personal Cloud
          </p>
        </div>

      </div>

      <div className="mt-6 space-y-2">

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
            >

              <motion.div
                whileHover={{
                  x: 4
                }}
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  px-4
                  py-3
                  transition-all
                  duration-300
                  ${
                    active
                      ? `
                        bg-primary
                        text-primary-foreground
                        shadow-lg
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

              </motion.div>

            </Link>
          )
        })}
      </div>

    </aside>
  )
}