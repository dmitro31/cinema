const ID_PATTERN = /^[\w-]{6,20}$/;

export function getYouTubeId(url: string | null | undefined) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^(www|m)\./, '');
    const segments = parsed.pathname.split('/').filter(Boolean);
    let id: string | null = null;

    if (host === 'youtu.be') {
      id = segments[0] ?? null;
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') {
        id = parsed.searchParams.get('v');
      } else if (segments[0] === 'embed' || segments[0] === 'shorts') {
        id = segments[1] ?? null;
      }
    }

    return id && ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(url: string | null | undefined) {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
}

export function getYouTubeThumbnail(url: string | null | undefined) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}
