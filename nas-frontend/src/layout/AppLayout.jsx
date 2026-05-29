import { Outlet } from "react-router-dom"

import Sidebar
  from "@/components/app/Sidebar"

import Topbar
  from "@/components/app/Topbar"

import AppBackground
  from "@/components/app/layout/AppBackground"

export default function AppLayout() {

  return (
    <div
      className="
        flex
        h-screen
        overflow-hidden
        bg-background
        text-foreground
      "
    >

      <AppBackground />

      <Sidebar />

      <div
        className="
          flex-1
          flex
          flex-col
          overflow-hidden
        "
      >

        <Topbar />

        <main
          className="
            flex-1
            overflow-auto
            p-6
          "
        >
          <Outlet />
        </main>

      </div>

    </div>
  )
}