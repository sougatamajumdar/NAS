// src/components/dashboard/QuickStats.jsx

import {
  File,
  Folder,
  Layers
} from "lucide-react"

import { Card } from "@/components/ui/card"

import { useFileStore } from "@/store/fileStore"

export default function QuickStats() {

  const nodes = useFileStore(
    (state) => state.nodes
  )

  const files = nodes.filter(
    (n) => n.type === "FILE"
  )

  const folders = nodes.filter(
    (n) => n.type === "FOLDER"
  )

  const stats = [
    {
      title: "Files",
      value: files.length,
      icon: File
    },
    {
      title: "Folders",
      value: folders.length,
      icon: Folder
    },
    {
      title: "Items",
      value: nodes.length,
      icon: Layers
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {stats.map((item) => {

        const Icon = item.icon

        return (

          <Card
            key={item.title}
            className= "glass rounded-3xl border-white/10 p-5"
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

                <Icon size={22}/>

              </div>

            </div>

          </Card>
        )
      })}
    </div>
  )
}