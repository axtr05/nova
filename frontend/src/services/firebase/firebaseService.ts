import { db, auth, storage, app } from "@/frontend/lib/firebase/config";

export const sanitizeFirestoreData = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeFirestoreData);
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = sanitizeFirestoreData(value);
    }
  }
  return sanitized;
};

export { db, auth, storage, app };
