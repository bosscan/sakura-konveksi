export const ROLE = {
  MANAGEMENT: 'management',
  CS: 'cs',
  ADMIN_PRODUKSI: 'admin_produksi',
  OPERATOR: 'operator',
} as const;

export type Role = typeof ROLE[keyof typeof ROLE];

export const MENU = {
  MARKET: 'market',
  METHOD: 'method',
  MESIN: 'mesin',
  MATERIAL: 'material',
  MANPOWER: 'manpower',
} as const;

export type MenuKey = typeof MENU[keyof typeof MENU];

export const allowedMenusForRole = (role?: Role): MenuKey[] => {
  switch (role) {
    case ROLE.MANAGEMENT:
      return [MENU.MARKET, MENU.METHOD, MENU.MESIN, MENU.MATERIAL, MENU.MANPOWER];
    case ROLE.CS:
      return [MENU.MARKET, MENU.METHOD];
    case ROLE.ADMIN_PRODUKSI:
      return [MENU.METHOD, MENU.MESIN, MENU.MATERIAL, MENU.MANPOWER];
    case ROLE.OPERATOR:
      return [MENU.METHOD];
    default:
      return [];
  }
};

export const canAccess = (role: Role | undefined, menu: MenuKey) => {
  if (!role) return false;
  return allowedMenusForRole(role).includes(menu);
};

// LocalStorage keys contract
export const LS_KEYS = {
  IS_AUTH: 'isAuthenticated',
  REMEMBER_USERNAME: 'remember_username',
  USER_ROLE: 'user_role',
};
import kvStore from './kvStore';

export const saveAuth = async (role: Role, username?: string, rememberUsername?: boolean) => {
  try {
    // Normalize to boolean true for consistent reads across app
    await kvStore.set(LS_KEYS.IS_AUTH, true);
    await kvStore.set(LS_KEYS.USER_ROLE, role);
    if (rememberUsername && username) await kvStore.set(LS_KEYS.REMEMBER_USERNAME, username);
    if (!rememberUsername) await kvStore.remove(LS_KEYS.REMEMBER_USERNAME);
    return true;
  } catch {
    return false;
  }
};

export const clearAuth = async () => {
  try {
    await kvStore.remove(LS_KEYS.IS_AUTH);
    await kvStore.remove(LS_KEYS.USER_ROLE);
  } catch {}
};
