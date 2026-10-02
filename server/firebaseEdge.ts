/**
 * Edge-compatible Firebase Authentication & Token Verification.
 * Verifies Firebase ID tokens using Firebase Auth REST API.
 */

export interface DecodedGoogleUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
}

export async function verifyGoogleTokenEdge(
  idToken: string,
  apiKey: string
): Promise<DecodedGoogleUser | null> {
  if (!idToken || typeof idToken !== 'string' || !apiKey) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: idToken.trim(),
        }),
      }
    );

    if (!res.ok) {
      console.warn(`[Auth] Firebase token verification returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json() as any;
    const firebaseUser = data?.users?.[0];

    if (!firebaseUser?.localId) return null;

    const email = (firebaseUser.email || '').trim().toLowerCase();
    const name =
      firebaseUser.displayName ||
      (email ? email.split('@')[0] : 'Tactical Member');
    const picture = firebaseUser.photoUrl || '';

    return {
      uid: firebaseUser.localId,
      email,
      name,
      picture,
    };
  } catch (err) {
    console.error('[Auth] Failed to verify Firebase ID token:', err);
    return null;
  }
}