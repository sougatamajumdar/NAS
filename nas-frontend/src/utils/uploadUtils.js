import { sha256 as sha256Hash } from "js-sha256"

export async function sha256(file) {

  const buffer = await file.arrayBuffer()

  return sha256Hash(buffer)
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