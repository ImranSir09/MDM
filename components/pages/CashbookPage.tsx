import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PDFPreviewModal from '../ui/PDFPreviewModal';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import { CashbookEntry, HeadOfAccount, PaymentMode, TransactionType } from '../../types';
import { getOpeningBalanceInfo } from '../../services/summaryCalculator';

// Note: jsPDF and AutoTable are included via index.html, accessed via window.jspdf

const HEADS_OF_ACCOUNT: HeadOfAccount[] = [
    'Opening Balance',
    'Government Grant',
    'Cooking Cost',
    'Food Grains',
    'Transportation',
    'Honorarium',
    'Miscellaneous'
];

type CashbookTab = 'add' | 'view' | 'reports';

const numberToWords = (numInput: number): string => {
    let num = numInput;
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const numStr = num.toString();
    if (numStr.length > 9) return 'overflow';
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (parseInt(n[1]) !== 0) ? (a[Number(n[1])] || b[parseInt(n[1][0])] + ' ' + a[parseInt(n[1][1])]) + 'Crore ' : '';
    str += (parseInt(n[2]) !== 0) ? (a[Number(n[2])] || b[parseInt(n[2][0])] + ' ' + a[parseInt(n[2][1])]) + 'Lakh ' : '';
    str += (parseInt(n[3]) !== 0) ? (a[Number(n[3])] || b[parseInt(n[3][0])] + ' ' + a[parseInt(n[3][1])]) + 'Thousand ' : '';
    str += (parseInt(n[4]) !== 0) ? (a[Number(n[4])] || b[parseInt(n[4][0])] + ' ' + a[parseInt(n[4][1])]) + 'Hundred ' : '';
    str += (parseInt(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[parseInt(n[5][0])] + ' ' + a[parseInt(n[5][1])]) + 'Only' : '';
    return str.trim() || 'Zero';
};

const CashbookPage: React.FC = () => {
    const { data, addCashbookEntry, deleteCashbookEntry } = useData();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<CashbookTab>('view');

    const todayString = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const [formDate, setFormDate] = useState(todayString);
    const [formType, setFormType] = useState<TransactionType>('Receipt');
    const [formHead, setFormHead] = useState<HeadOfAccount>('Government Grant');
    const [formDesc, setFormDesc] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formMode, setFormMode] = useState<PaymentMode>('Bank');
    const [formRefNo, setFormRefNo] = useState('');
    const [formPaidTo, setFormPaidTo] = useState('');
    const [formReceivedFrom, setFormReceivedFrom] = useState('');

    const [filterMonth, setFilterMonth] = useState(todayString.substring(0, 7)); // YYYY-MM
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [receiptPreviewOpen, setReceiptPreviewOpen] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const allCombinedEntries = useMemo(() => {
        const explicitEntries = data.cashbook || [];
        
        const autoReceipts = (data.receipts || [])
            .map(r => {
                 const totalCash = (r.cash?.balvatika || 0) + (r.cash?.primary || 0) + (r.cash?.middle || 0);
                 if (totalCash <= 0) return null;
                 return {
                     id: `auto-rec-${r.id}`,
                     voucherNo: `REC-${r.date.replace(/-/g, '')}`,
                     date: r.date,
                     type: 'Receipt' as TransactionType,
                     headOfAccount: 'Cooking Cost' as HeadOfAccount,
                     description: 'Auto-fetched MDM Grant Receipt',
                     amount: totalCash,
                     paymentMode: 'Bank' as PaymentMode,
                     receivedFrom: 'Govt. Grant',
                     balance: 0,
                     enteredBy: 'System',
                     isAuto: true
                 };
            })
            .filter(Boolean) as (CashbookEntry & { isAuto?: boolean })[];

        const monthlyPayments = new Map<string, { totalAmount: number, totalStudents: number, lastDate: string }>();

        (data.entries || []).forEach(e => {
            if (!e.consumption || (e.consumption.total || 0) <= 0) return;
            const month = e.date.substring(0, 7);
            if (!monthlyPayments.has(month)) {
                monthlyPayments.set(month, { totalAmount: 0, totalStudents: 0, lastDate: e.date });
            }
            const current = monthlyPayments.get(month)!;
            current.totalAmount += e.consumption.total;
            current.totalStudents += e.totalPresent;
            if (e.date > current.lastDate) {
                current.lastDate = e.date;
            }
        });

        const autoPayments = Array.from(monthlyPayments.entries()).map(([month, data]) => {
             return {
                 id: `auto-pay-${month}`,
                 voucherNo: `PAY-${month.replace(/-/g, '')}`,
                 date: data.lastDate,
                 type: 'Payment' as TransactionType,
                 headOfAccount: 'Cooking Cost' as HeadOfAccount,
                 description: `Aggregated MDM Cost for ${month} (${data.totalStudents} students total)`,
                 amount: data.totalAmount,
                 paymentMode: 'Cash' as PaymentMode,
                 paidTo: 'Monthly Consumption',
                 balance: 0,
                 enteredBy: 'System',
                 isAuto: true
             };
        }) as (CashbookEntry & { isAuto?: boolean })[];

        const combined = [...explicitEntries, ...autoReceipts, ...autoPayments];
        
        combined.sort((a, b) => {
            const dateCmp = a.date.localeCompare(b.date);
            if (dateCmp !== 0) return dateCmp;
            if (a.type !== b.type) return a.type === 'Receipt' ? -1 : 1;
            return 0;
        });

        return combined;
    }, [data.cashbook, data.receipts, data.entries]);

    const isFormValid = useMemo(() => {
        const amt = parseFloat(formAmount);
        const amtValid = !isNaN(amt) && amt > 0;
        const baseValid = !!formDate && !!formHead && !!formDesc && amtValid && !!formMode;
        if (!baseValid) return false;
        
        if (formType === 'Payment' && !formPaidTo) return false;
        if (formType === 'Receipt' && !formReceivedFrom) return false;
        
        return true;
    }, [formDate, formHead, formDesc, formAmount, formMode, formType, formPaidTo, formReceivedFrom]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(formAmount);
        if (isNaN(amt) || amt <= 0) {
            showToast('Amount must be positive.', 'error');
            return;
        }

        const newEntry: Omit<CashbookEntry, 'id' | 'balance' | 'voucherNo'> = {
            date: formDate,
            type: formType,
            headOfAccount: formHead,
            description: formDesc,
            amount: amt,
            paymentMode: formMode,
            referenceNo: formRefNo,
            enteredBy: data.auth?.username || 'Admin',
        };

        if (formType === 'Payment') newEntry.paidTo = formPaidTo;
        if (formType === 'Receipt') newEntry.receivedFrom = formReceivedFrom;

        addCashbookEntry(newEntry);
        showToast('Cashbook entry saved!', 'success');
        
        // Reset form
        setFormDesc('');
        setFormAmount('');
        setFormRefNo('');
        setFormPaidTo('');
        setFormReceivedFrom('');
        setActiveTab('view');
    };

    const confirmDelete = () => {
        if (deleteId) {
            if (deleteId.startsWith('auto-')) {
                 showToast('Cannot delete auto-generated entries from Cashbook. Please delete from Receipts/Daily entry instead.', 'error');
                 setDeleteId(null);
                 return;
            }
            deleteCashbookEntry(deleteId);
            showToast('Entry deleted successfully.', 'success');
            setDeleteId(null);
        }
    };

    const { monthEntries, totalReceipts, totalPayments, closingBalance, openingBalance } = useMemo(() => {
        const { balance } = getOpeningBalanceInfo(data, filterMonth);
        const opBal = (balance.cash?.balvatika || 0) + (balance.cash?.primary || 0) + (balance.cash?.middle || 0);

        let entries = allCombinedEntries.filter(e => e.date.startsWith(filterMonth));
        let receipts = 0;
        let payments = 0;
        let currentBalance = opBal;

        const entriesWithBalance = entries.map(e => {
            if (e.type === 'Receipt') {
                receipts += e.amount;
                currentBalance += e.amount;
            } else if (e.type === 'Payment') {
                payments += e.amount;
                currentBalance -= e.amount;
            }
            return { ...e, balance: currentBalance };
        });

        let filteredEntries = entriesWithBalance;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filteredEntries = filteredEntries.filter(e => 
                e.description.toLowerCase().includes(term) ||
                e.headOfAccount.toLowerCase().includes(term) ||
                e.voucherNo.toLowerCase().includes(term) ||
                (e.paidTo && e.paidTo.toLowerCase().includes(term)) ||
                (e.receivedFrom && e.receivedFrom.toLowerCase().includes(term))
            );
        }

        return {
            openingBalance: opBal,
            closingBalance: currentBalance,
            monthEntries: filteredEntries,
            totalReceipts: receipts,
            totalPayments: payments
        };
    }, [allCombinedEntries, filterMonth, searchTerm, data]);

    const [pdfPreviewData, setPdfPreviewData] = useState<{ url: string, blob: Blob, filename: string, type: 'receipt' | 'report', id?: string } | null>(null);

    const generateReceiptPDF = (receiptId: string) => {
        const entry = allCombinedEntries.find(e => e.id === receiptId);
        if (!entry) return;

        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF();
            
            // Header Background
            doc.setFillColor(79, 70, 229); // Indigo 600
            doc.rect(0, 0, 210, 25, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text('PM POSHAN OFFICIAL RECEIPT', 105, 16, { align: 'center' });
            
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(12);
            doc.text(`School: ${data.settings.schoolDetails.name}`, 14, 34);
            doc.text(`UDISE: ${data.settings.schoolDetails.udise}`, 14, 40);
            
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(14, 44, 196, 44);

            doc.setFontSize(11);
            doc.text(`Receipt No: ${entry.voucherNo}`, 14, 54);
            doc.text(`Date: ${new Date(entry.date).toLocaleDateString('en-IN')}`, 140, 54);
            
            doc.text(`Received From: ${entry.receivedFrom || 'N/A'}`, 14, 64);
            
            // Highlight Amount
            doc.setFillColor(240, 253, 244); // Green 50
            doc.setDrawColor(34, 197, 94); // Green 500
            doc.roundedRect(14, 70, 182, 16, 2, 2, 'FD');
            doc.setTextColor(21, 128, 61); // Green 700
            doc.setFontSize(12);
            doc.text(`Amount: Rs. ${entry.amount.toFixed(2)}`, 18, 76);
            doc.setFontSize(10);
            doc.text(`(Rupees ${numberToWords(Math.floor(entry.amount))} Only)`, 18, 82);
            
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(11);
            doc.text(`Head of Account: ${entry.headOfAccount}`, 14, 98);
            doc.text(`Description: ${entry.description}`, 14, 106);
            doc.text(`Payment Mode: ${entry.paymentMode}`, 14, 114);
            if (entry.referenceNo) {
                doc.text(`Reference No/UPI Txn: ${entry.referenceNo}`, 14, 122);
            }

            doc.setDrawColor(200, 200, 200);
            doc.line(14, 134, 196, 134);
            
            doc.text('Authorized Signatory', 140, 154);
            doc.text(`(${data.settings.mdmIncharge.name || 'Headmaster/In-charge'})`, 140, 160);
            
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            setPdfPreviewData({ url: pdfUrl, blob: pdfBlob, filename: `Receipt_${entry.voucherNo}.pdf`, type: 'receipt', id: receiptId });
        } catch (e) {
            console.error(e);
            showToast('Failed to generate PDF. Make sure plugins are loaded.', 'error');
        }
    };

    const generateMonthlyReportPDF = () => {
        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF();
            
            doc.setFillColor(79, 70, 229); // Indigo
            doc.rect(0, 0, 210, 22, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text('PM POSHAN Monthly Cashbook Export', 105, 14, { align: 'center' });
            
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(10);
            doc.text(`School: ${data.settings.schoolDetails.name} (${data.settings.schoolDetails.udise})`, 14, 30);
            const [y, m] = filterMonth.split('-');
            const monthName = new Date(parseInt(y), parseInt(m)-1).toLocaleString('default', { month: 'long' });
            doc.text(`Month: ${monthName} ${y}`, 14, 36);
            
            // Opening balance card
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.rect(14, 40, 90, 8, 'FD');
            doc.text(`Opening Balance: Rs. ${openingBalance < 0 ? '-' : ''}${Math.abs(openingBalance).toFixed(2)}`, 16, 46);

            const tableData = monthEntries.map(e => [
                new Date(e.date).toLocaleDateString('en-IN'),
                e.voucherNo,
                e.headOfAccount + '\n' + e.description,
                e.type === 'Receipt' ? e.amount.toFixed(2) : '-',
                e.type === 'Payment' ? e.amount.toFixed(2) : '-',
                `${e.balance < 0 ? '-' : ''}${Math.abs(e.balance).toFixed(2)}`
            ]);

            (doc as any).autoTable({
                startY: 52,
                head: [['Date', 'Voucher', 'Particulars', 'Receipts (Rs)', 'Payments (Rs)', 'Balance']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                styles: { fontSize: 8, cellPadding: 2 },
            });

            const finalY = (doc as any).lastAutoTable.finalY || 52;
            
            // Totals card
            doc.setFillColor(240, 253, 244);
            doc.setDrawColor(187, 247, 208);
            doc.rect(14, finalY + 5, 182, 18, 'FD');
            
            doc.setFontSize(10);
            doc.setTextColor(21, 128, 61);
            doc.text(`Total Receipts: Rs. ${totalReceipts.toFixed(2)}`, 16, finalY + 11);
            doc.setTextColor(225, 29, 72);
            doc.text(`Total Payments: Rs. ${totalPayments.toFixed(2)}`, 16, finalY + 16);
            doc.setTextColor(50, 50, 50);
            doc.setFont('inter', 'bold');
            doc.text(`Closing Balance: Rs. ${closingBalance < 0 ? '-' : ''}${Math.abs(closingBalance).toFixed(2)}`, 16, finalY + 21);
            doc.setFont('inter', 'normal');

            doc.text('Signature (Headmaster)', 14, finalY + 45);
            doc.text('Signature (SMC Chairman)', 130, finalY + 45);

            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            setPdfPreviewData({ url: pdfUrl, blob: pdfBlob, filename: `Cashbook_${filterMonth}.pdf`, type: 'report' });
        } catch(e) {
            console.error(e);
            showToast('Failed to generate export.', 'error');
        }
    };

    return (
        <div className="space-y-4">
             {/* Sub-navigation Tabs */}
             <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto hide-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
                {(['view', 'add', 'reports'] as CashbookTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === tab 
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab === 'add' && 'Add Entry'}
                        {tab === 'view' && 'View Cashbook'}
                        {tab === 'reports' && 'Export Reports'}
                    </button>
                ))}
            </div>

            {/* View Tab */}
            {activeTab === 'view' && (
                <div className="space-y-4 animate-fade-in text-sm">
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Opening Balance</p>
                            <p className={`text-lg font-bold ${openingBalance < 0 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {openingBalance < 0 ? '-' : ''}₹{Math.abs(openingBalance).toFixed(2)}
                            </p>
                            {openingBalance < 0 && <span className="text-[10px] text-red-500">Deficit Balance</span>}
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Mo. Incoming</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+₹{totalReceipts.toFixed(2)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Mo. Expense</p>
                            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">-₹{totalPayments.toFixed(2)}</p>
                        </div>
                         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-center items-start">
                             <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">Filter Month</label>
                             <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs" />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <Input label="Search Transactions" id="cb-search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search payee, desc, head..." wrapperClassName="flex-1" />
                    </div>

                    <Card title="Cashbook Entries" className="overflow-hidden">
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-96">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="p-3 font-medium text-slate-500">Date/Vch</th>
                                        <th className="p-3 font-medium text-slate-500">Particulars</th>
                                        <th className="p-3 font-medium text-slate-500 text-right">Receipts</th>
                                        <th className="p-3 font-medium text-slate-500 text-right">Payments</th>
                                        <th className="p-3 font-medium text-slate-500 text-right">Balance</th>
                                        <th className="p-3 font-medium text-slate-500 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthEntries.length === 0 ? (
                                        <tr><td colSpan={6} className="p-4 text-center text-slate-500">No entries found for this month.</td></tr>
                                    ) : (
                                        monthEntries.map(entry => {
                                            const isLargeTransaction = entry.amount >= 10000;
                                            return (
                                            <tr key={entry.id} className={`border-b border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-950 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 ${isLargeTransaction ? 'border-l-4 border-l-amber-500' : ''}`}>
                                                <td className="p-3 whitespace-nowrap">
                                                    <div>{new Date(entry.date).toLocaleDateString('en-IN')}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{entry.voucherNo}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium text-slate-700 dark:text-slate-300">
                                                        {entry.headOfAccount} 
                                                        {isLargeTransaction && <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-medium text-amber-800 ml-1">Large Amount</span>}
                                                        {(entry as any).isAuto && <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-medium text-blue-800 ml-1">Auto</span>}
                                                    </div>
                                                    <div className="text-slate-500 line-clamp-1">{entry.description}</div>
                                                    <div className="text-[10px] text-indigo-400 mt-0.5">{entry.paymentMode} {entry.type === 'Payment' ? `• Paid: ${entry.paidTo}` : entry.type === 'Receipt' ? `• From: ${entry.receivedFrom}` : ''}</div>
                                                </td>
                                                <td className="p-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                                    {entry.type === 'Receipt' ? entry.amount.toFixed(2) : '-'}
                                                </td>
                                                <td className="p-3 text-right font-medium text-rose-600 dark:text-rose-400">
                                                    {entry.type === 'Payment' ? entry.amount.toFixed(2) : '-'}
                                                </td>
                                                <td className={`p-3 text-right font-bold ${entry.balance < 0 ? 'text-red-500' : ''}`}>
                                                    {entry.balance < 0 ? '-' : ''}₹{Math.abs(entry.balance).toFixed(2)}
                                                </td>
                                                <td className="p-3 text-center space-y-1">
                                                    {entry.type === 'Receipt' && (
                                                        <button onClick={() => generateReceiptPDF(entry.id)} className="block w-full px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100 text-[10px]">
                                                            PDF
                                                        </button>
                                                    )}
                                                    <button onClick={() => setDeleteId(entry.id)} className={`block w-full px-2 py-1 ${(entry as any).isAuto ? 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'} rounded text-[10px]`} title={(entry as any).isAuto ? "Auto entries cannot be deleted here" : ""}>
                                                        Del
                                                    </button>
                                                </td>
                                            </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Add Tab */}
            {activeTab === 'add' && (
                <div className="animate-fade-in">
                    <Card title="Add Transaction">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Date" id="cb-date" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required max={todayString} />
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                                    <select value={formType} onChange={e => setFormType(e.target.value as TransactionType)} className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-white border">
                                        <option value="Receipt">Receipt (+)</option>
                                        <option value="Payment">Payment (-)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Head of Account</label>
                                <select value={formHead} onChange={e => setFormHead(e.target.value as HeadOfAccount)} className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-white border">
                                    {HEADS_OF_ACCOUNT.map(head => <option key={head} value={head}>{head}</option>)}
                                </select>
                            </div>

                            <Input label="Description / Particulars" id="cb-desc" value={formDesc} onChange={e => setFormDesc(e.target.value)} required placeholder="Brief detail about transaction" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Amount (₹)" id="cb-amt" type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} required min="0.01" />
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Mode</label>
                                    <select value={formMode} onChange={e => setFormMode(e.target.value as PaymentMode)} className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-white border">
                                        <option value="Cash">Cash</option>
                                        <option value="Bank">Bank</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>
                            </div>

                            {formMode !== 'Cash' && (
                                <Input label="Reference No. / Txn ID (Optional)" id="cb-ref" value={formRefNo} onChange={e => setFormRefNo(e.target.value)} placeholder="Cheque No. / UPI Ref" />
                            )}

                            {formType === 'Payment' && (
                                <Input label="Paid To" id="cb-paidto" value={formPaidTo} onChange={e => setFormPaidTo(e.target.value)} placeholder="Vendor/Person Name" required />
                            )}

                            {formType === 'Receipt' && (
                                <Input label="Received From" id="cb-recvfrom" value={formReceivedFrom} onChange={e => setFormReceivedFrom(e.target.value)} placeholder="Govt/Bank/Person" required />
                            )}

                            <Button type="submit" className="w-full mt-4" disabled={!isFormValid}>Save {formType}</Button>
                        </form>
                    </Card>
                </div>
            )}

             {/* Reports Tab */}
             {activeTab === 'reports' && (
                <div className="animate-fade-in space-y-4">
                     <Card title="Monthly Cashbook Report">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Export the official PM POSHAN Cashbook format as a PDF for auditing and signatures.</p>
                        <div className="space-y-4">
                             <div className="space-y-1">
                                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Month</label>
                                 <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-white" />
                            </div>
                            <Button onClick={generateMonthlyReportPDF} className="w-full flex justify-center items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Download {filterMonth} PDF
                            </Button>
                        </div>
                     </Card>
                </div>
            )}

            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Transaction">
                <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete this cashbook entry? This will recalculate all subsequent balances.</p>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                </div>
            </Modal>

            {pdfPreviewData && (
                <PDFPreviewModal
                    isOpen={!!pdfPreviewData}
                    onClose={() => setPdfPreviewData(null)}
                    pdfUrl={pdfPreviewData.url}
                    pdfBlob={pdfPreviewData.blob}
                    filename={pdfPreviewData.filename}
                    onRegenerate={() => {
                        if (pdfPreviewData.type === 'receipt' && pdfPreviewData.id) {
                            generateReceiptPDF(pdfPreviewData.id);
                        } else if (pdfPreviewData.type === 'report') {
                            generateMonthlyReportPDF();
                        }
                    }}
                />
            )}
        </div>
    );
};

export default CashbookPage;
