// Utilities to migrate legacy localStorage data to current schema

const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isIsoString(s: unknown): s is string {
  return typeof s === 'string' && ISO_REGEX.test(s);
}

function toIsoFromDmy(dateStr: string): string | null {
  // Try dd-mm-yyyy and dd/mm/yyyy
  const m = dateStr.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  if (!y || !mo || !d) return null;
  const dt = new Date(y, mo - 1, d);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

function toIso(dateVal: any): string | null {
  if (!dateVal) return null;
  const s = String(dateVal).trim();
  if (isIsoString(s)) return s;
  // Common locale formats: MM/DD/YYYY, DD-MM-YYYY, DD/MM/YYYY
  // First try native Date parse (handles MM/DD/YYYY reliably in most envs)
  const native = new Date(s);
  if (!isNaN(native.getTime())) return native.toISOString();
  // Try DD-MM-YYYY or DD/MM/YYYY
  const dmy = toIsoFromDmy(s);
  if (dmy) return dmy;
  return null;
}

export function migrateAntrianInputDesain(): boolean {
  try {
    const key = 'antrian_input_desain';
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return false;
    let changed = false;
    const migrated = list.map((item: any) => {
      const copy = { ...item };
      // Normalize tanggalInput to ISO string
      const iso = toIso(copy.tanggalInput || copy.input_date || copy.inputDate || copy.createdAt);
      if (iso && !isIsoString(copy.tanggalInput)) {
        copy.tanggalInput = iso;
        changed = true;
      }
      // Ensure idSpk is a string
      if (copy.idSpk != null && typeof copy.idSpk !== 'string') {
        copy.idSpk = String(copy.idSpk);
        changed = true;
      }
      return copy;
    });
    if (changed) localStorage.setItem(key, JSON.stringify(migrated));
    return changed;
  } catch {
    return false;
  }
}

export function runAllMigrationsOnce(): void {
  try {
    const flagKey = 'migrations_ran_v1';
    if (localStorage.getItem(flagKey) === '1') return;
    migrateAntrianInputDesain();
    localStorage.setItem(flagKey, '1');
  } catch {
    // ignore
  }
}
