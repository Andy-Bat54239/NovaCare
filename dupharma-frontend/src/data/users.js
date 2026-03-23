export const users = [
  { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@novacare.com', password: 'admin123', role: 1, branchId: 1, isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 2, firstName: 'Rachel', lastName: 'Green', email: 'rachel@novacare.com', password: 'manager123', role: 2, branchId: 1, isActive: true, createdAt: '2025-02-15T09:00:00Z' },
  { id: 3, firstName: 'Marcus', lastName: 'Lee', email: 'marcus@novacare.com', password: 'manager123', role: 2, branchId: 2, isActive: true, createdAt: '2025-03-01T09:00:00Z' },
  { id: 4, firstName: 'Fatima', lastName: 'Al-Rashid', email: 'fatima@novacare.com', password: 'manager123', role: 2, branchId: 3, isActive: true, createdAt: '2025-03-20T09:00:00Z' },
  { id: 5, firstName: 'James', lastName: 'Carter', email: 'james@novacare.com', password: 'pharma123', role: 3, branchId: 1, isActive: true, createdAt: '2025-04-10T09:00:00Z' },
  { id: 6, firstName: 'Sophie', lastName: 'Nguyen', email: 'sophie@novacare.com', password: 'pharma123', role: 3, branchId: 2, isActive: true, createdAt: '2025-05-01T09:00:00Z' },
  { id: 7, firstName: 'Omar', lastName: 'Hassan', email: 'omar@novacare.com', password: 'pharma123', role: 3, branchId: 3, isActive: true, createdAt: '2025-06-15T09:00:00Z' },
  { id: 8, firstName: 'Diana', lastName: 'Ross', email: 'diana@novacare.com', password: 'pharma123', role: 3, branchId: 1, isActive: false, createdAt: '2025-07-01T09:00:00Z' },
];

export const getRoleName = (role) => {
  switch (role) {
    case 1: return 'Admin';
    case 2: return 'Manager';
    case 3: return 'Pharmacist';
    default: return 'Unknown';
  }
};

export default users;
