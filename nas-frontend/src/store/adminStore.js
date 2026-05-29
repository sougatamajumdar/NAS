import { create } from "zustand"

import api from "@/services/api"

import { toast } from "sonner"

export const useAdminStore = create((set, get) => ({

  users: [],
  disks: [],
  backups: [],
  scannedDisks: [],

  loading: false,
  actionLoading: false,

  // ======================
  // FETCH ALL
  // ======================
  fetchAdminData: async () => {

    set({ loading: true })

    try {

      const [
        usersRes,
        disksRes,
        backupsRes
      ] = await Promise.all([

        api.get("/admin/users/"),
        api.get("/admin/disks/"),
        api.get("/admin/backups/")
      ])
      console.log("disksRes", disksRes)  // Debugging line

      set({
        users: usersRes.data,
        disks: disksRes.data,
        backups: backupsRes.data,
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

    try {

      const response = await api.get(
        "/admin/disks/scan/"
      )

      set({
        scannedDisks: response.data
      })

    } catch (error) {

      console.error(error)

      toast.error("Failed to scan disks")
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

      set({ actionLoading: false })

      return {
        success: true
      }

    } catch (error) {

      set({ actionLoading: false })

      return {
        success: false,
        error: error.response?.data
      }
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

      await get().fetchAdminData()

      return {
        success: true
      }

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

}))