import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_WIDTH = 1536;
const TEMPLATE_HEIGHT = 1024;

const scalePoint = (image, x, y) => ({
  x: (x / TEMPLATE_WIDTH) * image.width,
  y: (y / TEMPLATE_HEIGHT) * image.height,
});

const scaleSize = (image, value) => (value / TEMPLATE_WIDTH) * image.width;

const fitText = (ctx, text, maxWidth, initialSize, minSize, fontFamily, fontWeight = '') => {
  let size = initialSize;
  do {
    ctx.font = `${fontWeight ? `${fontWeight} ` : ''}${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth || size <= minSize) {
      return size;
    }
    size -= 2;
  } while (size >= minSize);

  return minSize;
};

const formatExpiryDate = (expiryDate) => {
  if (!expiryDate) return '1 YEAR VALIDITY';

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return String(expiryDate).toUpperCase().replace(/,/g, '');
  }

  return expiry
    .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
    .replace(/,/g, '');
};

export const renderGiftCardImageBuffer = async ({ amount, publicCode, expiryDate }) => {
  const imagePath = path.join(__dirname, '../assets/GiftCard2.png');
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0, image.width, image.height);

  const amountStr = `₹${Number(amount).toLocaleString('en-IN')}`;
  const codeStr = publicCode || 'T2H-VOUCHER';
  const expiryStr = formatExpiryDate(expiryDate);

  const amountPos = scalePoint(image, 768, 462);
  ctx.font = `bold ${scaleSize(image, 180)}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = '#6F1123';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(amountStr, amountPos.x, amountPos.y);

  const spacedCode = codeStr.split('').join('\u2009');
  // Adjusted X from 275 to 225 to align exactly under the 'G' of 'GIFT CARD CODE'
  const codePos = scalePoint(image, 225, 875);
  fitText(ctx, spacedCode, scaleSize(image, 470), scaleSize(image, 34), scaleSize(image, 24), 'Arial, sans-serif');
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(spacedCode, codePos.x, codePos.y);

  // Adjusted X from 940 to 910 to align exactly under the 'V' of 'VALID TILL'
  const expiryPos = scalePoint(image, 910, 875);
  fitText(ctx, expiryStr, scaleSize(image, 410), scaleSize(image, 34), scaleSize(image, 24), 'Arial, sans-serif');
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(expiryStr, expiryPos.x, expiryPos.y);

  return canvas.toBuffer('image/png');
};
