import { create } from "zustand"
import api from "@/services/api"

export const useStorageStore = create((set) => ({

  stats: null,

  storageLoading: false,

  fetchStorageStats: async () => {

    try {

      set({
        storageLoading: true
      })

      const response = await api.get(
        "/storage/stats/"
      )

      set({
        stats: response.data,
        storageLoading: false
      })

    } catch (error) {

      console.error(error)

      set({
        storageLoading: false
      })
    }
  }
}))