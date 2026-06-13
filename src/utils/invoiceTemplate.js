// T2H_B/src/utils/invoiceTemplate.js

/**
 * Generates an HTML string for the Booking Invoice PDF.
 * Uses Tailwind CSS via CDN for styling.
 */
export const generateInvoiceHtml = (bookingData) => {
  const {
    invoiceNumber,
    dateOfIssue,
    customerName,
    customerEmail,
    customerPhone,
    customerCity,
    itineraryTitle,
    travelDate,
    adults,
    children,
    basePrice,
    gstAmount,
    totalAmount,
    selectedAddonsList = [],
    specialRequestsList = [],
    usedGiftCardCode = null,
    voucherAmountUsed = 0,
    walletAmountUsed = 0,
    amountPaid = 0,
    balanceDue = 0,
    logoBase64 = '',
    rawNote = ''
  } = bookingData;

  const logoSrc = logoBase64 
    ? `data:image/png;base64,${logoBase64}` 
    : 'https://media.trip2honeymoon.com/assets/TripLogo.png';

  // Round off all financial calculations for clean production representation
  const roundedBasePrice = Math.round(basePrice);
  const roundedGstSplit = Math.round(gstAmount / 2);
  const roundedSubtotal = Math.round(totalAmount);
  const roundedVoucher = Math.round(voucherAmountUsed);
  const roundedWallet = Math.round(walletAmountUsed);
  const roundedPaid = Math.round(amountPaid);
  const roundedDue = Math.round(balanceDue);

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${invoiceNumber}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
          body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
          }
          .font-serif {
              font-family: 'Playfair Display', serif;
          }
          .paid-stamp {
              position: absolute;
              top: 35%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-15deg);
              font-size: 7rem;
              font-weight: 900;
              color: ${roundedDue > 0 ? 'rgba(15, 58, 178, 0.05)' : 'rgba(34, 197, 94, 0.05)'};
              border: 8px solid ${roundedDue > 0 ? 'rgba(15, 58, 178, 0.05)' : 'rgba(34, 197, 94, 0.05)'};
              border-radius: 1rem;
              padding: 0.8rem 2.5rem;
              text-transform: uppercase;
              letter-spacing: 0.5rem;
              z-index: 0;
              pointer-events: none;
          }
      </style>
  </head>
  <body class="p-8 relative max-w-4xl mx-auto text-slate-900">
      
      <!-- Background Watermark/Stamp -->
      <div class="paid-stamp">${roundedDue > 0 ? 'PARTIAL' : 'PAID'}</div>

      <div class="relative z-10 flex flex-col justify-between min-h-[920px]">
          <div>
              <!-- Header -->
              <div class="flex justify-between items-start border-b border-slate-200 pb-5 mb-5">
                  <div>
                      <img src="${logoSrc}" alt="Trip to Honeymoon Logo" class="h-24 w-auto object-contain mb-3" onerror="this.src='https://media.trip2honeymoon.com/assets/TripLogo.png'; this.onerror=null;" />
                      <p class="text-sm text-slate-800 font-bold">Trip to Honeymoon Private Limited</p>
                      <p class="text-xs text-slate-700 mt-1">123 Travel Boulevard, New Delhi, India 110001</p>
                      <p class="text-xs text-slate-700">GSTIN: 07AABCU9603R1ZX | PAN: AABCT1294F</p>
                      <p class="text-xs text-slate-700">Support: support@trip2honeymoon.com | +91 99999 99999</p>
                  </div>
                  <div class="text-right">
                      <h2 class="text-4xl font-black text-slate-400 tracking-widest uppercase mb-2">Invoice</h2>
                      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block text-left min-w-[200px]">
                          <p class="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1">Invoice No</p>
                          <p class="text-sm font-black text-slate-900 mb-3">${invoiceNumber}</p>
                          <p class="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1">Date of Issue</p>
                          <p class="text-sm font-bold text-slate-900">${dateOfIssue}</p>
                      </div>
                  </div>
              </div>

              <!-- Customer Details -->
              <div class="grid grid-cols-2 gap-8 mb-6">
                  <div>
                      <h3 class="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Billed To</h3>
                      <p class="font-extrabold text-slate-900 text-lg">${customerName}</p>
                      <p class="text-sm text-slate-800 mt-1">${customerEmail}</p>
                      ${customerPhone ? `<p class="text-sm text-slate-800 mt-0.5">+91 ${customerPhone}</p>` : ''}
                      ${customerCity ? `<p class="text-sm text-slate-800">${customerCity}, India</p>` : ''}
                  </div>
                  <div>
                      <h3 class="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Payment Status</h3>
                      <div class="flex items-center gap-2 mt-2">
                          <div class="w-3 h-3 rounded-full ${roundedDue > 0 ? 'bg-blue-600' : 'bg-emerald-500'}"></div>
                          <span class="font-black text-sm ${roundedDue > 0 ? 'text-blue-700' : 'text-emerald-700'} tracking-wider">
                              ${roundedDue > 0 ? 'PARTIAL PAYMENT RECEIVED' : 'PAID IN FULL'}
                          </span>
                      </div>
                      <p class="text-xs text-slate-700 mt-2 font-semibold">Method: Online (Razorpay Gateway)</p>
                  </div>
              </div>

              <!-- Invoice Table -->
              <div class="mb-6 rounded-xl overflow-hidden border border-slate-200">
                  <table class="w-full text-left border-collapse">
                      <thead>
                          <tr class="bg-slate-50">
                              <th class="py-3 px-5 text-[11px] text-slate-700 font-extrabold uppercase tracking-widest border-b border-slate-200">Description</th>
                              <th class="py-3 px-5 text-[11px] text-slate-700 font-extrabold uppercase tracking-widest border-b border-slate-200 text-center">Travellers</th>
                              <th class="py-3 px-5 text-[11px] text-slate-700 font-extrabold uppercase tracking-widest border-b border-slate-200 text-right">Amount</th>
                          </tr>
                      </thead>
                      <tbody>
                          <!-- Base Package -->
                          <tr class="bg-white border-b border-slate-100">
                              <td class="py-4 px-5">
                                  <p class="font-extrabold text-slate-900 text-base">${itineraryTitle}</p>
                                  <p class="text-xs text-slate-600 mt-1">Travel Date: <span class="font-bold text-slate-800">${travelDate}</span></p>
                              </td>
                              <td class="py-4 px-5 text-center text-sm font-bold text-slate-800">
                                  ${adults} Adults ${children > 0 ? `, ${children} Children` : ''}
                              </td>
                              <td class="py-4 px-5 text-right text-base font-extrabold text-slate-900">
                                  ₹${roundedBasePrice.toLocaleString('en-IN')}
                              </td>
                          </tr>

                          <!-- Dynamic Add-ons List -->
                          ${selectedAddonsList.map(addon => `
                              <tr class="bg-white border-b border-slate-100">
                                  <td class="py-3 px-5" colspan="2">
                                      <div class="flex items-center gap-2">
                                          <span class="inline-block w-1.5 h-1.5 rounded-full bg-[#0F3AB2]"></span>
                                          <p class="text-sm font-bold text-slate-800">Add-on: ${addon.title}</p>
                                      </div>
                                  </td>
                                  <td class="py-3 px-5 text-right text-sm font-bold text-slate-900">
                                      ₹${Math.round(addon.price).toLocaleString('en-IN')}
                                  </td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
              </div>

              <!-- Special Requests & Total Calculations Ledger -->
              <div class="grid grid-cols-12 gap-6 items-start">
                  <!-- Special Requests column -->
                  <div class="col-span-6">
                      ${specialRequestsList.length > 0 ? `
                          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <h4 class="text-[11px] text-[#0F3AB2] font-extrabold uppercase tracking-widest mb-3">Special Requests</h4>
                              <ul class="space-y-1.5">
                                  ${specialRequestsList.map(req => `
                                      <li class="text-xs text-slate-800 flex items-start gap-1.5 font-semibold">
                                          <span class="text-[#0F3AB2]">•</span>
                                          <span>${req}</span>
                                      </li>
                                  `).join('')}
                              </ul>
                          </div>
                      ` : ''}
                      ${rawNote ? `
                          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <h4 class="text-[11px] text-[#0F3AB2] font-extrabold uppercase tracking-widest mb-3">Booking Comments</h4>
                              <p class="text-xs text-slate-800 font-semibold leading-relaxed">${rawNote}</p>
                          </div>
                      ` : ''}
                  </div>

                  <!-- Calculations ledger column -->
                  <div class="col-span-6 ml-auto w-full max-w-[280px]">
                      <div class="flex justify-between py-2 border-b border-slate-200 text-sm font-bold">
                          <span class="text-slate-600">Subtotal</span>
                          <span class="text-slate-950">₹${roundedSubtotal.toLocaleString('en-IN')}</span>
                      </div>

                      <div class="flex justify-between py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-700">
                          <span>CGST (9%)</span>
                          <span>₹${roundedGstSplit.toLocaleString('en-IN')}</span>
                      </div>
                      <div class="flex justify-between py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-700">
                          <span>SGST (9%)</span>
                          <span>₹${roundedGstSplit.toLocaleString('en-IN')}</span>
                      </div>

                      ${roundedVoucher > 0 ? `
                          <div class="flex justify-between py-2 border-b border-slate-200 text-xs text-emerald-700 font-extrabold">
                              <span>Gift Card Discount</span>
                              <span>- ₹${roundedVoucher.toLocaleString('en-IN')}</span>
                          </div>
                      ` : ''}

                      ${roundedWallet > 0 ? `
                          <div class="flex justify-between py-2 border-b border-slate-200 text-xs text-emerald-700 font-extrabold">
                              <span>Travel Wallet Credit</span>
                              <span>- ₹${roundedWallet.toLocaleString('en-IN')}</span>
                          </div>
                      ` : ''}

                      <div class="flex justify-between py-2.5 mt-2.5 bg-slate-900 rounded-lg px-3 text-white">
                          <span class="text-xs font-bold uppercase tracking-wider">Total Paid</span>
                          <span class="text-base font-black">₹${roundedPaid.toLocaleString('en-IN')}</span>
                      </div>

                      ${roundedDue > 0 ? `
                          <div class="flex justify-between py-1.5 mt-1.5 bg-rose-50 rounded-lg px-3 text-rose-700 border border-rose-150">
                              <span class="text-[10px] font-bold uppercase tracking-wider">Balance Due</span>
                              <span class="text-xs font-black">₹${roundedDue.toLocaleString('en-IN')}</span>
                          </div>
                      ` : ''}
                  </div>
              </div>
          </div>

          <!-- Footer (Stays exactly at bottom of A4 page height) -->
          <div class="text-center border-t border-slate-200 pt-5 mt-auto">
              <p class="font-serif text-xl font-bold text-slate-800 mb-1">Thank you for traveling with us!</p>
              <p class="text-xs text-slate-600 font-bold">For support, email us at <a href="mailto:support@trip2honeymoon.com" class="text-[#0F3AB2] font-extrabold">support@trip2honeymoon.com</a></p>
              <p class="text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-semibold">This is a computer generated invoice and does not require a physical signature.</p>
          </div>
      </div>
  </body>
  </html>
  `;
};
