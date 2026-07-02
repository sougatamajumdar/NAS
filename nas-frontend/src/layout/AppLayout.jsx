import { Outlet } from "react-router-dom"

import Sidebar from "@/components/app/Sidebar"

import MobileSidebar from "@/components/app/MobileSidebar"

import Topbar from "@/components/app/Topbar"

import AppBackground from "@/components/app/layout/AppBackground"

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

      {/* Desktop Sidebar */}

      <Sidebar />

      {/* Mobile Drawer */}

      <MobileSidebar />

      <div
        className="
          flex-1
          flex
          flex-col
          min-w-0
          overflow-hidden
        "
      >

        <Topbar />

        <main
          className="
            flex-1
            overflow-auto
            p-3
            sm:p-4
            md:p-6
          "
        >

          <Outlet />

        </main>

      </div>

    </div>

  )

}