import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"

export default function ProtectedRoute({ children }) {

  const {
    user,
    initialized
  } = useAuthStore()

  if (!initialized) {
    return (
      <div className="h-screen flex items-center justify-center">
        ProtectLoading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}