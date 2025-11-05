// Deprecated: legacy localStorage migrations have been removed in favor of kvStore-only persistence.
// Kept as no-ops to avoid broken imports if any remain.

export function migrateAntrianInputDesain(): boolean {
  return false;
}

export function runAllMigrationsOnce(): void {
  // no-op
}
