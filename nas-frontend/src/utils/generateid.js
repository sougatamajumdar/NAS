export default function generateId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 12)
  )
}