// Remembers the last app page so reopening the mini app returns there, not to the intro.
const KEY = "wall:last-page";
const PAGES = ["/tasks", "/battle", "/heroes", "/raid", "/wallet", "/profile", "/nft"];

export function rememberPage(path: string) {
  if (PAGES.includes(path)) try { localStorage.setItem(KEY, path); } catch { /* private mode */ }
}

export function lastPage(): string | null {
  try {
    const p = localStorage.getItem(KEY);
    return p && PAGES.includes(p) ? p : null;
  } catch { return null; }
}
