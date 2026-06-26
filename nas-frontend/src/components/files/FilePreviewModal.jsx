import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import { useFileStore }
from "@/store/fileStore"

export default function FilePreviewModal() {

  const {
    previewOpen,
    previewFile,
    previewUrl,
    previewLoading,
    previewError,
    closePreview,
  } = useFileStore()

  if (!previewFile) {
    return null
  }

  const mime =
    previewFile.mime_type || ""
  console.log("mimetype:", mime)
  const isImage =
    mime.startsWith("image/")

  const isVideo =
    mime.startsWith("video/")

  const isPDF =
    mime === "application/pdf"

  return (
    <Dialog
      open={previewOpen}
      onOpenChange={closePreview}
    >
      <DialogContent
        className="
          max-w-7xl
          w-[95vw]
          h-[92vh]
          p-0
          overflow-hidden
          border-white/10
          bg-zinc-950
          text-white
          flex
          flex-col
        "
      >

        <DialogHeader
          className="
            px-6
            py-4
            border-b
            border-white/10
            shrink-0
          "
        >
          <DialogTitle>
            {previewFile.name}
          </DialogTitle>

          <DialogDescription>
            File preview
          </DialogDescription>
        </DialogHeader>

        <div
          className="
            flex-1
            min-h-0
            bg-black
          "
        >

          {previewLoading && (
            <div
              className="
                w-full
                h-full
                flex
                items-center
                justify-center
              "
            >
              Loading preview...
            </div>
          )}

          {previewError && (
            <div
              className="
                w-full
                h-full
                flex
                items-center
                justify-center
                text-red-400
              "
            >
              {previewError}
            </div>
          )}

          {!previewLoading &&
            !previewError &&
            isImage && (
              <div
                className="
                  w-full
                  h-full
                  flex
                  items-center
                  justify-center
                "
              >
                <img
                  src={previewUrl}
                  alt={previewFile.name}
                  className="
                    max-w-full
                    max-h-full
                    object-contain
                  "
                />
              </div>
            )}

          {!previewLoading &&
            !previewError &&
            isPDF && (
              <iframe
                src={previewUrl}
                title={previewFile.name}
                className="
                  w-full
                  h-full
                  border-0
                "
              />
            )}

          {!previewLoading &&
            !previewError &&
            isVideo && (
              <div
                className="
                  w-full
                  h-full
                  flex
                  items-center
                  justify-center
                  bg-black
                "
              >
                <video
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="
                    max-w-full
                    max-h-full
                  "
                >
                  <source
                    src={previewUrl}
                    type={mime}
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

          {!previewLoading &&
            !previewError &&
            !isImage &&
            !isPDF &&
            !isVideo && (
              <div
                className="
                  w-full
                  h-full
                  flex
                  items-center
                  justify-center
                  text-zinc-400
                "
              >
                Preview not supported
              </div>
            )}

        </div>

      </DialogContent>
    </Dialog>
  )
}