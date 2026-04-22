export const orders = [
  { id: 1, customerName: 'John Smith', customerEmail: 'john.smith@email.com', customerPhone: '+250 788 300 401', branchId: 1, status: 'Completed', orderDate: '2026-03-01T08:00:00Z', totalAmount: 50700, items: [{ medicineId: 1, quantity: 2, unitPrice: 16900 }, { medicineId: 5, quantity: 1, unitPrice: 7800 }], prescriptionImage: true },
  { id: 2, customerName: 'Emily Johnson', customerEmail: 'emily.j@email.com', customerPhone: '+250 722 300 402', branchId: 2, status: 'Completed', orderDate: '2026-03-03T10:30:00Z', totalAmount: 29900, items: [{ medicineId: 8, quantity: 1, unitPrice: 29900 }], prescriptionImage: true },
  { id: 3, customerName: 'Michael Williams', customerEmail: 'michael.w@email.com', customerPhone: '+250 733 300 403', branchId: 1, status: 'Completed', orderDate: '2026-03-05T09:15:00Z', totalAmount: 39000, items: [{ medicineId: 7, quantity: 3, unitPrice: 13000 }], prescriptionImage: false },
  { id: 4, customerName: 'Sarah Brown', customerEmail: 'sarah.b@email.com', customerPhone: '+250 788 300 404', branchId: 3, status: 'Approved', orderDate: '2026-03-10T14:00:00Z', totalAmount: 59800, items: [{ medicineId: 20, quantity: 1, unitPrice: 59800 }], prescriptionImage: true },
  { id: 5, customerName: 'David Jones', customerEmail: 'david.jones@email.com', customerPhone: '+250 722 300 405', branchId: 1, status: 'Approved', orderDate: '2026-03-12T11:30:00Z', totalAmount: 33800, items: [{ medicineId: 1, quantity: 2, unitPrice: 16900 }], prescriptionImage: true },
  { id: 6, customerName: 'Jessica Garcia', customerEmail: 'jess.garcia@email.com', customerPhone: '+250 733 300 406', branchId: 2, status: 'Rejected', orderDate: '2026-03-13T09:45:00Z', totalAmount: 119600, items: [{ medicineId: 20, quantity: 2, unitPrice: 59800 }], prescriptionImage: false },
  { id: 7, customerName: 'Robert Martinez', customerEmail: 'rob.martinez@email.com', customerPhone: '+250 788 300 407', branchId: 1, status: 'Pending', orderDate: '2026-03-18T10:00:00Z', totalAmount: 43500, items: [{ medicineId: 6, quantity: 1, unitPrice: 20800 }, { medicineId: 2, quantity: 1, unitPrice: 11000 }, { medicineId: 7, quantity: 1, unitPrice: 13000 }], prescriptionImage: false },

  // Pending orders WITH mock prescription images
  {
    id: 8,
    customerName: 'Amanda Davis', customerEmail: 'amanda.d@email.com', customerPhone: '+250 788 300 408',
    branchId: 3, status: 'Pending', orderDate: '2026-03-19T13:20:00Z', totalAmount: 32500,
    items: [
      { medicineId: 10, quantity: 1, unitPrice: 32500, prescriptionDataUrl: '/medicines/Ventolin.jpeg', prescriptionName: 'prescription_ventolin.jpg' },
    ],
    prescriptionImage: true, hasPrescription: true,
  },
  {
    id: 9,
    customerName: 'Christopher Miller', customerEmail: 'chris.m@email.com', customerPhone: '+250 733 300 409',
    branchId: 1, status: 'Pending', orderDate: '2026-03-20T08:30:00Z', totalAmount: 75400,
    items: [
      { medicineId: 3, quantity: 1, unitPrice: 19500, prescriptionDataUrl: '/medicines/glucophage.jpeg', prescriptionName: 'rx_glucophage.jpg' },
      { medicineId: 9, quantity: 1, unitPrice: 26000, prescriptionDataUrl: '/medicines/zithromax.jpeg', prescriptionName: 'rx_zithromax.jpg' },
      { medicineId: 8, quantity: 1, unitPrice: 29900, prescriptionDataUrl: '/medicines/Lipitor.jpeg', prescriptionName: 'rx_lipitor.jpg' },
    ],
    prescriptionImage: true, hasPrescription: true,
  },
  { id: 10, customerName: 'Lisa Wilson', customerEmail: 'lisa.w@email.com', customerPhone: '+250 722 300 410', branchId: 2, status: 'Pending', orderDate: '2026-03-21T11:00:00Z', totalAmount: 22100, items: [{ medicineId: 2, quantity: 2, unitPrice: 11000 }], prescriptionImage: false },
  {
    id: 11,
    customerName: 'Daniel Taylor', customerEmail: 'dan.taylor@email.com', customerPhone: '+250 788 300 411',
    branchId: 1, status: 'Pending', orderDate: '2026-03-22T09:15:00Z', totalAmount: 58500,
    items: [
      { medicineId: 4, quantity: 1, unitPrice: 24100, prescriptionDataUrl: '/medicines/norvasc.jpeg', prescriptionName: 'prescription_norvasc.jpg' },
      { medicineId: 1, quantity: 1, unitPrice: 16900, prescriptionDataUrl: '/medicines/amoxil.jpeg', prescriptionName: 'prescription_amoxil.jpg' },
      { medicineId: 15, quantity: 1, unitPrice: 18200, prescriptionDataUrl: '/medicines/Cipro.jpeg', prescriptionName: 'prescription_cipro.jpg' },
    ],
    prescriptionImage: true, hasPrescription: true,
  },
  { id: 12, customerName: 'Karen Anderson', customerEmail: 'karen.a@email.com', customerPhone: '+250 733 300 412', branchId: 3, status: 'Pending', orderDate: '2026-03-22T15:30:00Z', totalAmount: 24700, items: [{ medicineId: 17, quantity: 2, unitPrice: 12300 }], prescriptionImage: false },
  { id: 13, customerName: 'Matthew Thomas', customerEmail: 'matt.thomas@email.com', customerPhone: '+250 722 300 413', branchId: 2, status: 'Pending', orderDate: '2026-03-23T08:00:00Z', totalAmount: 41600, items: [{ medicineId: 6, quantity: 2, unitPrice: 20800 }], prescriptionImage: false },
  {
    id: 14,
    customerName: 'Jennifer Jackson', customerEmail: 'jen.jackson@email.com', customerPhone: '+250 788 300 414',
    branchId: 1, status: 'Pending', orderDate: '2026-03-23T10:45:00Z', totalAmount: 89700,
    items: [
      { medicineId: 8, quantity: 1, unitPrice: 29900, prescriptionDataUrl: '/medicines/Lipitor.jpeg', prescriptionName: 'rx_lipitor_jen.jpg' },
      { medicineId: 20, quantity: 1, unitPrice: 59800, prescriptionDataUrl: '/medicines/Lantus.jpeg', prescriptionName: 'rx_lantus_jen.jpg' },
    ],
    prescriptionImage: true, hasPrescription: true,
  },
  {
    id: 15,
    customerName: 'Andrew White', customerEmail: 'andrew.white@email.com', customerPhone: '+250 733 300 415',
    branchId: 3, status: 'Pending', orderDate: '2026-03-23T12:00:00Z', totalAmount: 36400,
    items: [
      { medicineId: 15, quantity: 2, unitPrice: 18200, prescriptionDataUrl: '/medicines/Cipro.jpeg', prescriptionName: 'prescription_cipro_andrew.jpg' },
    ],
    prescriptionImage: true, hasPrescription: true,
  },
];

export default orders;
