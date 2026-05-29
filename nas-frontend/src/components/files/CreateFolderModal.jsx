import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { FolderPlus } from "lucide-react"

import { useFileStore } from "@/store/fileStore"

export default function CreateFolderModal() {

  const {
    createFolder,
    currentFolder
  } = useFileStore()

  const [open, setOpen] = useState(false)

  const [name, setName] = useState("")

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState("")

  const handleCreate = async () => {

    if (!name.trim()) {
      return
    }

    setLoading(true)

    setError("")

    const result = await createFolder({
      name,
      parent_id: currentFolder
    })

    if (result.success) {

      setName("")

      setOpen(false)

    } else {

      setError(
        result.error?.non_field_errors?.[0] ||
        "Failed to create folder"
      )
    }

    setLoading(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >

      <DialogTrigger asChild>

        <Button className="gap-2">
          <FolderPlus size={18} />
          New Folder
        </Button>

      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">

        <DialogHeader>

          <DialogTitle>
            Create Folder
          </DialogTitle>

        </DialogHeader>

        <div className="space-y-4">

          <Input
            placeholder="Folder name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-zinc-800 border-zinc-700"
          />

          {error && (
            <div className="text-sm text-red-400">
              {error}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create Folder"
            }
          </Button>

        </div>

      </DialogContent>

    </Dialog>
  )
}