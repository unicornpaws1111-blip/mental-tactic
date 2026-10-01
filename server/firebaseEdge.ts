/**
 * Edge-compatible Firebase Authentication & Token Verification.
 * Works seamlessly in Cloudflare Workers, Cloudflare Pages, Vercel, and Node.js.
 */

export interface DecodedGoogleUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
}

/**
 * Validates a Firebase / Google ID token using Google's secure tokeninfo service.
 * Operates purely over HTTPS fetch without gRPC or Node-only internal modules.
 */
export async function verifyGoogleTokenEdge(idToken: string): Promise<DecodedGoogleUser | null> {
  if (!idToken || typeof idToken !== 'string') return null;

  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Auth] Google token verification returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json() as any;
    if (!data.sub) return null;

    const email = (data.email || '').trim().toLowerCase();
    const name = data.name || (email ? email.split('@')[0] : 'Tactical Member');
    const picture = data.picture || '';

    return {
      uid: data.sub,
      email,
      name,
      picture,
    };
  } catch (err) {
    console.error('[Auth] Failed to verify Google token:', err);
    return null;
  }
}
