import { KecamatanData } from './types';

export interface FormDraft {
  hariTanggal: string;
  tim: string;
  customTim?: string;
  kecamatanList: KecamatanData[];
  savedAt: number; // Date.now()
}

const DB_NAME = 'kantah_medan_draft_db';
const DB_VERSION = 1;
const STORE_NAME = 'draft_store';
const DRAFT_KEY = 'active_draft';
const LS_META_KEY = 'kantah_medan_draft_meta';

/**
 * Open or create IndexedDB instance
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save current active form draft to IndexedDB (supports native Files, Blobs, base64)
 */
export async function saveFormDraft(draft: FormDraft): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(draft, DRAFT_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.onabort = () => reject(tx.error);
    });

    // Also save lightweight metadata to localStorage for instant check
    try {
      localStorage.setItem(
        LS_META_KEY,
        JSON.stringify({
          savedAt: draft.savedAt,
          tim: draft.tim,
          hariTanggal: draft.hariTanggal,
          totalKecamatan: draft.kecamatanList.length,
        })
      );
    } catch (_) {}
  } catch (err) {
    console.warn('Could not save draft to IndexedDB, falling back to localStorage:', err);
    // Fallback: save text & metrics only to localStorage
    try {
      const safeKecamatanList = draft.kecamatanList.map((k) => ({
        ...k,
        sitataFiles: (k.sitataFiles || []).map((s) => ({
          id: s.id,
          status: s.status,
          pdfBase64: s.pdfBase64,
        })),
        kkpPairs: (k.kkpPairs || []).map((p) => ({
          id: p.id,
          mode: p.mode,
          status: p.status,
          pdfBase64: p.pdfBase64,
        })),
      }));

      localStorage.setItem(
        'kantah_medan_form_draft_fallback',
        JSON.stringify({
          ...draft,
          kecamatanList: safeKecamatanList,
        })
      );
    } catch (_) {}
  }
}

/**
 * Load draft from IndexedDB, restoring object URLs for preview images
 */
export async function loadFormDraft(): Promise<FormDraft | null> {
  if (typeof window === 'undefined') return null;

  try {
    const db = await openDB();
    const rawDraft = await new Promise<FormDraft | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(DRAFT_KEY);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (!rawDraft) {
      return loadFallbackDraft();
    }

    // Rehydrate Blob/File URLs because blob: URLs expire on page refresh
    if (Array.isArray(rawDraft.kecamatanList)) {
      rawDraft.kecamatanList = rawDraft.kecamatanList.map((k) => {
        // 1. Rehydrate SITATA files
        const rehydratedSitata = (k.sitataFiles || []).map((s) => {
          let previewUrl = s.previewUrl;
          if (s.file && s.file.type.startsWith('image/')) {
            try {
              previewUrl = URL.createObjectURL(s.file);
            } catch (_) {}
          } else if (s.pdfBase64 && s.pdfBase64.startsWith('data:image/')) {
            previewUrl = s.pdfBase64;
          }
          return {
            ...s,
            previewUrl,
          };
        });

        // 2. Rehydrate KKP pairs
        const rehydratedKkp = (k.kkpPairs || []).map((p) => {
          let beforePreview = p.beforePreview;
          let afterPreview = p.afterPreview;
          let mergedUrl = p.mergedUrl;

          if (p.beforeFile) {
            try {
              beforePreview = URL.createObjectURL(p.beforeFile);
            } catch (_) {}
          }
          if (p.afterFile) {
            try {
              afterPreview = URL.createObjectURL(p.afterFile);
            } catch (_) {}
          }
          if (p.mergedBlob) {
            try {
              mergedUrl = URL.createObjectURL(p.mergedBlob);
            } catch (_) {}
          }

          return {
            ...p,
            beforePreview,
            afterPreview,
            mergedUrl,
          };
        });

        return {
          ...k,
          sitataFiles: rehydratedSitata,
          kkpPairs: rehydratedKkp,
        };
      });
    }

    return rawDraft;
  } catch (err) {
    console.warn('IndexedDB load failed, trying localStorage fallback:', err);
    return loadFallbackDraft();
  }
}

function loadFallbackDraft(): FormDraft | null {
  try {
    const raw = localStorage.getItem('kantah_medan_form_draft_fallback');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Clear the draft from both IndexedDB and localStorage
 */
export async function clearFormDraft(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(DRAFT_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (_) {}

  try {
    localStorage.removeItem(LS_META_KEY);
    localStorage.removeItem('kantah_medan_form_draft_fallback');
  } catch (_) {}
}
