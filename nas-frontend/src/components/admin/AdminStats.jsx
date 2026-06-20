import {
  Users,
  FolderOpen,
  FileText,
  HardDrive
} from "lucide-react"

import { Card } from "@/components/ui/card"

export default function AdminStats({
  stats
}) {

  const items = [
    {
      title: "Users",
      value: stats?.users || 0,
      icon: Users,
    },
    {
      title: "Files",
      value: stats?.files || 0,
      icon: FileText,
    },
    {
      title: "Folders",
      value: stats?.folders || 0,
      icon: FolderOpen,
    },
    {
      title: "Active Disks",
      value: stats?.active_disks || 0,
      icon: HardDrive,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {items.map((item) => {

        const Icon = item.icon

        return (
          <Card
            key={item.title}
            className="
              glass
              border-white/10
              rounded-3xl
              p-6
            "
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-muted-foreground">
                  {item.title}
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  {item.value}
                </h2>

              </div>

              <div
                className="
                  h-14
                  w-14
                  rounded-2xl
                  bg-primary/10
                  border
                  border-primary/20
                  flex
                  items-center
                  justify-center
                "
              >
                <Icon size={24} />
              </div>

            </div>

          </Card>
        )
      })}
    </div>
  )
}