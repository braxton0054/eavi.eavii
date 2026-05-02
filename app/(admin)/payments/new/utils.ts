export function fmt(n: number | string | null | undefined) {
  if (n == null || n === '') return ''
  const num = typeof n === 'number' ? n : parseFloat(String(n))
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function pct(fee: number, paid: number) {
  if (!fee) return 0
  return Math.round((paid / fee) * 100)
}

export function genReceipt() {
  const year = new Date().getFullYear()
  return `RCP-${year}-${Math.floor(Math.random() * 9000) + 1000}`
}

export function clrColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 95) return 'success'
  if (percent >= 50) return 'warning'
  return 'danger'
}
