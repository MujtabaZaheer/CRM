/**
 * Firestore Data Sanitizer
 * Recursively strips undefined fields and cleans values to guarantee valid Firestore document payloads.
 * Prevents "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    // Keep Date objects or special types intact if needed, otherwise convert plain objects
    if (obj instanceof Date) {
      return obj;
    }

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestoreData(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}
