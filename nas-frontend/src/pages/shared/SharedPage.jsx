import { useEffect, useRef } from "react"

import FileGrid from "@/components/files/FileGrid"

import { useFileStore } from "@/store/fileStore"
import FilePreviewModal from "@/components/files/FilePreviewModal"

export default function SharedPage() {

  const {
    sharedNodes,
    fetchSharedNodes,
    fetchDiskStatus
  } = useFileStore()

  const initializedRef = useRef(false)

  useEffect(() => {

    if (initializedRef.current) return

    initializedRef.current = true
    fetchDiskStatus()
    fetchSharedNodes()

  }, [])

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold mb-2">
          Shared With Me
        </h1>

        <p className="text-zinc-400">
          Files shared by other users
        </p>

      </div>

      <FileGrid nodes={sharedNodes} />
      <FilePreviewModal />
    </div>
  )
}