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
    totalAmount
  } = bookingData;

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
              color: #1e293b;
              background: #ffffff;
              margin: 0;
              padding: 0;
          }
          .font-serif {
              font-family: 'Playfair Display', serif;
          }
          .paid-stamp {
              position: absolute;
              top: 40%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-15deg);
              font-size: 8rem;
              font-weight: 900;
              color: rgba(34, 197, 94, 0.1);
              border: 8px solid rgba(34, 197, 94, 0.1);
              border-radius: 1rem;
              padding: 1rem 3rem;
              text-transform: uppercase;
              letter-spacing: 0.5rem;
              z-index: 0;
              pointer-events: none;
          }
      </style>
  </head>
  <body class="p-12 relative max-w-4xl mx-auto">
      
      <!-- Background Watermark/Stamp -->
      <div class="paid-stamp">PAID</div>

      <div class="relative z-10">
          <!-- Header -->
          <div class="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
              <div>
                  <h1 class="text-3xl font-black font-serif text-[#0F3AB2] tracking-tight">TripToHoneymoon</h1>
                  <p class="text-sm text-slate-500 mt-2 font-medium">Premium Curated Travel Experiences</p>
                  <p class="text-xs text-slate-400 mt-1">123 Travel Boulevard, New Delhi, India 110001</p>
                  <p class="text-xs text-slate-400">GSTIN: 07AABCU9603R1ZX</p>
              </div>
              <div class="text-right">
                  <h2 class="text-4xl font-black text-slate-200 tracking-widest uppercase mb-2">Invoice</h2>
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block text-left min-w-[200px]">
                      <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Invoice No</p>
                      <p class="text-sm font-black text-slate-800 mb-3">${invoiceNumber}</p>
                      <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Date of Issue</p>
                      <p class="text-sm font-bold text-slate-800">${dateOfIssue}</p>
                  </div>
              </div>
          </div>

          <!-- Customer Details -->
          <div class="grid grid-cols-2 gap-12 mb-10">
              <div>
                  <h3 class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Billed To</h3>
                  <p class="font-bold text-slate-800 text-lg">${customerName}</p>
                  <p class="text-sm text-slate-600 mt-1">${customerEmail}</p>
                  <p class="text-sm text-slate-600">+91 ${customerPhone}</p>
                  ${customerCity ? `<p class="text-sm text-slate-600">${customerCity}, India</p>` : ''}
              </div>
              <div>
                  <h3 class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Payment Status</h3>
                  <div class="flex items-center gap-2 mt-2">
                      <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span class="font-black text-emerald-600 tracking-wider">COMPLETED SUCCESSFULLY</span>
                  </div>
              </div>
          </div>

          <!-- Invoice Table -->
          <div class="mb-10 rounded-2xl overflow-hidden border border-slate-200">
              <table class="w-full text-left border-collapse">
                  <thead>
                      <tr class="bg-slate-50">
                          <th class="py-4 px-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-200">Description</th>
                          <th class="py-4 px-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-200 text-center">Travellers</th>
                          <th class="py-4 px-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-200 text-right">Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr class="bg-white">
                          <td class="py-6 px-6 border-b border-slate-100">
                              <p class="font-bold text-slate-800 text-base">${itineraryTitle}</p>
                              <p class="text-xs text-slate-500 mt-1">Travel Date: <span class="font-semibold">${travelDate}</span></p>
                          </td>
                          <td class="py-6 px-6 border-b border-slate-100 text-center text-sm font-semibold text-slate-700">
                              ${adults} Adults ${children > 0 ? `, ${children} Children` : ''}
                          </td>
                          <td class="py-6 px-6 border-b border-slate-100 text-right text-base font-bold text-slate-800">
                              ₹${basePrice.toLocaleString('en-IN')}
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <!-- Total Calculation -->
          <div class="flex justify-end mb-16">
              <div class="w-72">
                  <div class="flex justify-between py-2 border-b border-slate-100">
                      <span class="text-sm font-semibold text-slate-500">Subtotal</span>
                      <span class="text-sm font-bold text-slate-800">₹${basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-slate-100">
                      <span class="text-sm font-semibold text-slate-500">Taxes & Fees (18% GST)</span>
                      <span class="text-sm font-bold text-slate-800">₹${gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="flex justify-between py-4 mt-2 bg-[#0F3AB2] rounded-xl px-5 text-white shadow-lg shadow-[#0F3AB2]/20">
                      <span class="text-base font-bold">Total Paid</span>
                      <span class="text-xl font-black font-serif tracking-wide">₹${totalAmount.toLocaleString('en-IN')}</span>
                  </div>
              </div>
          </div>

          <!-- Footer -->
          <div class="text-center border-t-2 border-slate-100 pt-8 mt-auto">
              <p class="font-serif text-xl font-bold text-slate-800 mb-2">Thank you for traveling with us!</p>
              <p class="text-xs text-slate-400 font-medium">For support, email us at <a href="mailto:support@triptohoneymoon.com" class="text-[#0F3AB2]">support@triptohoneymoon.com</a></p>
              <p class="text-[10px] text-slate-300 mt-4 uppercase tracking-widest">This is a computer generated invoice and does not require a physical signature.</p>
          </div>
      </div>
  </body>
  </html>
  `;
};
