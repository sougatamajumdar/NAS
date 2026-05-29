import {

  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu"

import {

  Avatar,
  AvatarFallback

} from "@/components/ui/avatar"

import {

  Moon,
  Sun,
  LogOut,
  Monitor,
  Sparkles,

} from "lucide-react"

import {

  useAuthStore

} from "@/store/authStore"

import {

  useThemeStore

} from "@/store/themeStore"

const themes = [

  {
    label: "Light",
    value: "light",
    icon: Sun,
  },

  {
    label: "Midnight",
    value: "midnight",
    icon: Moon,
  },

  {
    label: "Cyberpunk",
    value: "cyberpunk",
    icon: Sparkles,
  },

  {
    label: "Ocean",
    value: "ocean",
    icon: Monitor,
  },

  {
    label: "Emerald",
    value: "emerald",
    icon: Monitor,
  },

  {
    label: "AMOLED",
    value: "amoled",
    icon: Moon,
  },
]

export default function UserMenu() {

  const {
    user,
    logout
  } = useAuthStore()

  const {
    theme,
    setTheme
  } = useThemeStore()

  return (

    <DropdownMenu>

      <DropdownMenuTrigger asChild>

        <button
          className="
            h-11
            w-11
            rounded-2xl
            glass
            border
            flex
            items-center
            justify-center
            hover:scale-105
            transition
          "
        >

          <Avatar
            className="
              h-9
              w-9
            "
          >

            <AvatarFallback
              className="
                bg-primary
                text-white
                font-semibold
              "
            >

              {user?.username
                ?.charAt(0)
                ?.toUpperCase()}

            </AvatarFallback>

          </Avatar>

        </button>

      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="
          w-64
          glass
          border
          rounded-2xl
          p-2
        "
      >

        <DropdownMenuLabel
          className="
            flex
            flex-col
            gap-1
          "
        >

          <span className="font-medium">
            {user?.username}
          </span>

          <span
            className="
              text-xs
              opacity-60
            "
          >
            Personal NAS
          </span>

        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="px-2 py-1">

          <p
            className="
              text-xs
              mb-2
              opacity-60
            "
          >
            Themes
          </p>

          <div
            className="
              grid
              grid-cols-2
              gap-2
            "
          >

            {themes.map((item) => {

              const Icon =
                item.icon

              return (

                <button
                  key={item.value}
                  onClick={() =>
                    setTheme(
                      item.value
                    )
                  }
                  className={`
                    rounded-xl
                    border
                    p-2
                    flex
                    items-center
                    gap-2
                    text-sm
                    transition
                    hover:bg-white/5

                    ${
                      theme === item.value
                        ? "bg-primary text-white"
                        : ""
                    }
                  `}
                >

                  <Icon className="h-4 w-4" />

                  {item.label}

                </button>
              )
            })}

          </div>

        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="
            text-red-400
            rounded-xl
            cursor-pointer
          "
        >

          <LogOut
            className="
              mr-2
              h-4
              w-4
            "
          />

          Logout

        </DropdownMenuItem>

      </DropdownMenuContent>

    </DropdownMenu>
  )
}