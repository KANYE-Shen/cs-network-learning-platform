/** 内容加载中的骨架占位块（与真实卡片同宽，避免加载后版面跳动） */
export function BlockSkeleton({ height = 'h-40' }: { height?: string }) {
  return (
    <div className="card p-5 space-y-3" aria-busy="true" aria-label="加载中">
      <div className="skeleton h-5 w-40" />
      <div className={`skeleton w-full ${height}`} />
      <div className="skeleton h-3 w-2/3" />
    </div>
  )
}
