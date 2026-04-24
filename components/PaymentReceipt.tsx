'use client';

import { useEffect, useRef } from 'react';

interface PaymentReceiptProps {
  receiptNumber: string;
  studentName: string;
  admissionNumber: string;
  paymentDate: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  semester: number;
  module: number;
  transactionId?: string;
  collegeName?: string;
  collegeAddress?: string;
}

export default function PaymentReceipt({
  receiptNumber,
  studentName,
  admissionNumber,
  paymentDate,
  amount,
  paymentType,
  paymentMethod,
  semester,
  module,
  transactionId,
  collegeName = 'EAVI College',
  collegeAddress = 'Nairobi, Kenya'
}: PaymentReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=600,height=800');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt ${receiptNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .logo { font-size: 24px; font-weight: bold; color: #6b21a8; }
                .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .info-section { flex: 1; }
                .label { font-weight: bold; color: #666; }
                .value { margin-bottom: 5px; }
                .amount { font-size: 24px; font-weight: bold; color: #6b21a8; text-align: center; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                .signature { margin-top: 30px; display: flex; justify-content: space-between; }
                .signature-line { width: 200px; border-top: 1px solid #333; text-align: center; padding-top: 5px; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadPDF = () => {
    if (receiptRef.current) {
      // For now, we'll use print to PDF
      // In production, you might use a library like jsPDF or html2pdf
      handlePrint();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 font-semibold"
        >
          Print Receipt
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 font-semibold"
        >
          Download PDF
        </button>
      </div>

      <div ref={receiptRef} className="bg-white p-8 max-w-2xl mx-auto border border-gray-300">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-purple-900 pb-4">
          <h1 className="text-3xl font-bold text-purple-900">{collegeName}</h1>
          <p className="text-gray-600">{collegeAddress}</p>
          <h2 className="text-xl font-bold text-gray-800 mt-4">OFFICIAL RECEIPT</h2>
        </div>

        {/* Receipt Info */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Receipt Number:</span>
            <span className="font-mono font-bold">{receiptNumber}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Date:</span>
            <span>{new Date(paymentDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-gray-800 mb-2">Student Information</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{studentName}</span>
            </div>
            <div>
              <span className="text-gray-600">Admission No:</span>
              <span className="ml-2 font-mono">{admissionNumber}</span>
            </div>
            <div>
              <span className="text-gray-600">Semester:</span>
              <span className="ml-2">{semester}</span>
            </div>
            <div>
              <span className="text-gray-600">Module:</span>
              <span className="ml-2">{module}</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-2">Payment Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Type:</span>
              <span className="capitalize">{paymentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="capitalize">{paymentMethod}</span>
            </div>
            {transactionId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono">{transactionId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-center py-6 bg-purple-50 rounded-lg border-2 border-purple-900">
          <p className="text-gray-600 mb-1">Amount Paid</p>
          <p className="text-4xl font-bold text-purple-900">KES {amount.toLocaleString()}</p>
          <p className="text-gray-600 mt-2 capitalize">{amountInWords(amount)} Kenyan Shillings Only</p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="flex justify-between mt-8">
            <div className="text-center">
              <div className="w-48 border-t border-gray-400 pt-2 text-sm text-gray-600">
                Student Signature
              </div>
            </div>
            <div className="text-center">
              <div className="w-48 border-t border-gray-400 pt-2 text-sm text-gray-600">
                College Stamp & Signature
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-6">
            This receipt serves as proof of payment. Please keep it for your records.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert amount to words
function amountInWords(amount: number): string {
  // Simplified version - in production, use a proper number-to-words library
  if (amount === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (amount < 20) {
    return ones[Math.floor(amount)];
  }
  
  if (amount < 100) {
    const ten = Math.floor(amount / 10);
    const one = amount % 10;
    return tens[ten] + (one ? ' ' + ones[one] : '');
  }
  
  if (amount < 1000) {
    const hundred = Math.floor(amount / 100);
    const remainder = amount % 100;
    return ones[hundred] + ' Hundred' + (remainder ? ' and ' + amountInWords(remainder) : '');
  }
  
  if (amount < 1000000) {
    const thousand = Math.floor(amount / 1000);
    const remainder = amount % 1000;
    return amountInWords(thousand) + ' Thousand' + (remainder ? ' ' + amountInWords(remainder) : '');
  }
  
  return amount.toString();
}
