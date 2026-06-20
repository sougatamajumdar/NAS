import {
  Trash2,
  Shield,
  User
} from "lucide-react"

import {
  Card
} from "@/components/ui/card"
import Pagination from "../common/Pagination.jsx"

export default function UsersTable({
  users,
  count,
  currentPage,
  onPageChange,
  onDelete,
  onToggleAdmin,
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
          Users
        </h2>

        <p className="text-sm text-zinc-400">
          {users.length} users
        </p>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full min-w-[700px] text-sm">

          <thead>

            <tr className="
                            border-b
                            border-white/5
                            hover:bg-white/[0.02]
                            transition
                          ">

              <th className="text-left py-3">
                Username
              </th>

              <th className="text-left py-3">
                Email
              </th>

              <th className="text-left py-3">
                Role
              </th>

              <th className="text-left py-3">
                Status
              </th>

              <th className="text-right py-3">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="
                    py-10
                    text-center
                    text-muted-foreground
                  "
                >
                  No users found
                </td>
              </tr>
            )}
            {users.map((user) => (

              <tr
                key={user.id}
                className="border-b border-zinc-800/50"
              >

                <td className="py-4 font-medium">
                  {user.username}
                </td>

                <td className="py-4 text-zinc-400">
                  {user.email}
                </td>

                <td className="py-4">

                  {user.is_staff ? (
                    <div className="inline-flex items-center gap-2 text-yellow-400">
                      <Shield size={16} />
                      Admin
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-zinc-400">
                      <User size={16} />
                      User
                    </div>
                  )}

                </td>

                <td className="py-4">

                  <span className={`px-3 py-1 rounded-full text-xs ${
                    user.is_active
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {user.is_active
                      ? "Active"
                      : "Disabled"}
                  </span>

                </td>

                <td className="py-4">

                  <div className="flex justify-end gap-2">

                    <button
                      onClick={() =>
                        onToggleAdmin(user)
                      }
                      className="
                                    px-4
                                    py-2
                                    rounded-xl
                                    bg-white/5
                                    border
                                    border-white/10
                                    hover:bg-white/10
                                  "
                    >
                      Toggle Admin
                    </button>

                    <button
                      onClick={() => {

                        if (
                          !window.confirm(
                            "Delete this user?"
                          )
                        ) return

                        onDelete(user.id)

                      }}
                      className="
                                  h-10
                                  w-10
                                  rounded-xl
                                  bg-red-500/15
                                  text-red-400
                                  hover:bg-red-500/25
                                  flex
                                  items-center
                                  justify-center
                                "
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </td>

              </tr>
            ))} 

          </tbody>

        </table>

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