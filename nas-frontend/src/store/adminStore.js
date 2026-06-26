import { create } from "zustand"

import api from "@/services/api"

import { toast } from "sonner"

export const useAdminStore = create((set, get) => ({

  users: [],
  usersCount: 0,
  usersNext: null,
  usersPrevious: null,

  disks: [],
  disksCount: 0,
  disksNext: null,
  disksPrevious: null,

  backups: [],
  backupsCount: 0,
  backupsNext: null,
  backupsPrevious: null,
  scannedDisks: [],

  dashboardStats: {
    users: 0,
    files: 0,
    folders: 0,
    active_disks: 0,
  },

  loading: false,
  scanLoading: false,
  actionLoading: false,
  processingDiskId:null,

  // ======================
  // FETCH ALL
  // ======================
  fetchAdminData: async () => {

    set({ loading: true })

    try {

      const [
        statsRes,
        usersRes,
        disksRes,
        backupsRes
      ] = await Promise.all([

        api.get(
          "/admin/dashboard/stats/"
        ),

        api.get(
          "/admin/users/"
        ),

        api.get(
          "/admin/disks/"
        ),

        api.get(
          "/admin/backups/"
        )
      ])

      // console.log("disksRes", disksRes)  // Debugging line

      set({
        dashboardStats:
          statsRes.data,

        users:
          usersRes.data.results || [],

        usersCount:
          usersRes.data.count || 0,

        usersNext:
          usersRes.data.next,

        usersPrevious:
          usersRes.data.previous,

        disks:
          disksRes.data.results || [],

        disksCount:
          disksRes.data.count || 0,

        disksNext:
          disksRes.data.next,

        disksPrevious:
          disksRes.data.previous,

        backups:
          backupsRes.data.results || [],

        backupsCount:
          backupsRes.data.count || 0,

        backupsNext:
          backupsRes.data.next,

        backupsPrevious:
          backupsRes.data.previous,

        loading: false,
      })

    } catch (error) {

      console.error(error)

      toast.error("Failed to load admin data")

      set({ loading: false })
    }
  },

  // ======================
  // SCAN DISKS
  // ======================
  scanDisks: async () => {

    set({
      scanLoading: true
    })

    try {

      const response =
        await api.get(
          "/admin/disks/scan/"
        )

      set({
        scannedDisks: response.data
      })

    } catch (error) {

      toast.error(
        "Failed to scan disks"
      )

    } finally {

      set({
        scanLoading: false
      })
    }
  },

  // ======================
  // CREATE USER
  // ======================
  createUser: async (data) => {

    set({ actionLoading: true })

    try {

      await api.post(
        "/admin/users/",
        data
      )

      toast.success("User created")

      await get().fetchAdminData()

      return {
        success: true
      }

    } catch (error) {

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        "Failed to create user"

      toast.error(message)

      return {
        success:false,
        error:error.response?.data
      }

    } finally {

      set({
        actionLoading: false
      })
    }
  },

  // ======================
  // UPDATE USER
  // ======================
  updateUser: async (
    userId,
    data
  ) => {

    try {

      await api.patch(
        `/admin/users/${userId}/`,
        data
      )

      toast.success("User updated")

      await get().fetchAdminData()

    } catch (error) {

      console.error(error)

      toast.error("Failed to update user")
    }
  },

  // ======================
  // DELETE USER
  // ======================
  deleteUser: async (userId) => {

    try {

      await api.delete(
        `/admin/users/${userId}/`
      )

      toast.success("User deleted")

      await get().fetchAdminData()

    } catch (error) {

      console.error(error)

      toast.error(
        error.response?.data?.error ||
        "Delete failed"
      )
    }
  },

  // ======================
  // CREATE DISK
  // ======================
  createDisk: async (data) => {

    try {

      await api.post(
        "/admin/disks/",
        data
      )

      toast.success("Disk added")

      await Promise.all([
        get().fetchAdminData(),
        get().scanDisks()
      ])

      return { success: true }

    } catch (error) {

      return {
        success: false,
        error: error.response?.data
      }
    }
  },

  // ======================
  // DISABLE DISK
  // ======================
  disableDisk: async (diskId) => {

    try {

      await api.patch(
        `/admin/disks/${diskId}/disable/`
      )

      toast.success("Disk disabled")

      await get().fetchAdminData()

    } catch (error) {

      console.error(error)

      toast.error("Failed")
    }
  },

  // ======================
  // DELETE DISK
  // ======================
  deleteDisk: async (diskId) => {

    try {

      await api.delete(
        `/admin/disks/${diskId}/`
      )

      toast.success("Disk deleted")

      await get().fetchAdminData()

    } catch (error) {

      console.error(error)

      toast.error(
        error.response?.data?.error ||
        "Delete failed"
      )
    }
  },

  // ======================
  // CREATE BACKUP
  // ======================
  createBackup: async (data) => {

    try {

      await api.post(
        "/admin/backups/",
        data
      )

      toast.success("Backup created")

      await get().fetchAdminData()

    } catch (error) {

      console.error(error)

      toast.error("Backup failed")
    }
  },
  fetchDashboardStats: async () => {

  try {

    const response =
      await api.get(
        "/admin/dashboard/stats/"
      )

    set({
      dashboardStats:
        response.data
    })

  } catch (error) {

    console.error(error)
  }
},

fetchUsersPage: async (url) => {

  try {

    const response =
      await api.get(url)

    set({
      users:
        response.data.results || [],

      usersCount:
        response.data.count || 0,

      usersNext:
        response.data.next,

      usersPrevious:
        response.data.previous,
    })

  } catch (error) {

    console.error(error)
  }
},
fetchDisksPage: async (url) => {

  try {

    const response =
      await api.get(url)

    set({
      disks:
        response.data.results || [],

      disksCount:
        response.data.count || 0,

      disksNext:
        response.data.next,

      disksPrevious:
        response.data.previous,
    })

  } catch (error) {

    console.error(error)
  }
},
fetchBackupsPage: async (url) => {

  try {

    const response =
      await api.get(url)

    set({
      backups:
        response.data.results || [],

      backupsCount:
        response.data.count || 0,

      backupsNext:
        response.data.next,

      backupsPrevious:
        response.data.previous,
    })

  } catch (error) {

    console.error(error)
  }
},
fetchUsersByPage: async (page) => {

  const response =
    await api.get(
      `/admin/users/?page=${page}`
    )

  set({
    users:
      response.data.results,

    usersCount:
      response.data.count,

    usersNext:
      response.data.next,

    usersPrevious:
      response.data.previous,
  })
},
fetchDisksByPage: async (page) => {

  const response =
    await api.get(
      `/admin/disks/?page=${page}`
    )

set({
  disks: response.data.results,
  disksCount: response.data.count,
  disksNext: response.data.next,
  disksPrevious: response.data.previous,
})
},
fetchBackupsByPage: async (page) => {

  const response =
    await api.get(
      `/admin/backups/?page=${page}`
    )

  set({
    backups:
      response.data.results,

    backupsCount:
      response.data.count,

    backupsNext:
      response.data.next,

    backupsPrevious:
      response.data.previous,
  })
},
}))