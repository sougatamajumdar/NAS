import { useEffect } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"

import { Button } from "@/components/ui/button"

import { useShareStore } from "@/store/shareStore"

export default function ShareModal({
  open,
  onOpenChange,
  node,
}) {

  const {
    users,
    userSearch,
    selectedUser,
    shareLoading,
    shareMessage,

    setUserSearch,
    setSelectedUser,

    searchUsers,
    shareNode,
    clearShareState,
  } = useShareStore()

  useEffect(() => {

    const delay = setTimeout(() => {

      if (userSearch) {
        searchUsers(userSearch)
      }

    }, 300)

    return () => clearTimeout(delay)

  }, [userSearch])

  useEffect(() => {

    if (!open) {
      clearShareState()
    }

  }, [open])

  return (

    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >

      <DialogContent
        className="
          bg-zinc-900
          border-zinc-800
          text-white
        "
      >

        <DialogHeader>

          <DialogTitle>
            Share File
          </DialogTitle>

        </DialogHeader>

        <div className="space-y-4">

          {/* SEARCH INPUT */}
          <div className="relative">

            <Input
              placeholder="Search user..."
              value={userSearch}
              onChange={(e) =>
                setUserSearch(
                  e.target.value
                )
              }
              className="
                bg-zinc-800
                border-zinc-700
              "
            />

            {users.length > 0 && (

              <div
                className="
                  absolute
                  top-full
                  mt-1
                  w-full
                  rounded-md
                  border
                  border-zinc-700
                  bg-zinc-900
                  overflow-hidden
                  z-50
                "
              >

                {users.map((user) => (

                  <button
                    key={user.id}
                    onClick={() =>
                      setSelectedUser(user)
                    }
                    className="
                      w-full
                      px-3
                      py-2
                      text-left
                      hover:bg-zinc-800
                      transition
                    "
                  >

                    <div className="font-medium">
                      {user.username}
                    </div>

                    <div
                      className="
                        text-xs
                        text-zinc-400
                      "
                    >
                      {user.email}
                    </div>

                  </button>
                ))}

              </div>
            )}

          </div>

          {/* SELECTED USER */}
          {selectedUser && (

            <div
              className="
                rounded-lg
                bg-zinc-800
                p-3
              "
            >

              <div className="font-medium">
                {selectedUser.username}
              </div>

              <div
                className="
                  text-sm
                  text-zinc-400
                "
              >
                {selectedUser.email}
              </div>

            </div>
          )}

          {/* MESSAGE */}
          {shareMessage && (

            <div className="text-sm text-zinc-400">

              {shareMessage}

            </div>
          )}

          {/* BUTTON */}
          <Button
            onClick={() =>
              shareNode(node.id)
            }
            disabled={
              shareLoading ||
              !selectedUser
            }
            className="w-full"
          >

            {shareLoading
              ? "Sharing..."
              : "Share"}

          </Button>

        </div>

      </DialogContent>

    </Dialog>
  )
}