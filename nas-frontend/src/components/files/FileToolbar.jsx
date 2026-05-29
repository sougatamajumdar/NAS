import CreateFolderModal from "./CreateFolderModal"

export default function FileToolbar() {

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">

      <div>
        <h2 className="text-xl font-semibold">
          Files
        </h2>
      </div>

      <div className="flex items-center gap-3">

        <CreateFolderModal />

      </div>

    </div>
  )
}