import { formatBytes } from "@/utils/formatters"

export default function StorageBar({
  used,
  total
}) {

  const percent =
    total > 0
      ? ((used / total) * 100).toFixed(1)
      : 0

  return (

    <div className="space-y-2">

      <div
        className="
          flex
          items-center
          justify-between
          text-sm
          text-muted-foreground
        "
      >

        <span>
          {formatBytes(used)} used
        </span>

        <span>
          {percent}%
        </span>

      </div>

      <div
        className="
          h-3
          overflow-hidden
          rounded-full
          bg-white/5
          border
          border-white/10
        "
      >

        <div
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-primary
            to-cyan-400
            transition-all
          "
          style={{
            width: `${percent}%`
          }}
        />

      </div>

    </div>
  )
}