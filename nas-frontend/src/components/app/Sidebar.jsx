import { Link, useLocation }
from "react-router-dom"

import {
  Folder,
  Share2,
  HardDrive,
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
        lg:flex
        w-72
        shrink-0
        flex-col
        glass
        border-r
        border-white/5
      "
    >

      {/* LOGO */}

      <div
        className="
          px-5
          py-6
          border-b
          border-white/5
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
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
              shadow-lg
            "
          >

            <Sparkles
              className="
                h-6
                w-6
              "
            />

          </div>

          <div>

            <h1
              className="
                font-bold
                text-xl
              "
            >
              NAS OS
            </h1>

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

      </div>

      {/* NAVIGATION */}

      <nav
        className="
          flex-1
          px-4
          py-6
          space-y-2
          overflow-y-auto
        "
      >

        {items.map((item) => {

          const Icon =
            item.icon

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
                  x: 4,
                }}

                whileTap={{
                  scale: 0.98,
                }}

                transition={{
                  duration: 0.15,
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

                <Icon
                  className="
                    h-5
                    w-5
                    shrink-0
                  "
                />

                <span
                  className="
                    font-medium
                  "
                >
                  {item.name}
                </span>

              </motion.div>

            </Link>

          )

        })}

      </nav>

      {/* FOOTER */}

      <div
        className="
          border-t
          border-white/5
          p-4
        "
      >

        <div
          className="
            rounded-2xl
            glass
            border
            border-white/5
            p-4
          "
        >

          <p
            className="
              text-sm
              font-medium
            "
          >
            NAS OS
          </p>

          <p
            className="
              text-xs
              text-muted-foreground
              mt-1
            "
          >
            Secure Personal Storage
          </p>

        </div>

      </div>

    </aside>

  )

}