import { useEffect, useState } from 'react'
import { ListPage } from './components/ListPage'
import { DetailPage } from './components/DetailPage'
import { MindsetPage } from './components/MindsetPage'
import type { StocksFile } from './types'

function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => {
      setHash(location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const [data, setData] = useState<StocksFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hash = useHash()

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/stocks.json`, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`데이터를 불러오지 못했어요 (HTTP ${r.status})`)
        return r.json() as Promise<StocksFile>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <p className="p-8 text-over">{error}</p>
  if (!data) return <p className="p-8 text-muted">불러오는 중…</p>

  if (hash === '#/mindset') return <MindsetPage />
  const code = hash.match(/^#\/stock\/(\d{6})/)?.[1]
  const stock = code && data.stocks.find((s) => s.code === code)
  if (stock) return <DetailPage key={stock.code} data={data} stock={stock} />
  return <ListPage data={data} />
}
