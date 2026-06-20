import { ChevronRight } from "lucide-react"

import { useFileStore } from "@/store/fileStore"

export default function Breadcrumbs() {

  const {
    folderStack,
    fetchNodes
  } = useFileStore()

  const handleRoot = () => {

    useFileStore.setState({
      folderStack: []
    })

    fetchNodes(null)
  }

  const handleClick = (index, folder) => {

    const newStack =
      folderStack.slice(0, index + 1)

    useFileStore.setState({
      folderStack: newStack
    })

    fetchNodes(folder.id, 1)
  }

  return (
          <div
        className="
          flex
          items-center
          flex-wrap
          gap-2
          glass
          rounded-2xl
          px-4
          py-3
          text-sm
        "
      >

      <button
        onClick={handleRoot}
        className="hover:text-white text-zinc-400"
      >
        My Drive
      </button>

      {folderStack.map((folder, index) => (

        <div
          key={folder.id}
          className="flex items-center gap-2"
        >

          <ChevronRight size={16} />

          <button
            onClick={() =>
              handleClick(index, folder)
            }
            className="hover:text-white text-zinc-400"
          >
            {folder.name}
          </button>

        </div>
      ))}

    </div>
  )
}