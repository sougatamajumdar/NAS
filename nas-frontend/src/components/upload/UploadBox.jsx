import { useDropzone } from "react-dropzone"

import {
  Upload,
  Plus
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { useFileStore } from "@/store/fileStore"

import { toast } from "sonner"

export default function UploadBox({
  compact = false
}) {

  const uploadFile =
    useFileStore(
      (state) => state.uploadFile
    )

  const currentFolder =
    useFileStore(
      (state) => state.currentFolder
    )

  const validateDiskOperation =
    useFileStore(
      (state) =>
        state.validateDiskOperation
    )
  const get = useFileStore.getState

  const onDrop = async (
    acceptedFiles
  ) => {
    const validation =
      await validateDiskOperation({
        operation: "upload",
        fileSize: acceptedFiles.reduce(
          (sum, file) => sum + file.size,
          0
        )
      })

    if (!validation.valid) {

      toast.error(
        validation.error
      )

      return
    }

    for (const file of acceptedFiles) {

      get().uploadFile(
        file,
        currentFolder
      )
    }
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop,
    multiple: true
  })
  
  // COMPACT MODE
  if (compact) {

    return (

      <div {...getRootProps()}>

        <input {...getInputProps()} />

        <Button
          className="
            h-11
            rounded-2xl
            px-5
            gap-2
            shadow-lg
          "
        >

          <Plus size={18} />

          Upload

        </Button>

      </div>
    )
  }

  return (

    <div
      {...getRootProps()}
      className={`
        rounded-3xl
        border-2
        border-dashed
        p-12
        text-center
        transition-all
        cursor-pointer
        glass
        ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-white/10"
        }
      `}
    >

      <input {...getInputProps()} />

      <div
        className="
          mx-auto
          h-20
          w-20
          rounded-3xl
          bg-primary/10
          flex
          items-center
          justify-center
          mb-5
        "
      >

        <Upload
          className="
            h-10
            w-10
            text-primary
          "
        />

      </div>

      <h3 className="text-xl font-semibold">
        Upload Files
      </h3>

      <p className="text-muted-foreground mt-2">
        Drag and drop files anywhere
      </p>

    </div>
  )
}