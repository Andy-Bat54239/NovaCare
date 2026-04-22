export const permissions = [
  { id: 1, name: 'ViewDashboard', description: 'View the dashboard' },
  { id: 2, name: 'ViewMedicines', description: 'View medicines list' },
  { id: 3, name: 'CreateMedicines', description: 'Add new medicines' },
  { id: 4, name: 'EditMedicines', description: 'Edit existing medicines' },
  { id: 5, name: 'DeleteMedicines', description: 'Delete medicines' },
  { id: 6, name: 'ViewBatches', description: 'View batches list' },
  { id: 7, name: 'CreateBatches', description: 'Add new batches' },
  { id: 8, name: 'ViewSales', description: 'View sales records' },
  { id: 9, name: 'CreateSales', description: 'Create new sales' },
  { id: 10, name: 'ViewCustomers', description: 'View customers list' },
  { id: 11, name: 'CreateCustomers', description: 'Add new customers' },
  { id: 12, name: 'EditCustomers', description: 'Edit customer info' },
  { id: 13, name: 'ViewOrders', description: 'View orders list' },
  { id: 14, name: 'ApproveOrders', description: 'Approve or reject orders' },
  { id: 15, name: 'ViewReports', description: 'View reports' },
  { id: 16, name: 'ExportReports', description: 'Export report data' },
  { id: 17, name: 'ViewUsers', description: 'View user accounts' },
  { id: 18, name: 'CreateUsers', description: 'Create new users' },
  { id: 19, name: 'EditUsers', description: 'Edit user accounts' },
  { id: 20, name: 'ViewContactMessages', description: 'View contact messages' },
  { id: 21, name: 'ReplyContactMessages', description: 'Reply to messages' },
  { id: 22, name: 'ManagePermissions', description: 'Manage user permissions' },
  { id: 23, name: 'ViewAuditLog', description: 'View audit log' },
  { id: 24, name: 'ManageSettings', description: 'Manage system settings' },
];

// Admin gets all, Manager gets branch-level, Pharmacist gets basic operations
export const rolePermissions = {
  1: permissions.map(p => p.name), // Admin - all permissions
  2: [
    'ViewDashboard', 'ViewMedicines', 'CreateMedicines', 'EditMedicines',
    'ViewBatches', 'CreateBatches',
    'ViewSales', 'CreateSales',
    'ViewCustomers', 'CreateCustomers', 'EditCustomers',
    'ViewOrders', 'ApproveOrders',
    'ViewReports',
    'ViewContactMessages', 'ReplyContactMessages',
  ], // Manager - branch operations, no users/audit/export/permissions
  3: [
    'ViewDashboard',
    'ViewMedicines',
    'ViewBatches',
    'ViewSales', 'CreateSales',
    'ViewCustomers', 'CreateCustomers',
    'ViewOrders',
  ], // Pharmacist - view + create sales only
};

export default permissions;
