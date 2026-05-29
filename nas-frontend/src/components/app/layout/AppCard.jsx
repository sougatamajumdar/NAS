export default function AppCard({
  children,
  className = "",
}) {

  return (
    <div
      className={`
        glass
        rounded-3xl
        p-5
        shadow-2xl
        transition-all
        duration-300
        hover:border-white/10
        ${className}
      `}
    >
      {children}
    </div>
  )
}