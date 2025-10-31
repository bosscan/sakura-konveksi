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

export const saveAuth = (role: Role, username?: string, rememberUsername?: boolean) => {
  try {
    localStorage.setItem(LS_KEYS.IS_AUTH, 'true');
    localStorage.setItem(LS_KEYS.USER_ROLE, role);
    if (rememberUsername && username) localStorage.setItem(LS_KEYS.REMEMBER_USERNAME, username);
    if (!rememberUsername) localStorage.removeItem(LS_KEYS.REMEMBER_USERNAME);
    return true;
  } catch {
    return false;
  }
};

export const clearAuth = () => {
  try {
    localStorage.removeItem(LS_KEYS.IS_AUTH);
    localStorage.removeItem(LS_KEYS.USER_ROLE);
  } catch {}
};
