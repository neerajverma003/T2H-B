import puppeteer from 'puppeteer';

/**
 * Converts an HTML string into a PDF Buffer using Puppeteer.
 * @param {string} htmlContent - The raw HTML string to convert.
 * @returns {Promise<Buffer>} - The generated PDF as a binary buffer.
 */
export const generatePdfBuffer = async (htmlContent) => {
  let browser;
  try {
    // Launch headless browser using system installed Google Chrome
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    // Set HTML content and wait for network resources (like Tailwind CDN and Fonts) to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Generate PDF Buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Ensures CSS backgrounds and Tailwind colors are printed
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    return pdfBuffer;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw new Error('Failed to generate PDF');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
