// src/store/shareStore.js

import { create } from "zustand"

import api from "@/services/api"

export const useShareStore = create(
  (set, get) => ({

    users: [],

    userSearch: "",

    selectedUser: null,

    shareLoading: false,

    shareMessage: "",

    setUserSearch: (value) =>
      set({
        userSearch: value
      }),

    setSelectedUser: (user) =>
      set({
        selectedUser: user,
        userSearch: user.username,
        users: [],
      }),

    clearShareState: () =>
      set({
        users: [],
        userSearch: "",
        selectedUser: null,
        shareLoading: false,
        shareMessage: "",
      }),

    // SEARCH USERS
    searchUsers: async (query) => {

      if (!query.trim()) {

        set({
          users: []
        })

        return
      }

      try {

        const response = await api.get(
          `/users/search/?q=${query}`
        )

        set({
          users: response.data
        })

      } catch (error) {

        console.error(error)
      }
    },

    // SHARE NODE
    shareNode: async (nodeId) => {

      const {
        selectedUser
      } = get()

      if (!selectedUser) {
        return
      }

      set({
        shareLoading: true,
        shareMessage: "",
      })

      try {

        await api.post("/share/", {
          node_id: nodeId,
          user_id: selectedUser.id,
        })

        set({
          shareMessage:
            "Shared successfully",
          shareLoading: false,
        })

      } catch (error) {

        set({
          shareMessage:
            error.response?.data?.error ||
            "Share failed",

          shareLoading: false,
        })
      }
    },
  })
)