import { create } from "zustand"
import { persist } from "zustand/middleware"
import api from "@/services/api"
import { storeAction } from "@/store/storeActions"


const fetchControllers = new Map()

export const useFileStore = create(
  persist(
    (set, get) => ({

      nodes: [],
      currentFolder: null,

      fileLoading: false,

      uploads: [],

      folderStack: [],

      sharedNodes: [],

      searchQuery: "",

      searchLoading: false,

      searchMode: false,

      previewFile: null,
      previewOpen: false,
      previewUrl: null,
      previewLoading: false,
      previewError: null,

      // disk status
      diskStatus: [],
      diskStatusMap: {},
      diskStatusLoading: false,
      hasActiveDisk: false,
      // =========================
      // UPLOAD HELPERS
      // =========================

      addUpload: (upload) => {

        set((state) => ({
          uploads: [...state.uploads, upload]
        }))
      },

      updateUpload: (id, data) => {

        set((state) => ({
          uploads: state.uploads.map((upload) =>
            upload.id === id
              ? { ...upload, ...data }
              : upload
          )
        }))
      },

      removeUpload: (id) => {

        set((state) => ({
          uploads: state.uploads.filter(
            (upload) => upload.id !== id
          )
        }))
      },

      // =========================
      // FETCH NODES
      // =========================

      fetchNodes: async (parentId = null) => {

        const requestKey =
          parentId || "root"

        if (fetchControllers.has(requestKey)) {

          fetchControllers
            .get(requestKey)
            .abort()
        }

        const controller =
          new AbortController()

        fetchControllers.set(
          requestKey,
          controller
        )

        set({
          fileLoading: true,
          searchMode: false,
        })

        try {

          let url = "/nodes/"

          if (parentId) {
            url += `?parent_id=${parentId}`
          }

          const response = await api.get(
            url,
            {
              signal: controller.signal
            }
          )

          set({
            nodes: response.data,
            currentFolder: parentId,
          })

        } catch (error) {

          if (
            error.name === "CanceledError" ||
            error.code === "ERR_CANCELED"
          ) {
            return
          }

          console.error(error)

          if (
            error.response?.status === 404
          ) {

            set({
              currentFolder: null,
              folderStack: [],
              nodes: [],
            })

            await get().fetchNodes(null)

            return
          }

        } finally {

          set({
            fileLoading: false
          })
        }
      },

      // =========================
      // SEARCH
      // =========================

      setSearchQuery: (value) => {

        set({
          searchQuery: value
        })
      },

      clearSearch: async () => {

        const currentFolder =
          get().currentFolder

        set({
          searchQuery: "",
          searchMode: false,
        })

        await get().fetchNodes(
          currentFolder
        )
      },

      searchNodes: async (query) => {

        if (!query.trim()) {

          get().clearSearch()

          return
        }

        set({
          searchLoading: true,
          searchMode: true,
        })

        try {

          const currentFolder =
            get().currentFolder

          let url =
            `/search/?q=${encodeURIComponent(query)}`

          if (currentFolder) {
            url += `&parent_id=${currentFolder}`
          }

          const response =
            await api.get(url)

          set({
            nodes: response.data,
          })

        } catch (error) {

          console.error(error)

        } finally {

          set({
            searchLoading: false
          })
        }
      },

      // =========================
      // CREATE FOLDER
      // =========================

      createFolder: async (data) => {

        return await storeAction({

          action: async () => {

            await api.post(
              "/nodes/",
              data
            )

            await get().fetchNodes(
              get().currentFolder
            )
          },

          set,

          successMessage:
            "Folder created",

          errorMessage:
            "Failed to create folder",

          showSuccess: true,
        })
      },

      // =========================
      // UPLOAD FILE
      // =========================

      uploadFile: async (
        file,
        parentId = null
      ) => {

        const uploadId =
          crypto.randomUUID()

        get().addUpload({
          id: uploadId,
          name: file.name,
          progress: 0,
          status: "uploading",
          size: file.size,
        })

        const formData =
          new FormData()

        formData.append(
          "file",
          file
        )

        if (parentId) {

          formData.append(
            "parent_id",
            parentId
          )
        }

        try {

          await api.post(
            "/upload/",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data"
              },

              onUploadProgress:
                (progressEvent) => {

                  if (!progressEvent.total) {
                    return
                  }

                  const percent =
                    Math.round(
                      (
                        progressEvent.loaded *
                        100
                      ) /
                      progressEvent.total
                    )

                  get().updateUpload(
                    uploadId,
                    {
                      progress: percent
                    }
                  )
                }
            }
          )

          get().updateUpload(
            uploadId,
            {
              progress: 100,
              status: "completed"
            }
          )

          await get().fetchNodes(
            get().currentFolder
          )

          setTimeout(() => {

            get().removeUpload(
              uploadId
            )

          }, 1500)

        } catch (error) {

          console.error(error)

          get().updateUpload(
            uploadId,
            {
              status: "failed"
            }
          )
        }
      },

      // =========================
      // DELETE
      // =========================

      deleteNode: async (nodeId) => {

        return await storeAction({

          action: async () => {

            await api.delete(
              `/delete/${nodeId}/`
            )

            await get().fetchNodes(
              get().currentFolder
            )
          },

          set,

          successMessage:
            "Deleted successfully",

          errorMessage:
            "Delete failed",

          showSuccess: true,
        })
      },

      // =========================
      // SHARED
      // =========================

      fetchSharedNodes: async () => {

        try {

          const response =
            await api.get("/shared/")

          set({
            sharedNodes:
              response.data
          })

        } catch (error) {

          console.error(error)
        }
      },

      // =========================
      // STORAGE STATS
      // =========================

      getStorageStats: () => {

        const { nodes } = get()

        const files = nodes.filter(
          (n) => n.type === "FILE"
        )

        const folders =
          nodes.filter(
            (n) =>
              n.type === "FOLDER"
          )

        const totalSize =
          files.reduce(
            (acc, file) =>
              acc + file.size,
            0
          )

        return {
          totalFiles:
            files.length,

          totalFolders:
            folders.length,

          totalSize,
        }
      },

      // =========================
      // PREVIEW
      // =========================

      openPreview: async (file) => {

        try {

          const oldUrl =
            get().previewUrl

          if (oldUrl) {
            URL.revokeObjectURL(
              oldUrl
            )
          }

          set({
            previewOpen: true,
            previewFile: file,
            previewLoading: true,
            previewError: null,
            previewUrl: null,
          })

          const response =
            await api.get(
              `/download/${file.id}/`,
              {
                responseType:
                  "blob",
              }
            )

          const blobUrl =
            URL.createObjectURL(
              response.data
            )

          set({
            previewUrl: blobUrl,
          })

        } catch (error) {

          console.error(error)

          set({
            previewError:
              "Failed to load preview",
          })

        } finally {

          set({
            previewLoading: false
          })
        }
      },

      closePreview: () => {

        const { previewUrl } =
          get()

        if (previewUrl) {

          URL.revokeObjectURL(
            previewUrl
          )
        }

        set({
          previewOpen: false,
          previewFile: null,
          previewUrl: null,
          previewLoading: false,
          previewError: null,
        })
      },

      fetchDiskStatus: async () => {
        try {

          set({
            diskStatusLoading: true
          })

          const response = await api.get(
            "/disk/status/"
          )

          console.log(
            "Disk status response:",
            response.data
          )

          const disks =
            response.data.disks || []

          const map = {}

          disks.forEach((disk) => {

            map[disk.mount_path] = disk
          })

          set({
            diskStatus: disks,
            diskStatusMap: map,
            hasActiveDisk:
              response.data.has_active_disk,

            diskStatusLoading: false,
          })

        } catch (error) {

          console.error(error)

          set({
            diskStatusLoading: false
          })
        }
      },

      validateDiskOperation: async ({
          operation,
          fileSize = 0,
        }) => {

          try {

            // ALWAYS FETCH LATEST STATUS
            await get().fetchDiskStatus()

            const {
              diskStatus,
              hasActiveDisk
            } = get()

            console.log(
              "Disk validation status:",
              diskStatus
            )
            console.log(
              "Has active disk:",
              hasActiveDisk
            )

            // INVALID RESPONSE
            if (!hasActiveDisk === undefined) {

              return {
                valid: false,
                error: "Disk status unavailable"
              }
            }

            // NO ACTIVE DISK
            if (!hasActiveDisk) {

              return {
                valid: false,
                error: "No active storage disk available"
              }
            }

            const disks =
              diskStatus || []
            console.log(
              "All disks:",
               diskStatus
            )
            // ACTIVE + ONLINE DISKS
            const onlineDisks = disks.filter(
              (disk) =>
                disk.is_active === true &&
                disk.is_online === true
            )

            console.log(
              "Online disks:",
              onlineDisks
            )

            // ALL OFFLINE
            if (onlineDisks.length === 0) {

              return {
                valid: false,
                error: "All storage disks are offline"
              }
            }

            // WRITE OPERATIONS
            if (
              ["upload", "delete", "create", "share"]
                .includes(operation)
            ) {

              // WRITABLE DISKS
              const writableDisks =
                onlineDisks.filter(
                  (disk) =>
                    disk.is_read_only !== true
                )

              if (writableDisks.length === 0) {

                return {
                  valid: false,
                  error: "All disks are read only"
                }
              }

              // UPLOAD SIZE CHECK
              if (operation === "upload") {

                const enoughSpace =
                  writableDisks.some(
                    (disk) =>
                      Number(disk.free_space || 0)
                      >= fileSize
                  )

                if (!enoughSpace) {

                  return {
                    valid: false,
                    error: "Not enough storage space"
                  }
                }
              }
            }

            return {
              valid: true
            }

          } catch (error) {

            console.error(
              "Disk validation failed:",
              error
            )

            return {
              valid: false,
              error: "Validation failed"
            }
          }
      },
      // =========================
      // DOWNLOAD
      // =========================

      downloadFile: async (file) => {

        try {

          const response =
            await api.get(
              `/download/${file.id}/`,
              {
                responseType:
                  "blob",
              }
            )

          const blobUrl =
            URL.createObjectURL(
              response.data
            )

          const link =
            document.createElement(
              "a"
            )

          link.href = blobUrl

          link.download =
            file.name

          document.body.appendChild(
            link
          )

          link.click()

          link.remove()

          URL.revokeObjectURL(
            blobUrl
          )

        } catch (error) {

          console.error(error)
        }
      },

    }),
    {
      name: "file-store",

      version: 3,

      partialize: (state) => ({
        currentFolder:
          state.currentFolder,

        folderStack:
          state.folderStack,
      }),

      migrate: (
        persistedState,
        version
      ) => {

        if (version !== 3) {

          return {
            currentFolder: null,
            folderStack: [],
          }
        }

        return persistedState
      }
    }
  )
)