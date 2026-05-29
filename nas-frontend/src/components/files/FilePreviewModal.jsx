import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import { useFileStore }
from "@/store/fileStore"

export default function
FilePreviewModal() {

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

  const isImage =
    previewFile.name.match(
      /\.(jpg|jpeg|png|gif|webp)$/i
    )

  const isPDF =
    previewFile.name.match(/\.pdf$/i)

  return (

    <Dialog
      open={previewOpen}
      onOpenChange={closePreview}
    >

      <DialogContent
        className="
          max-w-5xl
          h-[85vh]
          glass border-white/10
          text-white
        "
      >

        <DialogHeader>

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
            overflow-hidden
            rounded-xl
            bg-black
          "
        >

          {previewLoading && (

            <div
              className="
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

            <img
              src={previewUrl}
              alt={previewFile.name}
              className="
                w-full
                h-full
                object-contain
              "
            />
          )}

          {!previewLoading &&
            !previewError &&
            isPDF && (

            <iframe
              src={previewUrl}
              title={previewFile.name}
              className="w-full h-full"
            />
          )}

          {!previewLoading &&
            !previewError &&
            !isImage &&
            !isPDF && (

            <div
              className="
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