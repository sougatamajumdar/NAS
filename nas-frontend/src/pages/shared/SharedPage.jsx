import {
  useEffect,
  useRef,
  useState,
} from "react"

import FileGrid from "@/components/files/FileGrid"
import FilePreviewModal from "@/components/files/FilePreviewModal"

import Pagination from "@/components/common/Pagination"

import { Button } from "@/components/ui/button"

import { useFileStore } from "@/store/fileStore"

export default function SharedPage() {

  const {
    sharedNodes,
    sharedByMeNodes,

    fetchSharedNodes,
    fetchSharedByMeNodes,

    fetchDiskStatus,

    sharedPagination,
    sharedByMePagination,
    unshareNode
  } = useFileStore()

  const [activeTab, setActiveTab] =
    useState("shared-with-me")

  const initializedRef =
    useRef(false)

  useEffect(() => {

    if (initializedRef.current)
      return

    initializedRef.current = true

    fetchDiskStatus()
    fetchSharedNodes(1)

  }, [])

  const handleTabChange = async (
    tab
  ) => {

    setActiveTab(tab)

    if (
      tab ===
      "shared-with-me"
    ) {

      await fetchSharedNodes(1)

    } else {

      await fetchSharedByMeNodes(1)
    }
  }

  const handlePageChange =
    async (page) => {

      if (
        activeTab ===
        "shared-with-me"
      ) {

        await fetchSharedNodes(page)

      } else {

        await fetchSharedByMeNodes(page)
      }
    }

  const nodes =
    activeTab ===
    "shared-with-me"
      ? sharedNodes
      : sharedByMeNodes

  const pagination =
    activeTab ===
    "shared-with-me"
      ? sharedPagination
      : sharedByMePagination

  return (

    <div className="space-y-6">

      {/* Header */}
      <div>

        <h1 className="text-3xl font-bold mb-2">
          Shared Files
        </h1>

        <p className="text-zinc-400">
          Manage files shared with you
          and files shared by you
        </p>

      </div>

      {/* Tabs */}
      <div className="flex gap-3">

        <Button
          variant={
            activeTab ===
            "shared-with-me"
              ? "default"
              : "outline"
          }
          onClick={() =>
            handleTabChange(
              "shared-with-me"
            )
          }
        >
          Shared With Me
        </Button>

        <Button
          variant={
            activeTab ===
            "shared-by-me"
              ? "default"
              : "outline"
          }
          onClick={() =>
            handleTabChange(
              "shared-by-me"
            )
          }
        >
          Shared By Me
        </Button>

      </div>

      {/* Files */}
      <FileGrid nodes={nodes} onUnshare={
        activeTab === "shared-by-me"
          ? unshareNode
          : null
      }/>

      {/* Pagination */}
      {pagination.count > 0 && (

        <Pagination
          currentPage={
            pagination.currentPage
          }
          totalPages={
            Math.ceil(
              pagination.count / 20
            )
          }
          onPageChange={
            handlePageChange
          }
        />

      )}

      <FilePreviewModal />

    </div>
  )
}