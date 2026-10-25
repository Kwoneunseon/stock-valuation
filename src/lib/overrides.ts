export type Overrides = { r?: string; g?: string; y?: string }

const key = (code: string) => `fv:${code}`

export function loadOverrides(code: string): Overrides {
  try {
    return JSON.parse(localStorage.getItem(key(code)) ?? '{}') as Overrides
  } catch {
    return {}
  }
}

export function saveOverrides(code: string, o: Overrides) {
  try {
    if (Object.keys(o).length === 0) localStorage.removeItem(key(code))
    else localStorage.setItem(key(code), JSON.stringify(o))
  } catch {
    // 저장 못 해도 이번 화면 계산에는 지장 없다
  }
}
