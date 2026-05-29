export default function getErrorMessage(error) {

  if (!error) {
    return "Something went wrong"
  }

  if (error.code === "ERR_NETWORK") {
    return "Network error"
  }

  if (error.response?.data?.error) {
    return error.response.data.error
  }

  if (error.response?.data?.detail) {
    return error.response.data.detail
  }

  if (typeof error.response?.data === "string") {
    return error.response.data
  }

  if (error.message) {
    return error.message
  }

  return "Something went wrong"
}