import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useThemeStore = create(

  persist(

    (set) => ({

      theme: "midnight",

      setTheme: (theme) => {

        document.documentElement
          .setAttribute(
            "data-theme",
            theme
          )

        set({ theme })
      },
    }),

    {
      name: "theme-store",
    }
  )
)