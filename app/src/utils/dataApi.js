// Talks to the dev-only /api/data/ endpoint registered in vite.config.js.
// Only works under `npm run dev` -- a production build (including this app
// deployed to GitHub Pages, or run locally via `vite preview`) has no
// server to write files to, so callers should fall back to downloadJson().

// import.meta.env.DEV is a build-time constant: true only in a bundle
// actually served by `vite dev`, false in any production build regardless
// of where that build is later hosted. Checking this lets callers know
// up front whether saving can possibly work, instead of only finding out
// after attempting a request that was always going to fail.
export const SAVE_API_AVAILABLE = import.meta.env.DEV

export async function saveSystem(filename, data) {
  if (!SAVE_API_AVAILABLE) {
    throw new Error(
      'Saving isn\'t available here -- this is a deployed, read-only copy of the app. ' +
        'Run it locally with "npm run dev" to save changes, or use "Download JSON" instead.',
    )
  }

  let res
  try {
    res = await fetch(`/api/data/${encodeURIComponent(filename)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    throw new Error('Could not reach the save API -- is "npm run dev" still running?')
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    // A dev-mode fetch failure still shouldn't dump a raw HTML/500 body into
    // the UI (e.g. a proxy or unrelated dev-server error page in front of
    // Vite) -- only show it if it actually looks like our own plain-text
    // error message from the bmlDataApi middleware.
    const message = body && !body.trimStart().startsWith('<') ? body : `Save failed (${res.status})`
    throw new Error(message)
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
