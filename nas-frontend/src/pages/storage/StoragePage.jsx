import {
  HardDrive,
  Database,
  FolderOpen,
  File,
  PieChart,
  Activity,
  FolderTree,
  ArrowUpRight,
} from "lucide-react"

import {
  Card,
  CardContent
} from "@/components/ui/card"

import { Progress } from "@/components/ui/progress"

import { useStorageStore } from "@/store/storageStore"
import { useFileStore } from "@/store/fileStore"

import {
  useEffect,
  useRef
} from "react"

export default function StoragePage() {

  const {
    stats,
    fetchStorageStats,
    storageLoading
  } = useStorageStore()

  const fetchDiskStatus = useFileStore(
    (state) => state.fetchDiskStatus
  )

  const initializedRef = useRef(false)

  useEffect(() => {

    if (initializedRef.current) return

    initializedRef.current = true

    fetchDiskStatus()
    fetchStorageStats()

  }, [])

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

  if (storageLoading || !stats) {

    return (

      <div className="p-6">

        <div
          className="
            glass
            rounded-3xl
            p-10
            text-center
            text-muted-foreground
          "
        >
          Loading storage analytics...
        </div>

      </div>
    )
  }

  const storageCards = [
    {
      title: "Used Storage",
      value: formatBytes(stats.total_storage),
      icon: HardDrive,
    },
    {
      title: "Files",
      value: stats.total_files,
      icon: File,
    },
    {
      title: "Folders",
      value: stats.total_folders,
      icon: FolderOpen,
    },
    {
      title: "Root Folders",
      value: stats.root_folders,
      icon: FolderTree,
    },
    {
      title: "Total Items",
      value: stats.total_items,
      icon: Database,
    }
  ]

  return (

    <div
      className="
        h-full
        overflow-auto
        px-4
        md:px-6
        py-5
        space-y-6
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
        "
      >

        <div>

          <h1
            className="
              text-3xl
              md:text-4xl
              font-bold
              tracking-tight
            "
          >
            Storage Analytics
          </h1>

          <p
            className="
              text-muted-foreground
              mt-2
            "
          >
            Monitor storage usage and file activity
          </p>

        </div>

      </div>

      {/* STORAGE OVERVIEW */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-5
          gap-5
        "
      >

        {storageCards.map((item) => {

          const Icon = item.icon

          return (

            <Card
              key={item.title}
              className="
                glass
                border-white/10
                rounded-3xl
                overflow-hidden
                hover:border-primary/30
                transition-all
                duration-300
              "
            >

              <CardContent className="p-5">

                <div className="flex items-start justify-between">

                  <div>

                    <p
                      className="
                        text-sm
                        text-muted-foreground
                      "
                    >
                      {item.title}
                    </p>

                    <h2
                      className="
                        text-2xl
                        font-bold
                        mt-3
                        break-all
                      "
                    >
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
                      shrink-0
                    "
                  >

                    <Icon
                      size={24}
                      className="text-primary"
                    />

                  </div>

                </div>

              </CardContent>

            </Card>
          )
        })}

      </div>

      {/* MAIN ANALYTICS */}
      <div
        className="
          grid
          grid-cols-1
          2xl:grid-cols-2
          gap-6
        "
      >

        {/* FILE TYPES */}
        <Card
          className="
            glass
            border-white/10
            rounded-3xl
          "
        >

          <CardContent className="p-6">

            <div
              className="
                flex
                items-center
                justify-between
                mb-6
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    h-12
                    w-12
                    rounded-2xl
                    bg-primary/10
                    border
                    border-primary/20
                    flex
                    items-center
                    justify-center
                  "
                >

                  <PieChart
                    size={20}
                    className="text-primary"
                  />

                </div>

                <div>

                  <h2 className="text-xl font-semibold">
                    File Types
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Storage distribution
                  </p>

                </div>

              </div>

            </div>

            <div className="space-y-5">

              {Object.entries(
                stats.file_types
              ).map(([key, value]) => {

                const percentage =
                  stats.total_storage > 0
                    ? (
                        (value.size /
                          stats.total_storage) *
                        100
                      ).toFixed(1)
                    : 0

                return (

                  <div
                    key={key}
                    className="space-y-2"
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="font-medium">
                          {key}
                        </p>

                        <p
                          className="
                            text-xs
                            text-muted-foreground
                          "
                        >
                          {value.count} Files
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="font-medium">
                          {formatBytes(value.size)}
                        </p>

                        <p
                          className="
                            text-xs
                            text-primary
                          "
                        >
                          {percentage}%
                        </p>

                      </div>

                    </div>

                    <Progress value={percentage} />

                  </div>
                )
              })}

            </div>

          </CardContent>

        </Card>

        {/* RECENT UPLOADS */}
        <Card
          className="
            glass
            border-white/10
            rounded-3xl
          "
        >

          <CardContent className="p-6">

            <div
              className="
                flex
                items-center
                gap-3
                mb-6
              "
            >

              <div
                className="
                  h-12
                  w-12
                  rounded-2xl
                  bg-primary/10
                  border
                  border-primary/20
                  flex
                  items-center
                  justify-center
                "
              >

                <Activity
                  size={20}
                  className="text-primary"
                />

              </div>

              <div>

                <h2 className="text-xl font-semibold">
                  Recent Uploads
                </h2>

                <p className="text-sm text-muted-foreground">
                  Latest uploaded files
                </p>

              </div>

            </div>

            <div className="space-y-4">

              {!stats.recent_uploads.length ? (

                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-white/10
                    p-10
                    text-center
                    text-muted-foreground
                  "
                >
                  No uploads found
                </div>

              ) : (

                stats.recent_uploads.map((file) => (

                  <div
                    key={file.id}
                    className="
                      flex
                      items-center
                      justify-between
                      rounded-2xl
                      border
                      border-white/5
                      bg-white/[0.03]
                      px-4
                      py-4
                    "
                  >

                    <div className="min-w-0">

                      <p
                        className="
                          font-medium
                          truncate
                        "
                      >
                        {file.name}
                      </p>

                    </div>

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        text-sm
                        text-muted-foreground
                        shrink-0
                        ml-4
                      "
                    >

                      {formatBytes(file.size)}

                      <ArrowUpRight size={16} />

                    </div>

                  </div>
                ))
              )}

            </div>

          </CardContent>

        </Card>

      </div>

      {/* LARGEST FILES */}
      <Card
        className="
          glass
          border-white/10
          rounded-3xl
        "
      >

        <CardContent className="p-6">

          <div
            className="
              flex
              items-center
              justify-between
              mb-6
            "
          >

            <div>

              <h2 className="text-2xl font-semibold">
                Largest Files
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Files consuming the most storage
              </p>

            </div>

          </div>

          {!stats.largest_files.length ? (

            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-white/10
                p-12
                text-center
                text-muted-foreground
              "
            >
              No files found
            </div>

          ) : (

            <div className="space-y-4">

              {stats.largest_files.map((file) => (

                <div
                  key={file.id}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-2xl
                    border
                    border-white/5
                    bg-white/[0.03]
                    px-5
                    py-4
                    hover:border-primary/20
                    transition
                  "
                >

                  <div className="min-w-0">

                    <p
                      className="
                        font-medium
                        truncate
                      "
                    >
                      {file.name}
                    </p>

                  </div>

                  <div
                    className="
                      text-sm
                      text-primary
                      font-medium
                      shrink-0
                      ml-4
                    "
                  >

                    {formatBytes(file.size)}

                  </div>

                </div>
              ))}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  )
}