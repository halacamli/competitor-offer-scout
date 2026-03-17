export default function LoadingState({ label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200">
      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
      <span className="truncate">{label}</span>
    </div>
  )
}

