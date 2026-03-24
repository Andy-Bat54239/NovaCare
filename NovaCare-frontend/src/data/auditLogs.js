export const auditLogs = [
  { id: 1, userId: 1, action: 'User Login', details: 'Admin logged in from 192.168.1.10', timestamp: '2026-03-23T08:00:00Z' },
  { id: 2, userId: 1, action: 'Create User', details: 'Created new pharmacist account for Diana Ross', timestamp: '2026-03-22T16:30:00Z' },
  { id: 3, userId: 5, action: 'Create Sale', details: 'Sale INV202603230001 created - Total: RWF 55,200', timestamp: '2026-03-23T10:15:00Z' },
  { id: 4, userId: 2, action: 'Approve Order', details: 'Order #4 approved for Sarah Brown', timestamp: '2026-03-22T14:00:00Z' },
  { id: 5, userId: 5, action: 'Create Sale', details: 'Sale INV202603230003 created - Total: RWF 26,000', timestamp: '2026-03-23T11:30:00Z' },
  { id: 6, userId: 1, action: 'Edit Medicine', details: 'Updated price for Amoxil from RWF 15,600 to RWF 16,900', timestamp: '2026-03-22T10:00:00Z' },
  { id: 7, userId: 3, action: 'Create Batch', details: 'Added batch BN-2026-040 for Voltaren - 200 units', timestamp: '2026-03-21T15:45:00Z' },
  { id: 8, userId: 6, action: 'Create Sale', details: 'Sale INV202603220002 created - Total: RWF 29,900', timestamp: '2026-03-22T12:45:00Z' },
  { id: 9, userId: 2, action: 'Reply Contact', details: 'Replied to contact message from Alice Cooper', timestamp: '2026-03-21T11:30:00Z' },
  { id: 10, userId: 7, action: 'Create Sale', details: 'Sale INV202603210002 created - Total: RWF 65,000', timestamp: '2026-03-21T13:30:00Z' },
  { id: 11, userId: 1, action: 'User Login', details: 'Admin logged in from 192.168.1.10', timestamp: '2026-03-21T08:05:00Z' },
  { id: 12, userId: 4, action: 'Reject Order', details: 'Order #6 rejected - No prescription provided for controlled substance', timestamp: '2026-03-20T16:00:00Z' },
  { id: 13, userId: 5, action: 'Create Sale', details: 'Sale INV202603200001 created - Total: RWF 76,700', timestamp: '2026-03-20T09:30:00Z' },
  { id: 14, userId: 1, action: 'Edit User', details: 'Deactivated account for Diana Ross', timestamp: '2026-03-19T17:00:00Z' },
  { id: 15, userId: 3, action: 'Create Batch', details: 'Added batch BN-2026-039 for Cipro - 100 units', timestamp: '2026-03-19T14:20:00Z' },
  { id: 16, userId: 6, action: 'User Login', details: 'Sophie Nguyen logged in from 192.168.2.15', timestamp: '2026-03-19T08:30:00Z' },
  { id: 17, userId: 1, action: 'Export Report', details: 'Exported weekly sales report (Mar 10-16)', timestamp: '2026-03-18T16:45:00Z' },
  { id: 18, userId: 5, action: 'Create Sale', details: 'Sale INV202603180001 created - Total: RWF 40,900', timestamp: '2026-03-18T11:30:00Z' },
  { id: 19, userId: 2, action: 'Approve Order', details: 'Order #5 approved for David Jones', timestamp: '2026-03-17T10:00:00Z' },
  { id: 20, userId: 1, action: 'Update Permission', details: 'Granted ExportReports permission to Marcus Lee', timestamp: '2026-03-16T09:00:00Z' },
];

export default auditLogs;
