// Talks to the dev-only /api/data/ endpoint registered in vite.config.js.
// Only works under `npm run dev` -- a production build has no server to
// write files to, so callers should fall back to downloadJson().

export async function saveSystem(filename, data) {
  const res = await fetch(`/api/data/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error((await res.text()) || `Save failed (${res.status})`)
  }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
