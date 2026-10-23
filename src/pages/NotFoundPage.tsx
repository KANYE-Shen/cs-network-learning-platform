import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="card p-12 text-center">
      <div className="text-4xl mb-3">🧭</div>
      <h1 className="text-xl font-bold mb-2">页面不存在</h1>
      <p className="text-sm muted mb-6">你访问的地址可能已经变更，或者内容尚未加入。</p>
      <div className="flex gap-2 justify-center">
        <Link to="/" className="btn-primary">返回首页</Link>
        <Link to="/questions" className="btn-outline">去题库</Link>
      </div>
    </div>
  )
}
