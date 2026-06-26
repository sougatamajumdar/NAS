import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Download,
  Eye,
  File,
  Folder,
  Share2,
  Trash2,
  UserMinus,
  PlayCircle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { useFileStore } from "@/store/fileStore"
import ShareModal from "./ShareModal"
import { useState } from "react"
import { toast } from "sonner"


export default function FileCard({ node, onUnshare = null }) {
  // console.log("Rendering FileCard for node:", node)
  const {
    fetchNodes,
    deleteNode,
    openPreview,
    downloadFile,
    validateDiskOperation,
  } = useFileStore()

  const [shareOpen, setShareOpen] =
    useState(false)

  const isFolder =
    node.type === "FOLDER"

  const handleOpen = () => {

    if (node.type !== "FOLDER") {
      return
    }

    const currentStack =
      useFileStore.getState().folderStack

    const existingIndex =
      currentStack.findIndex(
        (item) => item.id === node.id
      )

    let newStack = []

    if (existingIndex !== -1) {

      newStack =
        currentStack.slice(
          0,
          existingIndex + 1
        )

    } else {

      newStack = [
        ...currentStack,
        node
      ]
    }

    useFileStore.setState({
      folderStack: newStack
    })

    fetchNodes(node.id, 1)
  }

  // ======================
  // PREVIEW
  // ======================
  const handlePreview = async (
    e
  ) => {

    e.stopPropagation()

    const validation =
      await validateDiskOperation({
        node,
        operation: "preview",
      })
    
    if (!validation.valid) {

      toast.error(
        validation.error
      )

      return
    }

    openPreview(node)
  }

  // ======================
  // DOWNLOAD
  // ======================
  const handleDownload = async (
    e
  ) => {

    e.stopPropagation()

    const validation =
      await validateDiskOperation({
        node,
        operation: "download",
      })

    if (!validation.valid) {

      toast.error(
        validation.error
      )

      return
    }

    downloadFile(node)
  }

  // ======================
  // DELETE
  // ======================
  const handleDelete = async (
    e
  ) => {

    e.stopPropagation()

    const validation =
      await validateDiskOperation({
        node,
        operation: "delete",
      })

    if (!validation.valid) {

      toast.error(
        validation.error
      )

      return
    }

    deleteNode(node.id)
  }

  // ======================
  // SHARE
  // ======================
  const handleShare = async () => {

    const validation =
      await validateDiskOperation({
        node,
        operation: "share",
      })

    if (!validation.valid) {

      toast.error(
        validation.error
      )

      return
    }

    setShareOpen(true)
  }

  const handleUnshare = async (e) => {
    e.stopPropagation()

    if (!onUnshare) return

    await onUnshare(node)
  }

  const isImage =
    node.mime_type?.startsWith(
      "image/"
    )
  
  const isVideo =
    node.mime_type?.startsWith(
      "video/"
    )

  return (
    <>
      <div>

        <ContextMenu>

          <ContextMenuTrigger>

            <Card
              onClick={handleOpen}
              className="
                group
                relative
                overflow-hidden
                rounded-3xl
                border
                border-white/10
                bg-white/3
                backdrop-blur-xl
                hover:border-primary/30
                hover:bg-white/5
                transition-all
                duration-300
                cursor-pointer
                p-4
              "
            >
             <div className="aspect-4/3 relative overflow-hidden">
                {isImage ? (
                <img
                src={node.thumbnail_url}
                alt={node.name}
                loading="lazy"
                decoding="async"
                className="
                  w-full
                  h-full
                  object-cover
                  group-hover:scale-105
                  transition-transform
                  duration-500
                "
              />

                ) : (

                  <div
                    className="
                      w-full
                      h-full
                      flex
                      items-center
                      justify-center
                      bg-gradient-to-br
                      from-primary/20
                      to-transparent
                    "
                  >
                {isVideo && (
                  <video
                    className="
                      absolute
                      inset-0
                      flex
                      items-center
                      justify-center
                      pointer-events-none
                    "
                    poster={node.thumbnail_url}
                  >
                    <PlayCircle
                      className="
                        h-12
                        w-12
                        text-white/80
                      "
                    />
                  </video>
                )}
                {isFolder ? (
                  <Folder className="h-16 w-16 text-primary" />
                ) : (
                  <File className="h-16 w-16 text-primary" />
                )}

                  </div>
                )}

                {/* ACTIONS */}
                <div
                  className="
                    absolute
                    top-3
                    right-3
                    opacity-0
                    group-hover:opacity-100
                    transition
                    flex
                    gap-2
                  "
                >

                  {!isFolder && (
                    <>
                      <button
                        onClick={handlePreview}
                        className="
                          h-9
                          w-9
                          rounded-xl
                          glass
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={handleDownload}
                        className="
                          h-9
                          w-9
                          rounded-xl
                          glass
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Download size={16} />
                      </button>
                    </>
                  )}
                  {
                    onUnshare ? (

                      <button
                        onClick={handleUnshare}
                        className="
                          h-9
                          w-9
                          rounded-xl
                          glass
                          flex
                          items-center
                          justify-center
                          text-orange-400
                        "
                      >
                        <UserMinus size={16} />
                      </button>

                    ) : (

                      <button
                        onClick={handleShare}
                        className="
                          h-9
                          w-9
                          rounded-xl
                          glass
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Share2 size={16} />
                      </button>

                    )
                  }
                  <button
                    onClick={handleDelete}
                    className="
                      h-9
                      w-9
                      rounded-xl
                      glass
                      flex
                      items-center
                      justify-center
                      text-red-400
                    "
                  >
                    <Trash2 size={16} />
                  </button>

                </div>

              </div>

              <div className="p-4">

                <h3
                  className="
                    font-medium
                    truncate
                  "
                >
                  {node.name}
                </h3>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    mt-2
                    text-xs
                    text-muted-foreground
                  "
                >

                  <span>{node.type}</span>

                  {!isFolder && (
                    <span>
                      {(node.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}

                </div>

              </div>

            </Card>

          </ContextMenuTrigger>

          <ContextMenuContent
            className="
              bg-zinc-900
              border-zinc-800
              text-white
            "
          >

            {!isFolder && (

              <>
                <ContextMenuItem
                  onClick={() =>
                    handlePreview({
                      stopPropagation: () => {}
                    })
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() =>
                    handleDownload({
                      stopPropagation: () => {}
                    })
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </ContextMenuItem>
              </>
            )}

            {
              onUnshare ? (

                <ContextMenuItem
                  onClick={() =>
                    onUnshare(node)
                  }
                  className="text-orange-400"
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove Access
                </ContextMenuItem>

              ) : (

                <ContextMenuItem
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </ContextMenuItem>

              )
            }

            <ContextMenuItem
              onClick={() =>
                handleDelete({
                  stopPropagation: () => {}
                })
              }
              className="text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>

          </ContextMenuContent>

        </ContextMenu>

      </div>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        node={node}
      />
    </>
  )
}