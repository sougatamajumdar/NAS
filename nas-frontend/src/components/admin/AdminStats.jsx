import {
  Users,
  Shield,
  HardDrive,
  Database
} from "lucide-react"

import { Card } from "@/components/ui/card"

import { formatBytes } from "@/utils/formatters"

export default function AdminStats({
  users,
  disks,
}) {

  const totalStorage = disks.reduce(
    (acc, disk) =>
      acc + disk.total_space,
    0
  )

  const totalUsed = disks.reduce(
    (acc, disk) =>
      acc + disk.nas_used_space,
    0
  )

  const stats = [
    {
      title: "Users",
      value: users.length,
      icon: Users,
    },
    {
      title: "Admins",
      value: users.filter(
        (u) => u.is_staff
      ).length,
      icon: Shield,
    },
    {
      title: "Disks",
      value: disks.length,
      icon: HardDrive,
    },
    {
      title: "Storage Used",
      value: formatBytes(totalUsed),
      icon: Database,
    },
  ]

  return (

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

      {stats.map((item) => {

        const Icon = item.icon

        return (

          <Card
            key={item.title}
            className="
                        glass
                        border-white/10
                        rounded-3xl
                        p-6
                        overflow-hidden
                        relative
                      "
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-muted-foreground text-sm">
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