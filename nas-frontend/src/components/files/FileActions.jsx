import UploadBox from "@/components/upload/UploadBox"
import CreateFolderModal from "./CreateFolderModal"

export default function FileActions() {

  return (

    <div
      className="
        flex
        items-center
        gap-3
        flex-wrap
      "
    >

      <UploadBox compact />

      <CreateFolderModal />

    </div>
  )
}