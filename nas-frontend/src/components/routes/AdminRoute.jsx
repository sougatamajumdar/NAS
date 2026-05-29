import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"

export default function AdminRoute({ children }) {

  const {
    user,
    initialized
  } = useAuthStore()

  if (!initialized) {
    return (
      <div className="h-screen flex items-center justify-center">
        AdminLoading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.is_staff && !user.is_superuser) {
    return <Navigate to="/" replace />
  }

  return children
}