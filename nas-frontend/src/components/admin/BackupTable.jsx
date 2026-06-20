import {
  Card
} from "@/components/ui/card"
import Pagination from "../common/Pagination.jsx"

export default function BackupTable({
  backups,
  count,
  currentPage,
  onPageChange,
}) {

  return (

    <Card className="
                      glass
                      border-white/10
                      p-6
                      rounded-3xl
                    ">

      <div className="flex items-center justify-between mb-5">

        <h2 className="text-xl font-semibold">
          Backups
        </h2>

        <p className="text-sm text-zinc-400">
          {backups.length} backups
        </p>

      </div>

      <div className="space-y-4">
        {backups.length === 0 && (
          <div
            className="
              py-10
              text-center
              text-muted-foreground
            "
          >
            No backups available
          </div>
        )}
        {backups.map((backup) => (

          <div
            key={  backup.id ||
                   backup.backup_file}
            className="
                      rounded-2xl
                      border
                      border-white/10
                      bg-white/[0.03]
                      p-4
                    "
          >

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-semibold">
                  {backup.backup_type}
                </h3>

                <p className="text-sm text-zinc-400 mt-1">
                  {backup.backup_file}
                </p>

              </div>

              <div className="text-right text-sm text-zinc-400">

                <p>
                  User: {backup.user_id || "-"}
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