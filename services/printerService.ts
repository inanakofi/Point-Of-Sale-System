
import { Transaction, StoreSettings } from "../types";

export const printReceipt = (transaction: Transaction, settings: StoreSettings) => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  
  if (!printWindow) {
    alert("Please allow popups to print receipts");
    return;
  }

  const itemsHtml = transaction.items.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
      <span>${item.quantity}x ${item.name}</span>
      <span>${settings.currencySymbol}${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  const htmlContent = `
    <html>
      <head>
        <title>Receipt - ${transaction.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 300px; margin: 0 auto; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .flex { display: flex; justify-content: space-between; }
          .mb-2 { margin-bottom: 8px; }
          .footer { margin-top: 20px; font-size: 10px; color: #555; }
          @media print {
            body { padding: 0; margin: 0; }
            @page { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h2 class="mb-2" style="margin: 0;">${settings.storeName}</h2>
          <p style="margin: 5px 0;">${settings.address}</p>
          <p style="margin: 5px 0;">${settings.phone}</p>
          ${settings.receiptHeader ? `<p style="margin: 5px 0;">${settings.receiptHeader}</p>` : ''}
        </div>
        
        <div class="line"></div>
        
        <div class="flex">
          <span>Date:</span>
          <span>${new Date(transaction.date).toLocaleDateString()} ${new Date(transaction.date).toLocaleTimeString()}</span>
        </div>
        <div class="flex">
          <span>Trans ID:</span>
          <span>${transaction.id}</span>
        </div>
        <div class="flex">
          <span>Cashier:</span>
          <span>Admin</span>
        </div>

        <div class="line"></div>
        
        <div class="items">
          ${itemsHtml}
        </div>
        
        <div class="line"></div>
        
        <div class="flex">
          <span>Subtotal</span>
          <span>${settings.currencySymbol}${transaction.subtotal.toFixed(2)}</span>
        </div>
        <div class="flex">
          <span>Tax</span>
          <span>${settings.currencySymbol}${transaction.tax.toFixed(2)}</span>
        </div>
        <div class="flex bold" style="font-size: 14px; margin-top: 5px;">
          <span>TOTAL</span>
          <span>${settings.currencySymbol}${transaction.total.toFixed(2)}</span>
        </div>
        
        <div class="line"></div>
        
        <div class="flex">
          <span>Payment Method</span>
          <span>${transaction.paymentMethod}</span>
        </div>
        ${transaction.customerName ? `
        <div class="flex">
          <span>Customer</span>
          <span>${transaction.customerName}</span>
        </div>
        ` : ''}
        
        <div class="text-center footer">
          ${settings.receiptFooter ? `<p>${settings.receiptFooter}</p>` : ''}
          <p>Thank you for shopping with us!</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};
