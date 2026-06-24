import FileCard from "./FileCard"

export default function FileGrid({
  nodes,
  onUnshare = null
}) {
  console.log("Rendering FileGrid with nodes:", nodes)
  if (!nodes.length) {

    return (

      <div
        className="
          glass
          rounded-3xl
          p-16
          text-center
        "
      >

        <h3 className="text-xl font-semibold">
          No files found
        </h3>

        <p className="text-muted-foreground mt-2">
          Upload files to get started
        </p>

      </div>
    )
  }

  return (

    <div
      className="
        grid
        grid-cols-2
        sm:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
        2xl:grid-cols-6
        gap-5
      "
    >

      {nodes.map((node) => (

        <FileCard
          key={node.id}
          node={node}
          onUnshare={
            onUnshare
              ? () =>
                  onUnshare(
                    node.share_id,
                  )
              : undefined
          }
        />

      ))}

    </div>
  )
}