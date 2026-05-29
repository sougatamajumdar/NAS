import { createBrowserRouter, Navigate } from "react-router-dom"

import LoginPage from "@/pages/auth/LoginPage"

import DashboardPage from "@/pages/dashboard/DashboardPage"
import SharedPage from "@/pages/shared/SharedPage"
import StoragePage from "@/pages/storage/StoragePage"
import AdminPage from "@/pages/admin/AdminPage"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AppLayout from "@/layout/AppLayout.jsx"

import ProtectedRoute from "@/components/routes/ProtectedRoute.jsx"
import AdminRoute from "@/components/routes/AdminRoute.jsx"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),

    children: [
      {
        index: true,
        element: <Navigate to="/drive" replace />,
      },

      {
        path: "drive",
        element: <DashboardPage />,
      },

      {
        path: "shared",
        element: <SharedPage />,
      },

      {
        path: "storage",
        element: <StoragePage />,
      },

      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        ),
      },
    ],
  },
])

export default router