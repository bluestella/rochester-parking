export interface InvoiceItem {
  kind: string;
  description: string;
  amount: number;
}

export interface Invoice {
  _id: string;
  number: string;
  buildingName: string;
  unitNumber: string;
  period: string;
  items: InvoiceItem[];
  total: number;
  amountPaid: number;
  balance: number;
  status: 'open' | 'paid' | 'void';
  displayStatus: string;
  dueDate: string;
}

export interface Payment {
  _id: string;
  amount: number;
  method: string;
  reference?: string;
  receiptNumber?: string;
  paidAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
  note?: string;
  invoiceId?: { _id: string; number: string; period: string; buildingName: string; unitNumber: string };
  submittedBy?: { name: string; role?: string };
}

export interface BillingSettings {
  duesRatePerSqm: number;
  parkingFee: number;
  dueDay: number;
  penaltyRatePercent: number;
  paymentInstructions?: string;
}
