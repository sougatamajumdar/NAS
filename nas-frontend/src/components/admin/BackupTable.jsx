import {
  Card
} from "@/components/ui/card"

export default function BackupTable({
  backups
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

        {backups.map((backup) => (

          <div
            key={backup.id}
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

    </Card>
  )
}