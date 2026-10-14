const VIDEO_ID = /^[\w-]{11}$/;

const HOSTS = new Set(['youtube.com', 'm.youtube.com', 'youtube-nocookie.com']);

export function getYouTubeId(url: string | null | undefined) {
  if (!url) return null;

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return VIDEO_ID.test(id) ? id : null;
    }

    if (HOSTS.has(host)) {
      const fromQuery = parsed.searchParams.get('v');
      if (fromQuery && VIDEO_ID.test(fromQuery)) return fromQuery;

      const [kind, id] = parsed.pathname.split('/').filter(Boolean);
      const known = kind === 'embed' || kind === 'shorts' || kind === 'live' || kind === 'v';
      if (known && id && VIDEO_ID.test(id)) return id;
    }
  } catch {
    return null;
  }

  return null;
}