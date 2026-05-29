import {
  useEffect,
  useState,
  useRef
} from "react"

import {
  Plus,
  RefreshCw,
  Database,
  UserPlus
} from "lucide-react"

import {
  Card
} from "@/components/ui/card"

import {
  useAdminStore
} from "@/store/adminStore"
import { useFileStore } from "@/store/fileStore"
import AdminStats from "@/components/admin/AdminStats"
import UsersTable from "@/components/admin/UsersTable"
import DiskTable from "@/components/admin/DiskTable"
import BackupTable from "@/components/admin/BackupTable"

export default function AdminDashboard() {

  const {

    users,
    disks,
    backups,
    scannedDisks,

    loading,

    fetchAdminData,
    scanDisks,

    deleteUser,
    updateUser,

    disableDisk,
    deleteDisk,

    createDisk,
    createUser,

    createBackup,

  } = useAdminStore()

  const fetchDiskStatus = useFileStore(
    (state) => state.fetchDiskStatus
  )

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    is_staff: false,
    is_superuser: false,
  })

  // const [diskPath, setDiskPath] = useState("")
  const initializedRef = useRef(false)

  useEffect(() => {

    if (initializedRef.current) return

    initializedRef.current = true

    fetchAdminData()
    scanDisks()
    // fetchDiskStatus()

  }, [])

  const handleCreateUser = async (e) => {

    e.preventDefault()

    const result = await createUser(userForm)

    if (result.success) {

      setUserForm({
        username: "",
        email: "",
        password: "",
        is_staff: false,
        is_superuser: false,
      })
    }
  }

  // const handleCreateDisk = async (e) => {

  //   e.preventDefault()

  //   const result = await createDisk({
  //     mount_path: diskPath
  //   })

  //   if (result.success) {
  //     setDiskPath("")
  //   }
  // }

  if (loading) {

    return (

      <div className="h-[80vh] flex items-center justify-center">

        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white" />

      </div>
    )
  }

 return (

  <div className="p-4 md:p-6 space-y-6 pb-20">

    {/* HEADER */}
    <div
      className="
        flex
        flex-col
        xl:flex-row
        xl:items-center
        xl:justify-between
        gap-5
      "
    >

      <div>

        <div
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            border-primary/20
            bg-primary/10
            px-4
            py-1
            text-sm
            text-primary
            mb-4
          "
        >
          NAS CONTROL CENTER
        </div>

        <h1
          className="
            text-4xl
            md:text-5xl
            font-black
            tracking-tight
          "
        >
          Admin Dashboard
        </h1>

        <p className="text-muted-foreground mt-3 max-w-2xl">
          Monitor storage infrastructure, users,
          disks, backups and system activity.
        </p>

      </div>

      <button
        onClick={fetchAdminData}
        className="
          h-12
          px-5
          rounded-2xl
          glass
          border
          border-white/10
          hover:border-primary/30
          transition-all
          flex
          items-center
          justify-center
          gap-2
          font-medium
        "
      >

        <RefreshCw size={18} />

        Refresh Data

      </button>

    </div>

    {/* STATS */}
    <AdminStats
      users={users}
      disks={disks}
    />

    {/* MAIN GRID */}
    <div
      className="
        grid
        grid-cols-1
        2xl:grid-cols-[1.5fr_420px]
        gap-6
      "
    >

      {/* LEFT */}
      <div className="space-y-6 min-w-0">

        <DiskTable
          disks={disks}
          onDisable={disableDisk}
          onDelete={deleteDisk}
        />

        <UsersTable
          users={users}
          onDelete={deleteUser}
          onToggleAdmin={(user) =>
            updateUser(user.id, {
              is_staff: !user.is_staff
            })
          }
        />

        <BackupTable backups={backups} />

      </div>

      {/* RIGHT SIDEBAR */}
      <div className="space-y-6">

        {/* CREATE USER */}
        <Card
          className="
            glass
            border-white/10
            rounded-3xl
            p-6
          "
        >

          <div className="flex items-center gap-3 mb-6">

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
              <UserPlus className="h-5 w-5 text-primary" />
            </div>

            <div>

              <h2 className="text-xl font-bold">
                Create User
              </h2>

              <p className="text-sm text-muted-foreground">
                Add new NAS account
              </p>

            </div>

          </div>

          <form
            onSubmit={handleCreateUser}
            className="space-y-4"
          >

            <input
              type="text"
              placeholder="Username"
              value={userForm.username}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  username: e.target.value
                })
              }
              className="
                w-full
                h-12
                rounded-2xl
                bg-white/5
                border
                border-white/10
                px-4
                outline-none
                focus:border-primary/40
              "
            />

            <input
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  email: e.target.value
                })
              }
              className="
                w-full
                h-12
                rounded-2xl
                bg-white/5
                border
                border-white/10
                px-4
                outline-none
                focus:border-primary/40
              "
            />

            <input
              type="password"
              placeholder="Password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  password: e.target.value
                })
              }
              className="
                w-full
                h-12
                rounded-2xl
                bg-white/5
                border
                border-white/10
                px-4
                outline-none
                focus:border-primary/40
              "
            />

            <label
              className="
                flex
                items-center
                gap-3
                text-sm
                text-muted-foreground
              "
            >

              <input
                type="checkbox"
                checked={userForm.is_staff}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    is_staff: e.target.checked
                  })
                }
              />

              Grant admin privileges

            </label>

            <button
              className="
                w-full
                h-12
                rounded-2xl
                bg-primary
                text-primary-foreground
                font-semibold
                hover:opacity-90
                transition
              "
            >
              Create User
            </button>

          </form>

        </Card>

        {/* STORAGE DETECTION */}
        <Card
          className="
            glass
            border-white/10
            rounded-3xl
            p-6
          "
        >

          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-xl font-bold">
                Detected Storage
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Available disks on host machine
              </p>

            </div>

            <button
              onClick={scanDisks}
              className="
                h-10
                px-4
                rounded-xl
                bg-white/5
                border
                border-white/10
                hover:bg-white/10
              "
            >
              Scan
            </button>

          </div>

          <div className="space-y-4">

            {scannedDisks.map((disk, index) => {

              const alreadyAdded =
                disks.some(
                  (d) =>
                    d.mount_path === disk.mount_path
                )

              return (

                <div
                  key={index}
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    p-4
                  "
                >

                  <div className="space-y-3">

                    <div>

                      <h3 className="font-semibold">
                        {disk.name}
                      </h3>

                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        {disk.mount_path}
                      </p>

                    </div>

                    <div className="text-sm text-muted-foreground">
                      Free Space: {
                        (
                          disk.free_space /
                          1024 /
                          1024 /
                          1024
                        ).toFixed(1)
                      } GB
                    </div>

                    <button
                      disabled={alreadyAdded}
                      onClick={() =>
                        createDisk({
                          mount_path:
                            disk.mount_path
                        })
                      }
                      className={`
                        w-full
                        h-11
                        rounded-xl
                        font-medium
                        transition
                        ${
                          alreadyAdded
                            ? "bg-white/5 text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:opacity-90"
                        }
                      `}
                    >

                      {alreadyAdded
                        ? "Already Added"
                        : "Add Disk"}

                    </button>

                  </div>

                </div>
              )
            })}

          </div>

        </Card>

      </div>

    </div>

  </div>
)
}