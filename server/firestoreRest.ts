/**
 * Lightweight, zero-dependency Cloud Firestore REST API Client.
 * Fully compatible with Cloudflare Workers, Cloudflare Pages, Vercel, and Node.js.
 * Operates purely over standard HTTPS fetch() without gRPC, C++ addons, or Node internals.
 */

export interface FirestoreField {
  stringValue?: string;
  doubleValue?: number;
  integerValue?: string;
  booleanValue?: boolean;
  nullValue?: null;
  mapValue?: { fields: Record<string, FirestoreField> };
  arrayValue?: { values: FirestoreField[] };
}

export function toFirestoreValue(val: any): FirestoreField {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, FirestoreField> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(field: FirestoreField): any {
  if (!field) return null;
  if ('stringValue' in field) return field.stringValue;
  if ('doubleValue' in field) return field.doubleValue;
  if ('integerValue' in field) return parseInt(field.integerValue || '0', 10);
  if ('booleanValue' in field) return field.booleanValue;
  if ('nullValue' in field) return null;
  if ('arrayValue' in field) {
    return (field.arrayValue?.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in field) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(field.mapValue?.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return null;
}

export function toFirestoreDoc(data: Record<string, any>): { fields: Record<string, FirestoreField> } {
  const fields: Record<string, FirestoreField> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return { fields };
}

export function fromFirestoreDoc<T = any>(doc: any): T {
  if (!doc || !doc.fields) return doc as T;
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields as Record<string, FirestoreField>)) {
    res[k] = fromFirestoreValue(v);
  }
  return res as T;
}

export class FirestoreRestClient {
  private projectId: string;
  private apiKey?: string;

  constructor(projectId?: string, apiKey?: string) {
    this.projectId = (
      projectId ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      'mental-tactic'
    ).trim();
    this.apiKey = apiKey || process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  }

  private baseUrl(collection: string, docId?: string): string {
    const base = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${collection}`;
    const url = docId ? `${base}/${encodeURIComponent(docId)}` : base;
    return this.apiKey ? `${url}?key=${this.apiKey}` : url;
  }

  async getCollection<T = any>(collection: string): Promise<T[]> {
    try {
      const url = this.baseUrl(collection);
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json() as any;
      if (!json.documents || !Array.isArray(json.documents)) return [];
      return json.documents.map((d: any) => fromFirestoreDoc<T>(d));
    } catch {
      return [];
    }
  }

  async getDocument<T = any>(collection: string, docId: string): Promise<T | null> {
    try {
      const url = this.baseUrl(collection, docId);
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json() as any;
      return fromFirestoreDoc<T>(json);
    } catch {
      return null;
    }
  }

  async setDocument(collection: string, docId: string, data: Record<string, any>): Promise<boolean> {
    try {
      const url = this.baseUrl(collection, docId);
      const payload = toFirestoreDoc(data);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async deleteDocument(collection: string, docId: string): Promise<boolean> {
    try {
      const url = this.baseUrl(collection, docId);
      const res = await fetch(url, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }
}

let restClientInstance: FirestoreRestClient | null = null;

export function getFirestoreRestClient(): FirestoreRestClient {
  if (!restClientInstance) {
    restClientInstance = new FirestoreRestClient();
  }
  return restClientInstance;
}
