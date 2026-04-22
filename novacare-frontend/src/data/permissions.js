export const rolePermissions = {
  1: ['view_dashboard', 'manage_users', 'manage_inventory', 'manage_sales', 'view_reports', 'manage_settings', 'view_chats', 'manage_messages'],
  2: ['view_dashboard', 'manage_inventory', 'manage_sales', 'view_reports', 'view_chats', 'manage_messages'],
  3: ['view_inventory', 'manage_sales', 'view_chats', 'manage_messages'],
  4: ['view_medicines', 'place_orders', 'view_orders', 'view_chats']
};

export const hasPermission = (role, permission) => {
  return rolePermissions[role]?.includes(permission) ?? false;
};
