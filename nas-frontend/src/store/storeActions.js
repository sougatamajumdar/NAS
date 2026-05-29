import { toast } from "sonner"
import getErrorMessage from "@/utils/getErrorMessage"

export async function storeAction({
  action,
  loading,
  set,
  successMessage,
  errorMessage,
  showSuccess = false,
  onSuccess,
  onError,
}) {

  try {

    if (loading) {
      set({ [loading]: true })
    }

    const result = await action()

    if (showSuccess && successMessage) {
      toast.success(successMessage)
    }

    if (onSuccess) {
      onSuccess(result)
    }

    return {
      success: true,
      data: result,
    }

  } catch (error) {

    console.error(error)

    const message =
      getErrorMessage(error) ||
      errorMessage ||
      "Something went wrong"

    toast.error(message)

    if (onError) {
      onError(error)
    }

    return {
      success: false,
      error: message,
    }

  } finally {

    if (loading) {
      set({ [loading]: false })
    }
  }
}