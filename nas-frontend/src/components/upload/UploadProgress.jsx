import { Progress } from "@/components/ui/progress"

import {
  Pause,
  Play,
  X
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { useFileStore } from "@/store/fileStore"

export default function UploadProgress() {

  const uploads =
    useFileStore(
      (state) => state.uploads
    )

  const pauseUpload =
    useFileStore(
      (state) => state.pauseUpload
    )

  const resumeUpload =
    useFileStore(
      (state) => state.resumeUpload
    )

  const cancelUpload =
    useFileStore(
      (state) => state.cancelUpload
    )

  if (!uploads.length) {
    return null
  }

  function formatSpeed(speed) {

    if (!speed) return "0 KB/s"

    if (speed > 1024 * 1024) {
      return `${(
        speed /
        1024 /
        1024
      ).toFixed(2)} MB/s`
    }

    return `${(
      speed / 1024
    ).toFixed(2)} KB/s`
  }

  function formatRemaining(
      seconds
    ) {

      if (!seconds || !isFinite(seconds)) {
        return "--"
      }

      if (seconds < 60) {
        return `${Math.round(seconds)}s`
      }

      const mins =
        Math.floor(seconds / 60)

      const secs =
        Math.round(seconds % 60)

      return `${mins}m ${secs}s`
   }

  return (

    <div className="space-y-4">

      {uploads.map((upload) => (

        <div
          key={upload.localId}
          className="
            glass
            rounded-2xl
            p-4
            border
            border-white/10
          "
        >

          <div className="flex justify-between">

            <div>

              <h4 className="font-medium">
                {upload.name}
              </h4>
              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                {(
                  upload.size /
                  1024 /
                  1024
                ).toFixed(2)}
                MB
              </p>
              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                {upload.status}
              </p>

            </div>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              {upload.status ===
                "uploading" && (

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    pauseUpload(
                      upload.localId
                    )
                  }
                >
                  <Pause size={16} />
                </Button>
              )}

              {upload.status ===
                "paused" && (

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    resumeUpload(
                      upload.localId
                    )
                  }
                >
                  <Play size={16} />
                </Button>
              )}

              <Button
                size="icon"
                variant="destructive"
                onClick={() =>
                  cancelUpload(
                    upload.localId
                  )
                }
              >
                <X size={16} />
              </Button>

            </div>

          </div>

          <Progress
            value={upload.progress}
            className="mt-3"
          />

          <div
            className="
              mt-2
              flex
              justify-between
              text-xs
              text-muted-foreground
            "
          >

            <span>
              {upload.progress}%
            </span>

            <span>
              {upload.uploadedChunks}/
              {upload.totalChunks}
            </span>

          </div>

          <div
            className="
              mt-1
              flex
              justify-between
              text-xs
              text-muted-foreground
            "
          >

            <span>
              {formatSpeed(upload.speed)}
            </span>

            <span>
             {formatRemaining(
                upload.remaining
              )}
            </span>

          </div>

        </div>
      ))}

    </div>
  )
}