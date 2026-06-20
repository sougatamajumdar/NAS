import { create } from "zustand"
import { persist } from "zustand/middleware"
import api from "@/services/api"
import { useFileStore } from "./fileStore"

export const useAuthStore = create( persist ((set) => ({

  user: null,

  loading: false,

  initialized: false,

  fetchCSRF: async () => {
    try {
      await api.get("/auth/csrf/")
    } catch (error) {
      console.error(error)
    }
  },

  login: async (data) => {

    set({ loading: true })

    try {

      await api.get("/auth/csrf/")

      const response = await api.post(
        "/auth/login/",
        data
      )

      set({
        user: response.data.user,
        loading: false,
      })

      return {
        success: true
      }

    } catch (error) {

      set({ loading: false })

      return {
        success: false,
        error:
          error.response?.data ||
          "Login failed"
      }
    }
  },

  logout: async () => {

    try {

      await api.post("/auth/logout/")
      
      useFileStore.getState().resetStore()

      useFileStore.persist.clearStorage()
      set({
        user: null
      })

    } catch (error) {
      console.error(error)
    }
  },

  checkAuth: async () => {

    try {

      const response = await api.get("/auth/me/")
      console.log("Auth check response:", response.data)  // Debugging line
      set({
        user: response.data,
        initialized: true,
        loading: false,
      })

    } catch (error) {
      if (error.response?.status !== 403) {
          console.error(error)
      }
      set({
        user: null,
        initialized: true,
        loading: false,
      })
    }
  }

}),{
  name: "auth-store",

  partialize: (state) => ({
    user: state.user,
  }),
}
));