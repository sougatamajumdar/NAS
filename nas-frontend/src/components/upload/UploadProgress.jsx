import { Progress } from "@/components/ui/progress"

import { useFileStore } from "@/store/fileStore"

export default function UploadProgress() {

  const {
    uploads
  } = useFileStore()

  // const uploads = Object.entries(uploads)

  if (!uploads.length) {
    return null
  }

  return (
    <div className="space-y-4">

      {uploads.map((upload) => (

        <div
          key={upload.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
        >

          <div className="flex justify-between mb-2">

            <div>

              <p className="text-sm">
                {upload.name}
              </p>

              <p className="text-xs text-zinc-500">
                {upload.status}
              </p>

            </div>

            <span className="text-sm text-zinc-400">
              {upload.progress}%
            </span>

          </div>

          <Progress value={upload.progress} />

        </div>
      ))}

    </div>
  )
}