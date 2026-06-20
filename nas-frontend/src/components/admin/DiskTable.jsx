import {
  Trash2,
  Ban,
  HardDrive
} from "lucide-react"

import {
  Card
} from "@/components/ui/card"

import StorageBar from "./StorageBar"

import { formatBytes } from "@/utils/formatters"
import Pagination from "../common/Pagination.jsx"

export default function DiskTable({
  disks,
  count,
  currentPage,
  onPageChange,
  onDisable,
  onDelete,
}){

  return (

   <Card className="
            glass
            border-white/10
            rounded-3xl
            p-6
          "
        >

      <div className="flex items-center justify-between mb-5">

        <h2 className="text-xl font-semibold">
          Storage Disks
        </h2>

        <p className="text-sm text-zinc-400">
          {disks.length} disks
        </p>

      </div>

      <div className="space-y-5">
        {disks.length === 0 && (
            <div
              className="
                py-10
                text-center
                text-muted-foreground
              "
            >
              No disks configured
            </div>
          )}
        {disks.map((disk) => (

          <div
            key={disk.id}
            className="rounded-2xl border border-zinc-800 p-5"
          >

            <div className="flex items-start justify-between mb-4">

              <div>

                <div className="flex items-center gap-2 mb-2">
                  <HardDrive size={18} />

                  <h3 className="font-semibold text-lg">
                    {disk.name}
                  </h3>
                </div>

                <p className="text-sm text-zinc-400">
                  {disk.mount_path}
                </p>

              </div>

              <div className="flex gap-2">

                <button
                  onClick={() =>
                    onDisable(disk.id)
                  }
                  className="
                              h-10
                              w-10
                              rounded-xl
                              bg-yellow-500/15
                              text-yellow-400
                              hover:bg-yellow-500/25
                              transition
                              flex
                              items-center
                              justify-center
                            "
                >
                  <Ban size={16} />
                </button>

                <button
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Delete this disk?"
                      )
                    ) return

                    onDelete(disk.id)
                  }}
                  className="
                              h-10
                              w-10
                              rounded-xl
                              bg-red-500/15
                              text-red-400
                              hover:bg-red-500/25
                              transition
                              flex
                              items-center
                              justify-center
                            "
                >
                  <Trash2 size={16} />
                </button>

              </div>

            </div>

            <StorageBar
              used={disk.nas_used_space}
              total={disk.total_space}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-sm">

              <div>
                <p className="text-zinc-500">
                  Total
                </p>

                <p className="font-medium mt-1">
                  {formatBytes(
                    disk.total_space
                  )}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">
                  System Used
                </p>

                <p className="font-medium mt-1">
                  {formatBytes(
                    disk.system_used_space
                  )}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">
                  NAS Used
                </p>

                <p className="font-medium mt-1">
                  {formatBytes(
                    disk.nas_used_space
                  )}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">
                  Status
                </p>

                <p className="font-medium mt-1">
                  {disk.is_active
                    ? "Active"
                    : "Disabled"}
                </p>
              </div>

            </div>

          </div>
        ))}

      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={
          Math.ceil(count / 10)
        }
        onPageChange={onPageChange}
      />
    </Card>
  )
}