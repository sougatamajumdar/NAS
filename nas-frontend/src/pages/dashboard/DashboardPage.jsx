import { useEffect, useRef } from "react"

import FileGrid from "@/components/files/FileGrid"
import Breadcrumbs from "@/components/files/Breadcrumbs"
import FilePreviewModal from "@/components/files/FilePreviewModal"
import QuickStats from "@/components/dashboard/QuickStats"
import FileActions from "@/components/files/FileActions"
import UploadProgress from "@/components/upload/UploadProgress"
import { useFileStore } from "@/store/fileStore"


export default function DashboardPage() {

  const nodes = useFileStore(
    (state) => state.nodes
  )

  const fetchNodes = useFileStore(
    (state) => state.fetchNodes
  )

  const searchQuery = useFileStore(
    (state) => state.searchQuery
  )

  const fetchDiskStatus = useFileStore(
    (state) => state.fetchDiskStatus
  )

  const fileLoading = useFileStore(
    (state) => state.fileLoading
  )

  const initializedRef = useRef(false)

  useEffect(() => {

    if (initializedRef.current) return

    initializedRef.current = true

    fetchDiskStatus()

    const currentFolder =
      useFileStore.getState().currentFolder

    fetchNodes(currentFolder)

  }, [])

  return (

    <div
      className="
        h-full
        overflow-auto
        px-4
        md:px-6
        py-5
        space-y-6
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          flex-col
          xl:flex-row
          xl:items-center
          xl:justify-between
          gap-5
        "
      >

        <div>

          <h1
            className="
              text-3xl
              md:text-4xl
              font-bold
              tracking-tight
            "
          >
            My Drive
          </h1>

          <p
            className="
              text-muted-foreground
              mt-2
            "
          >
            Secure futuristic cloud storage
          </p>

        </div>

        <FileActions />

      </div>

      {/* BREADCRUMBS */}
      {!searchQuery && (
        <Breadcrumbs />
      )}

      {/* STATS */}
      <QuickStats />

      {/* UPLOADS */}
      <UploadProgress />

      {/* FILES */}
      {fileLoading ? (

        <div
          className="
            glass
            rounded-3xl
            p-10
            text-center
            text-muted-foreground
          "
        >
          Loading files...
        </div>

      ) : (

        <FileGrid nodes={nodes} />

      )}

      <FilePreviewModal />

    </div>
  )
}