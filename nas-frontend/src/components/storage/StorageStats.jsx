import {
  HardDrive,
  Database,
  FolderOpen,
  File
} from "lucide-react"

import { Card } from "@/components/ui/card"

export default function StorageStats({
  totalFiles,
  totalFolders,
  totalSize,
}) {

  const formatBytes = (bytes) => {

    if (!bytes) {
      return "0 B"
    }

    const sizes = [
      "B",
      "KB",
      "MB",
      "GB",
      "TB"
    ]

    const i = Math.floor(
      Math.log(bytes) / Math.log(1024)
    )

    return (
      (bytes / Math.pow(1024, i))
      .toFixed(2) +
      " " +
      sizes[i]
    )
  }

  const stats = [
    {
      title: "Total Storage",
      value: formatBytes(totalSize),
      icon: HardDrive
    },
    {
      title: "Files",
      value: totalFiles,
      icon: File
    },
    {
      title: "Folders",
      value: totalFolders,
      icon: FolderOpen
    },
    {
      title: "Items",
      value: totalFiles + totalFolders,
      icon: Database
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

      {stats.map((item) => {

        const Icon = item.icon

        return (
          <Card
            key={item.title}
            className="bg-zinc-900 border-zinc-800 p-5"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-zinc-400 text-sm">
                  {item.title}
                </p>

                <h2 className="text-2xl font-bold mt-2">
                  {item.value}
                </h2>

              </div>

              <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center">

                <Icon size={22} />

              </div>

            </div>

          </Card>
        )
      })}
    </div>
  )
}