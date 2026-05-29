import React from "react"
import ReactDOM from "react-dom/client"

import "./index.css"

import router from "@/routes"

import {
  RouterProvider
} from "react-router-dom"

import {
  useAuthStore
} from "@/store/authStore"

import {
  Toaster
} from "@/components/ui/sonner"

import {
  PhotoProvider
} from "react-photo-view"

import ThemeProvider
  from "@/components/providers/ThemeProvider"

import "react-photo-view/dist/react-photo-view.css"

import { useThemeStore }
from "@/store/themeStore"

const savedTheme =
  useThemeStore
    .getState()
    .theme

document.documentElement
  .setAttribute(
    "data-theme",
    savedTheme
  )
  
useAuthStore
  .getState()
  .checkAuth()

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <ThemeProvider>

      <PhotoProvider>

        <RouterProvider
          router={router}
        />

        <Toaster
          richColors
          position="top-right"
        />

      </PhotoProvider>

    </ThemeProvider>

  </React.StrictMode>
)