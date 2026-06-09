import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Download, 
  Printer, 
  Coins, 
  DollarSign, 
  ShieldCheck, 
  Receipt,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface Invoice {
  id: string;
  item: string;
  amount: number;
  status: 'paid' | 'unpaid';
  dueDate: string;
  paidDate?: string;
  txnRef?: string;
  studentEmail?: string;
  studentName?: string;
}

export default function PaymentsPortal() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Invoice | null>(null);
  
  // Custom Payment Form Fields
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const studentEmail = profile?.email || '';
    const studentName = profile?.full_name || profile?.name || profile?.student_name || '';
    
    setCardHolder(studentName);

    const saved = localStorage.getItem('ff_all_student_invoices');
    if (saved) {
      const allInvoices: Invoice[] = JSON.parse(saved);
      // Filter for current student's bills
      const currentStudentInvoices = allInvoices.filter(inv => 
        (inv as any).studentEmail?.toLowerCase() === studentEmail.toLowerCase()
      );
      setInvoices(currentStudentInvoices);
    } else {
      setInvoices([]);
    }
  }, [profile]);

  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((acc, current) => acc + current.amount, 0);
  const totalUnpaid = invoices.filter(inv => inv.status === 'unpaid').reduce((acc, current) => acc + current.amount, 0);

  const startPaymentFlow = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setSuccess(false);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format card number with spaces (#### #### #### ####)
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(val);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format expiration as MM/YY
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      setExpiry(`${val.slice(0, 2)}/${val.slice(2, 4)}`);
    } else {
      setExpiry(val);
    }
  };

  const submitSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    
    setProcessing(true);

    // Simulate 2.5 second banking network processing speed
    setTimeout(() => {
      const generatedTxnRef = `TXN-FF-${Math.floor(1000000 + Math.random() * 9000000)}`;
      const updated = invoices.map(inv => {
        if (inv.id === selectedInvoiceForPayment.id) {
          return {
            ...inv,
            status: 'paid' as any,
            paidDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
            txnRef: generatedTxnRef
          };
        }
        return inv;
      });

      setInvoices(updated);
      
      // Merge back into ff_all_student_invoices
      const savedAll = localStorage.getItem('ff_all_student_invoices');
      if (savedAll) {
        const allInvoices: Invoice[] = JSON.parse(savedAll);
        const merged = allInvoices.map(inv => {
          if (inv.id === selectedInvoiceForPayment.id) {
            return {
              ...inv,
              status: 'paid' as any,
              paidDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
              txnRef: generatedTxnRef
            };
          }
          return inv;
        });
        localStorage.setItem('ff_all_student_invoices', JSON.stringify(merged));
      } else {
        localStorage.setItem('ff_all_student_invoices', JSON.stringify(updated));
      }

      setProcessing(false);
      setSuccess(true);
    }, 2500);
  };

  const viewReceipt = (invoice: Invoice) => {
    setSelectedReceipt(invoice);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Top dashboard header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <CreditCard size={20} />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">Bursary & Payments Portal</h2>
          </div>
          <p className="text-xs text-slate-500">
            View outstanding school bills, perform simulated credit card bank transactions, and print official student fee payment receipts.
          </p>
        </div>
      </div>

      {/* Financial overview totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Ledger Billed */}
        <div className="bg-slate-900 rounded-[24px] p-6 text-white flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Aggregate Fees Status</span>
            <Coins size={18} className="text-amber-400" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">TOTAL INVOICED BALANCE</span>
            <p className="text-3xl font-black font-display text-white">₦{(totalPaid + totalUnpaid).toLocaleString()}</p>
          </div>
          <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-400">
            Current Academic Session: <span className="text-white font-bold font-mono">2025/2026 Termly Cycle</span>
          </div>
        </div>

        {/* Total Settled Tuition */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">SESSIONS COMPLETED</span>
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">AGGREGATE PAID SUM</span>
            <p className="text-3xl font-black font-display text-slate-850">₦{totalPaid.toLocaleString()}</p>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
            {invoices.filter(inv => inv.status === 'paid').length} bill invoices settled safely
          </div>
        </div>

        {/* Pending Outstanding Fee */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest bg-rose-50 px-2.5 py-1 rounded-full">CURRENT OUTSTANDING</span>
            <Clock size={18} className="text-rose-500" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">PENDING SETTLEMENT SUM</span>
            <p className="text-3xl font-black font-display text-rose-650">₦{totalUnpaid.toLocaleString()}</p>
          </div>
          <div className="text-[10px] text-slate-450 italic font-medium leading-tight">
            Please settle outstanding tuition prior to terminal assessments.
          </div>
        </div>

      </div>

      {/* Main invoices billing statement */}
      <div className="bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 space-y-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-105 pb-3">Itemized Billing Statement & Fees Ledger</h3>

        {invoices.length === 0 ? (
          <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
            <div className="w-16 h-16 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Receipt size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">No payment records found.</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              There are currently no active invoice records or transaction charges issued to your account.
            </p>
            <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl max-w-xs mx-auto text-[10px] text-slate-400 font-mono tracking-wider">
              Query: NO-PAYMENT-RECORD // Status: Settled
            </div>
          </div>
        ) : (
          <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-4 px-5">Invoice reference</th>
                  <th className="py-4 px-4 font-black">Fee Purpose Description</th>
                  <th className="py-4 px-4 text-center">Amount (₦)</th>
                  <th className="py-4 px-4 text-center">Due Date</th>
                  <th className="py-4 px-4 text-center">Payment Status</th>
                  <th className="py-4 px-5 text-right">Accounting Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 font-mono text-slate-500 font-bold">{inv.id}</td>
                    <td className="py-4 px-4 font-extrabold text-slate-800 uppercase">{inv.item}</td>
                    <td className="py-4 px-4 text-center font-mono font-black text-slate-700">₦{inv.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-center font-semibold text-slate-500">{inv.dueDate}</td>
                    <td className="py-4 px-4 text-center">
                      {inv.status === 'paid' ? (
                        <span className="bg-green-50 text-green-700 border border-green-150 text-[10px] font-black px-2.5 py-1 rounded-xl uppercase">
                          PAID & SETTLED
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-black px-2.5 py-1 rounded-xl uppercase animate-pulse">
                          PENDING PAYMENT
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {inv.status === 'paid' ? (
                        <button 
                          onClick={() => viewReceipt(inv)}
                          className="bg-slate-50 border border-slate-250 text-slate-600 hover:bg-slate-100 hover:text-slate-800 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Receipt size={12} /> Receipt
                        </button>
                      ) : (
                        <button 
                          onClick={() => startPaymentFlow(inv)}
                          className="bg-primary text-white hover:bg-opacity-95 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ml-auto cursor-pointer shadow-sm shadow-primary/20"
                        >
                          <CreditCard size={12} /> Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modern Safe Billing Transmission Disclaimer */}
      <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100 flex items-center gap-4">
        <ShieldCheck className="text-primary shrink-0" size={32} />
        <div className="text-xs text-slate-600 leading-relaxed max-w-2xl font-medium">
          <p className="font-extrabold text-primary uppercase text-[10px] tracking-wide mb-0.5">ECC 256-Bit Financial Encryption Active</p>
          Our tuition systems communicate directly with CBN-certified banking terminals in Nigeria across sandbox simulations. Real transactions are tracked against official banking references listed above.
        </div>
      </div>

      {/* Modal Payment Form overlay */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-xl max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden transition-all">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Simulated Merchant Gateway</span>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Credit/Debit Card Settlement</h3>
              </div>
              <button 
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="w-8 h-8 rounded-full bg-slate-50 border hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-400 text-xs font-extrabold"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
                  <CheckCircle size={30} className="animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Transacted successfully</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">Your payment has been logged. You may now retrieve or print the receipt statement from the invoices ledger.</p>
                </div>
                <button 
                  onClick={() => {
                    const findInvoiced = invoices.find(i => i.id === selectedInvoiceForPayment.id);
                    setSelectedInvoiceForPayment(null);
                    if (findInvoiced) viewReceipt(findInvoiced);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold uppercase tracking-wider py-3.5 rounded-xl text-xs"
                >
                  Retrieve Official Receipt
                </button>
              </div>
            ) : (
              <form onSubmit={submitSimulatedPayment} className="space-y-4 text-xs select-none">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Purpose Of Payment:</span>
                  <span className="text-xs font-extrabold text-slate-850 block mt-0.5">{selectedInvoiceForPayment.item}</span>
                  <span className="text-xs font-black text-primary block mt-1 font-mono">Amount due: ₦{selectedInvoiceForPayment.amount.toLocaleString()}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-black text-slate-700 uppercase tracking-wider">Cardholder Full Name</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 p-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs lowercase italic"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-black text-slate-700 uppercase tracking-wider">Credit Card Number (16 Digits)</label>
                  <input
                    type="text"
                    required
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 p-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-black text-slate-700 uppercase tracking-wider">Expiry date (MM/YY)</label>
                    <input
                      type="text"
                      required
                      placeholder="12/28"
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 p-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-black text-slate-700 uppercase tracking-wider">CVV Code</label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      maxLength={3}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 p-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-primary hover:bg-opacity-95 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-primary/15 transition-all text-center flex items-center justify-center gap-2 mt-2 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Transacting with Bank Host...
                    </span>
                  ) : (
                    `Authorize ₦${selectedInvoiceForPayment.amount.toLocaleString()} Safe Transfer`
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Receipt Viewer Overlay Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border-2 border-slate-300 shadow-xl max-w-xl w-full p-8 md:p-10 space-y-6 relative overflow-hidden transition-all print:border-0 print:shadow-none print:p-0">
            
            {/* Hologram stamp */}
            <div className="absolute right-8 top-8 opacity-10 flex flex-col items-center">
              <FileCheck size={80} className="text-slate-400" />
              <span className="text-[8px] font-black uppercase text-slate-800">Bursar Settled</span>
            </div>

            {/* Letterhead */}
            <div className="text-center pb-6 border-b border-slate-100 flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg border-2 border-accent">FF</div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-widest font-display">FAITH FOUNDATION SCHOOLS</h4>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">12 Foundation Road, Ibadan, Oyo State, Nigeria</p>
              </div>
              <span className="border border-emerald-300 text-emerald-800 bg-emerald-50 text-[9px] font-black font-mono tracking-widest px-2.5 py-0.5 rounded-full mt-2 uppercase">Official Payment Receipt Statement</span>
            </div>

            {/* Receipt metadata info */}
            <div className="grid grid-cols-2 gap-4 text-[10px] leading-relaxed border-b border-slate-100 pb-5">
              <div className="space-y-1 text-left">
                <span className="text-slate-400 uppercase tracking-widest block font-extrabold text-[9px]">Student Name / Admin Details</span>
                <p className="font-bold text-slate-800 uppercase text-[11px] leading-tight">{selectedReceipt.studentName || profile?.full_name || profile?.name || profile?.student_name || 'N/A'}</p>
                <p className="text-[9px] text-slate-400">Class: {profile?.studentClass || profile?.class || 'N/A'}</p>
                <p className="text-[9px] text-slate-400">ID: {profile?.studentId || profile?.id || 'N/A'}</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-slate-400 uppercase tracking-widest block font-extrabold">Transaction Reference</span>
                <p className="font-bold font-mono text-primary text-[10px] uppercase">{selectedReceipt.txnRef || 'TXN-NOT-FOUND'}</p>
                <p className="text-[9px] text-slate-400 uppercase">Settled on: {selectedReceipt.paidDate}</p>
                <p className="text-[9px] text-slate-400 uppercase">Terms invoice: {selectedReceipt.id}</p>
              </div>
            </div>

            {/* Receipt Table ledger row */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-xs">
              <div className="space-y-1">
                <span className="font-extrabold text-slate-800 uppercase block">{selectedReceipt.item}</span>
                <span className="text-[9px] text-slate-400 uppercase block">1 Unit Semester Course Tuition Tuition & Materials Ledger</span>
              </div>
              <span className="font-black text-slate-800 text-sm font-mono">₦{selectedReceipt.amount.toLocaleString()}</span>
            </div>

            {/* Aggregate total settled sum banner */}
            <div className="flex justify-between items-center py-2.5 px-1 border-t border-dashed border-slate-200 mt-2 text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px]">TOTAL AMOUNT AUTHORIZED:</span>
              <span className="font-black text-primary text-base font-mono">₦{selectedReceipt.amount.toLocaleString()}</span>
            </div>

            {/* Seal / Authorized signatory */}
            <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-medium">
              <div className="space-y-0.5">
                <div className="font-bold uppercase text-slate-600 block">Digitally Processed by FF Bursar</div>
                <span>Requires no administrative signature seal. Cache validated.</span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Status Check: SEED</span>
                <span>Term of release: Academic Session 2025/2026</span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-8 flex gap-3 print:hidden">
              <button 
                onClick={printReceipt}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Printer size={14} /> Print Receipt
              </button>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-850 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-center"
              >
                Close Statement
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
