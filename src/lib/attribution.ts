import type { TrafficAttribution } from '../types/store';

const ATTRIBUTION_KEY = 'mistandturf_attribution_v1';
const SESSION_ID_KEY = 'mistandturf_session_id_v1';
const VISIT_LOGGED_KEY = 'mistandturf_visit_logged_v1';

export function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const generated = `sess_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    sessionStorage.setItem(SESSION_ID_KEY, generated);
    return generated;
  } catch {
    return `sess_${Date.now().toString(36)}`;
  }
}

function normalizeSource(
  utmSource: string | null,
  ttclid: string | null,
  referrer: string | null
): string {
  const s = (utmSource ?? '').trim().toLowerCase();
  const ref = (referrer ?? '').trim().toLowerCase();

  if (ttclid || s.includes('tiktok') || s === 'tt' || ref.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (s.includes('instagram') || s === 'ig' || ref.includes('instagram.com')) {
    return 'instagram';
  }
  if (s.includes('facebook') || s === 'fb' || ref.includes('facebook.com')) {
    return 'facebook';
  }
  if (s.includes('google') || ref.includes('google.')) {
    return 'google';
  }
  if (s.includes('youtube') || s === 'yt' || ref.includes('youtube.com')) {
    return 'youtube';
  }
  if (s.length > 0) return s;
  if (ref.length > 0) {
    try {
      const host = new URL(ref).hostname.replace(/^www\./, '');
      return host || 'referral';
    } catch {
      return 'referral';
    }
  }
  return 'direct';
}

export function captureAndGetAttribution(): TrafficAttribution {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  const utmContent = params.get('utm_content');
  const ttclid = params.get('ttclid');
  const rawReferrer = document.referrer || null;

  const hasIncomingParams = Boolean(utmSource || utmMedium || utmCampaign || utmContent || ttclid);

  if (hasIncomingParams) {
    const fresh: TrafficAttribution = {
      source: normalizeSource(utmSource, ttclid, rawReferrer),
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      ttclid,
      referrer: rawReferrer,
      landing_path: window.location.pathname + window.location.search,
    };
    try {
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(fresh));
    } catch {
      // ignore storage errors
    }
    return fresh;
  }

  try {
    const stored = localStorage.getItem(ATTRIBUTION_KEY);
    if (stored) {
      return JSON.parse(stored) as TrafficAttribution;
    }
  } catch {
    // ignore storage errors
  }

  const fallback: TrafficAttribution = {
    source: normalizeSource(null, null, rawReferrer),
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    ttclid: null,
    referrer: rawReferrer,
    landing_path: window.location.pathname || '/',
  };

  try {
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(fallback));
  } catch {
    // ignore
  }

  return fallback;
}

export function forceSetAttributionForTest(source: string, campaign: string): TrafficAttribution {
  const tested: TrafficAttribution = {
    source,
    utm_medium: 'paid_social',
    utm_campaign: campaign,
    utm_content: 'video_hook_01',
    ttclid: source === 'tiktok' ? `tt_${Math.random().toString(36).slice(2, 10)}` : null,
    referrer: source === 'tiktok' ? 'https://www.tiktok.com/' : null,
    landing_path: `/?utm_source=${source}&utm_campaign=${campaign}`,
  };
  try {
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(tested));
    sessionStorage.removeItem(VISIT_LOGGED_KEY);
  } catch {
    // ignore
  }
  return tested;
}

export function shouldLogSessionVisit(): boolean {
  try {
    if (sessionStorage.getItem(VISIT_LOGGED_KEY)) return false;
    sessionStorage.setItem(VISIT_LOGGED_KEY, '1');
    return true;
  } catch {
    return true;
  }
}
