import { create } from "zustand"
import { persist } from "zustand/middleware"
import api from "@/services/api"
import { storeAction } from "@/store/storeActions"
import {
  sha256,
  createChunks,
} from "@/utils/uploadUtils"


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
      sharedByMeNodes: [],

      searchQuery: "",

      searchLoading: false,

      searchMode: false,

      previewFile: null,
      previewOpen: false,
      previewUrl: null,
      previewLoading: false,
      previewError: null,

      storageStats: null,
      // disk status
      diskStatus: [],
      diskStatusMap: {},
      diskStatusLoading: false,
      hasActiveDisk: false,
      canAllocateDisk: false,
      sharedPagination: {
        count: 0,
        next: null,
        previous: null,
        currentPage: 1,
      },

      sharedByMePagination: {
        count: 0,
        next: null,
        previous: null,
        currentPage: 1,
      },
      // =========================
      // UPLOAD HELPERS
      // =========================

      addUpload: (upload) => {
        set((state) => ({
          uploads: [...state.uploads, upload],
        }))
      },

      updateUpload: (localId, data) => {
        set((state) => ({
          uploads: state.uploads.map((upload) =>
            upload.localId === localId
              ? { ...upload, ...data }
              : upload
          ),
        }))
      },

      removeUpload: (localId) => {
        set((state) => ({
          uploads: state.uploads.filter(
            (upload) =>
              upload.localId !== localId
          ),
        }))
      },

      getUpload: (localId) => {
        return get().uploads.find(
          (upload) =>
            upload.localId === localId
        )
      },

      // =========================
      // FETCH NODES
      // =========================

      fetchNodes: async (
        parentId = null,
        page = 1
      ) => {

        const requestKey =
          `${parentId || "root"}-${page}`

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

          const params =
            new URLSearchParams()

          params.append("page", page)

          if (parentId) {
            params.append(
              "parent_id",
              parentId
            )
          }

          const response =
            await api.get(
              `/nodes/?${params.toString()}`,
              {
                signal:
                  controller.signal
              }
            )

          set({
            nodes:
              response.data.results || [],
            currentFolder:
              parentId,

            pagination: {
              count:
                response.data.count || 0,

              next:
                response.data.next,

              previous:
                response.data.previous,

              currentPage:
                page,
            },
          })

        } catch (error) {

          if (
            error.name ===
              "CanceledError" ||
            error.code ===
              "ERR_CANCELED"
          ) {
            return
          }

          console.error(error)

        } finally {

          fetchControllers.delete(
            requestKey
          )

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
          currentFolder,
          1
        )
      },

      searchNodes: async (
        query,
        page = 1
      ) => {

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

          const params =
            new URLSearchParams()

          params.append("q", query)
          params.append("page", page)

          if (currentFolder) {

            params.append(
              "parent_id",
              currentFolder
            )
          }

          const response =
            await api.get(
              `/search/?${params.toString()}`
            )

          set({
            nodes:
              response.data.results || [],

            pagination: {
              count:
                response.data.count || 0,

              next:
                response.data.next,

              previous:
                response.data.previous,

              currentPage:
                page,
            },
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
        const validation = await get().validateDiskOperation({
          operation: "create",
        })
        if (!validation.valid) {
          throw new Error(validation.error)
        }
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
      // DELETE
      // =========================

      deleteNode: async (nodeId) => {
        const validation = await get().validateDiskOperation({
          operation: "delete",
        });
        if (!validation.valid) {
          throw new Error(validation.error)
        }
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

      fetchSharedNodes: async (page = 1) => {

        const response =
          await api.get(
            `/shared/?page=${page}`
          )

        set({
          sharedNodes:
            response.data.results || [],

          sharedPagination: {
            count:
              response.data.count || 0,

            next:
              response.data.next,

            previous:
              response.data.previous,

            currentPage: page,
          },
        })
      },
      fetchSharedByMeNodes: async (page = 1) => {
        try {

          const response = await api.get(
            `/share/my/?page=${page}`
          )

          set({
            sharedByMeNodes:
              response.data.results || [],

            pagination: {
              count:
                response.data.count || 0,

              next:
                response.data.next,

              previous:
                response.data.previous,

              currentPage: page,
            }
          })

        } catch (error) {

          console.error(error)
        }
      },
      unshareNode: async (
        shareId
      ) => {
        return await storeAction({

          action: async () => {
            await api.delete(
              `/share/${shareId}/`
            )

            await get().fetchSharedByMeNodes(
              get().pagination.currentPage
            )
          },

          set,

          successMessage:
            "Access removed",

          errorMessage:
            "Failed to remove access",

          showSuccess: true,
        })
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

      fetchStorageStats: async () => {
        const response =
          await api.get("/storage/stats/")

        set({
          storageStats: response.data
        })
      },
      // =========================
      // UPLOAD FILE
      // =========================
      uploadFile: async (
        file,
        parentId = null
      ) => {

        const localId =
          crypto.randomUUID()

        const controller =
          new AbortController()

        try {

          get().addUpload({
            localId,

            uploadId: null,

            file,
            parentId,

            name: file.name,
            size: file.size,

            progress: 0,

            uploadedChunks: 0,
            totalChunks: 0,

            status: "hashing",

            speed: 0,
            remaining: 0,

            error: null,

            controller,

            uploadedBytes: 0,

            startedAt: Date.now(),
          })
          const validation =
            await get().validateDiskOperation({
              operation: "upload",
              fileSize: file.size,
            })

          if (!validation.valid) {
            throw new Error(validation.error)
          }
          // HASH
          const hash =
            await sha256(file)

          const chunks =
            createChunks(file)

          get().updateUpload(
            localId,
            {
              hash,
              totalChunks:
                chunks.length,
              status:
                "initiating",
            }
          )

          // INITIATE
          const chunkSize =
            chunks[0]?.size || file.size

          const initiateResponse =
            await api.post(
              "/upload/initiate/",
              {
                filename: file.name,
                total_size: file.size,
                total_chunks: chunks.length,
                chunk_size: chunkSize,
                file_hash: hash,
                parent_id: parentId,
              }
            )

          const uploadId =
            initiateResponse.data
              .upload_id

          get().updateUpload(
            localId,
            {
              uploadId,
              status:
                "uploading",
            }
          )

          await get().uploadChunks(
            localId
          )

        } catch (error) {

          console.error("upload error-", error)

          get().updateUpload(
            localId,
            {
              status: "failed",
              error:
                error.message,
            }
          )
        }
      },

          pauseUpload: (
        localId
      ) => {

        const upload =
          get().getUpload(
            localId
          )

        if (!upload) return

        get().updateUpload(
          localId,
          {
            status: "paused",
          }
        )
      },
      
      resumeUpload: async (
        localId
      ) => {

        const upload =
          get().getUpload(
            localId
          )

        if (!upload) return

        get().updateUpload(
          localId,
          {
            status:
              "uploading",
          }
        )

      await get().syncUploadStatus(
        localId
      )

      await get().uploadChunks(
        localId
      )
      },
            // =========================
      // PREVIEW
      // =========================

      openPreview: async (file) => {

        try {

          const oldUrl = get().previewUrl

          if (oldUrl && oldUrl.startsWith("blob:")) {
            URL.revokeObjectURL(oldUrl)
          }

          set({
            previewOpen: true,
            previewFile: file,
            previewLoading: true,
            previewError: null,
            previewUrl: null,
          })

          const mime = file.mime_type || ""

          // -----------------------------
          // VIDEO
          // -----------------------------
          if (mime.startsWith("video/")) {

            set({
              previewUrl: `${api.defaults.baseURL}/stream/${file.id}`,
              previewLoading: false,
            })

            return
          }

          // -----------------------------
          // IMAGE / PDF / OTHER PREVIEW
          // -----------------------------
          const response = await api.get(
            `/preview/${file.id}/`,
            {
              responseType: "blob",
            }
          )

          const blobUrl = URL.createObjectURL(
            response.data
          )

          set({
            previewUrl: blobUrl,
          })

        } catch (error) {

          console.error(error)

          set({
            previewError: "Failed to load preview",
          })

        } finally {

          set({
            previewLoading: false,
          })

        }

      },

      closePreview: () => {

        const { previewUrl } = get()

        // Only revoke blob URLs
        if (
          previewUrl &&
          previewUrl.startsWith("blob:")
        ) {
          URL.revokeObjectURL(previewUrl)
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
            canAllocateDisk:
              response.data.can_allocate_disk,
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
              hasActiveDisk,
              canAllocateDisk
            } = get()

            // console.log(
            //   "Disk validation status:",
            //   diskStatus
            // )
            // console.log(
            //   "Has active disk:",
            //   hasActiveDisk
            // )

            // INVALID RESPONSE
            if (hasActiveDisk === undefined) {

              return {
                valid: false,
                error: "Disk status unavailable"
              }
            }

            // NO ACTIVE DISK
            if (!hasActiveDisk) {

              if (
                (operation === "upload" || operation === "create") &&
                canAllocateDisk
              ) {

                return {
                  valid: true
                }
              }

              return {
                valid: false,
                error: "No active storage disk available"
              }
            }

            const disks =
              diskStatus || []
            // console.log(
            //   "All disks:",
            //    diskStatus
            // )
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
                    disk.is_writable === true
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

            renameNode: async (
        nodeId,
        name
      ) => {

        return await storeAction({

          action: async () => {

            await api.patch(
              `/rename/${nodeId}/`,
              { name }
            )

            await get().fetchNodes(
              get().currentFolder
            )
          },

          set,

          successMessage:
            "Renamed successfully",

          errorMessage:
            "Rename failed",

          showSuccess: true,
        })
      },

      cancelUpload: async (
        localId
      ) => {

        const upload =
          get().getUpload(
            localId
          )

        if (!upload) return

        try {

          upload.controller.abort()

          if (
            upload.uploadId
          ) {

            await api.delete(
              `/upload/cancel/${upload.uploadId}/`
            )
          }

        } catch (error) {

          console.error(error)

        } finally {

          get().updateUpload(
            localId,
            {
              status:
                "cancelled",
            }
          )

          setTimeout(() => {

            get().removeUpload(
              localId
            )

          }, 1000)
        }
      },

            moveNode: async (
        nodeId,
        parentId
      ) => {

        return await storeAction({

          action: async () => {

            await api.patch(
              `/move/${nodeId}/`,
              {
                parent_id:
                  parentId
              }
            )

            await get().fetchNodes(
              get().currentFolder
            )
          },

          set,

          successMessage:
            "Moved successfully",

          errorMessage:
            "Move failed",

          showSuccess: true,
        })
      },
      syncUploadStatus: async (
        localId
      ) => {

        const upload =
          get().getUpload(localId)

        if (
          !upload ||
          !upload.uploadId
        ) {
          return
        }

        try {

          const response =
            await api.get(
              `/upload/status/${upload.uploadId}/`
            )

          const uploadedIndexes =
            response.data
              .uploaded_chunks || []

          get().updateUpload(
            localId,
            {
              uploadedChunkIndexes:
                uploadedIndexes,

              uploadedChunks:
                uploadedIndexes.length,
            }
          )

        } catch (error) {

          console.error(error)
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

      resumePendingUploads:
        async () => {

          const uploads =
            get().uploads

          for (
            const upload
            of uploads
          ) {

            if (
              upload.status ===
                "uploading" ||
              upload.status ===
                "paused"
            ) {

              try {

                const response =
                  await api.get(
                    `/upload/status/${upload.uploadId}/`
                  )

                const uploadedIndexes =
                  response.data.uploaded_chunks || []

                get().updateUpload(
                  upload.localId,
                  {
                    uploadedChunkIndexes:
                      uploadedIndexes,

                    uploadedChunks:
                      uploadedIndexes.length,
                  }
                )

              } catch (
                error
              ) {
                console.error(
                  error
                )
              }
            }
          }
        },
        shareNode: async (
          nodeId,
          sharedUserId
        ) => {

          return await storeAction({

            action: async () => {

              await api.post(
                "/share/",
                {
                  node_id: nodeId,
                  shared_user_id:
                    sharedUserId,
                }
              )
            },

            set,

            successMessage:
              "Shared successfully",

            errorMessage:
              "Share failed",

            showSuccess: true,
          })
        },
        pagination: {
        count: 0,
        next: null,
        previous: null,
        currentPage: 1,
      },

      setPage: (page) => {
        set((state) => ({
          pagination: {
            ...state.pagination,
            currentPage: page,
          },
        }))
      },
        searchUsers: async (query) => {

          const response =
            await api.get(
              `/users/search/?q=${query}`
            )

          return response.data
        },
        refreshCurrentView: async () => {

          const {
            searchMode,
            searchQuery,
            currentFolder,
          } = get()

          if (
            searchMode &&
            searchQuery
          ) {

            return get().searchNodes(
              searchQuery
            )
          }

          return get().fetchNodes(
            currentFolder
          )
        },
        getThumbnailUrl: (fileId) => {
          return `${api.defaults.baseURL}/thumbnail/${fileId}/`
        },
      uploadChunks: async (
        localId
      ) => {

        const upload =
          get().getUpload(
            localId
          )

        if (!upload) return

        const {
          file,
          uploadId,
          controller,
        } = upload

        const chunks =
          createChunks(file)

        let uploadedBytes =
          upload.uploadedBytes || 0

        const startTime =
          Date.now()
        const uploadedSet = new Set(
          upload.uploadedChunkIndexes || []
        )
        for (let index = 0; index < chunks.length; index++) {
          if (uploadedSet.has(index)) {
              continue
            }
          const latest =
            get().getUpload(
              localId
            )

          if (
            !latest ||
            latest.status ===
              "paused"
          ) {
            return
          }

          const chunk =
            chunks[index]

          const formData =
            new FormData()

          formData.append(
            "upload_id",
            uploadId
          )

          formData.append(
            "chunk_index",
            index
          )

          formData.append(
            "chunk",
            chunk
          )

          await api.post(
            "/upload/chunk/",
            formData,
            {
              signal:
                controller.signal,
            }
          )

          uploadedBytes +=
            chunk.size

          uploadedSet.add(index)

          const completed =
            uploadedSet.size

          const progress =
            Math.round(
              (completed * 100) / chunks.length
            )

          const elapsed =
            (Date.now() -
              startTime) /
            1000

          const speed =
            uploadedBytes /
            elapsed

          const remaining =
            (
              file.size -
              uploadedBytes
            ) / speed

          get().updateUpload(
            localId,
            {
              uploadedChunks:
                uploadedSet.size,

              uploadedBytes,

              progress,

              speed,

              remaining,
            }
          )
        }

        try {
          await api.post(
            "/upload/complete/",
            {
              upload_id: uploadId,
            }
          )
        } catch (error) {

          get().updateUpload(
            localId,
            {
              status: "failed",
              error:
                error.response?.data?.error ||
                "Upload failed",
            }
          )

          return
        }

      get().updateUpload(
        localId,
        {
          progress: 100,
          status:
            "completed",
        }
      )
      setTimeout(() => {

        get().removeUpload(
          localId
        )

      }, 5000)
      await get().fetchNodes(
        get().currentFolder
      )
    },
    resetStore: () => {

      set({
        nodes: [],
        currentFolder: null,

        uploads: [],

        folderStack: [],

        sharedNodes: [],
        sharedByMeNodes: [],

        searchQuery: "",

        searchLoading: false,
        searchMode: false,

        previewFile: null,
        previewOpen: false,
        previewUrl: null,
        previewLoading: false,
        previewError: null,

        storageStats: null,

        diskStatus: [],
        diskStatusMap: {},

        diskStatusLoading: false,

        hasActiveDisk: false,
        canAllocateDisk: false,

        pagination: {
          count: 0,
          next: null,
          previous: null,
          currentPage: 1,
        },
      })
    },
    clearPersistedState: () => {
      useFileStore.persist.clearStorage()
    }
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