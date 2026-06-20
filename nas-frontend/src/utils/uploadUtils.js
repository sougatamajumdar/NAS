export async function sha256(file) {
  const buffer = await file.arrayBuffer()

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      buffer
    )

  return [...new Uint8Array(hashBuffer)]
    .map((b) =>
      b.toString(16).padStart(2, "0")
    )
    .join("")
}

export function createChunks(
  file,
  chunkSize = 5 * 1024 * 1024
) {

  const chunks = []

  let start = 0

  while (start < file.size) {

    chunks.push(
      file.slice(
        start,
        start + chunkSize
      )
    )

    start += chunkSize
  }

  return chunks
}

