export default function PageContainer({
  children,
  className = "",
}) {

  return (
    <div
      className={`
        w-full
        h-full
        overflow-auto
        p-6
        lg:p-8
        space-y-6
        ${className}
      `}
    >
      {children}
    </div>
  )
}