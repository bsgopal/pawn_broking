/**
 * PawnBook Pro Direct Thermal & A4 Printing Service
 * Supports Electron IPC Silent Direct Printing with Web Browser fallback
 */

export async function printHtmlContent(htmlContent, printerName = '') {
  if (!htmlContent) return { success: false, message: 'No content to print' };

  // 1. If running inside Electron desktop app with IPC bridge
  if (window.electronAPI && typeof window.electronAPI.printSilent === 'function') {
    try {
      const res = await window.electronAPI.printSilent({ htmlContent, printerName });
      return res;
    } catch (e) {
      console.warn('Electron silent print error, falling back to browser print:', e);
    }
  }

  // 2. Browser / Web / Tablet / Mobile Print Fallback via Hidden iFrame
  return new Promise((resolve) => {
    try {
      let iframe = document.getElementById('pawn_print_frame');
      if (iframe) document.body.removeChild(iframe);

      iframe = document.createElement('iframe');
      iframe.id = 'pawn_print_frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        resolve({ success: true, method: 'browser_iframe' });
      }, 300);
    } catch (err) {
      console.error('Print iframe error:', err);
      // Last resort: Open in new tab
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        printWin.print();
        resolve({ success: true, method: 'window_popup' });
      } else {
        resolve({ success: false, message: err.message });
      }
    }
  });
}

export async function getAvailablePrinters() {
  if (window.electronAPI && typeof window.electronAPI.getPrinters === 'function') {
    try {
      const res = await window.electronAPI.getPrinters();
      return res?.printers || [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

export default {
  printHtmlContent,
  getAvailablePrinters
};
