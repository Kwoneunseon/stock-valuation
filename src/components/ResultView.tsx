import { gap, type Result } from '../lib/formulas'
import { won } from '../lib/format'

export function GapBadge({ value, price }: { value: number; price: number }) {
  const p = gap(value, price)
  const under = p >= 0
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        under ? 'bg-under-bg text-under' : 'bg-over-bg text-over'
      }`}
    >
      {under ? '+' : '−'}
      {Math.abs(p).toFixed(1)}% {under ? '저평가' : '고평가'}
    </span>
  )
}

export function ResultView({ result, price, size = 'sm' }: { result: Result; price: number | null; size?: 'sm' | 'lg' }) {
  const valueClass = size === 'lg' ? 'text-2xl font-bold' : 'font-semibold'
  if (!result.ok) {
    return (
      <div>
        <div className={`${valueClass} text-muted`}>계산 불가</div>
        <div className="mt-1.5 text-xs text-muted">{result.reason}</div>
      </div>
    )
  }
  return (
    <div>
      <div className={valueClass}>
        {won(result.value)}
        {size === 'lg' && '원'}
      </div>
      {price !== null && (
        <div className="mt-1.5">
          <GapBadge value={result.value} price={price} />
        </div>
      )}
      {result.warning && <div className="mt-1 text-xs font-semibold text-over">{result.warning}</div>}
    </div>
  )
}
