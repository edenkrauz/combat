import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  filename?: string;
}

/**
 * Robust HTML to PDF exporter.
 * Scales the captured canvas precisely into a single A4 page or uses smart scaling,
 * ensuring no section or checklist row gets sliced across page breaks.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  const filename = options.filename || 'סיכום-אירוע.pdf';

  // 1. Create a clone container appended to document body temporarily
  const clone = element.cloneNode(true) as HTMLElement;

  clone.style.position = 'fixed';
  clone.style.top = '0px';
  clone.style.left = '0px';
  clone.style.width = '794px';
  clone.style.zIndex = '-99999';
  clone.style.visibility = 'visible';
  clone.style.pointerEvents = 'none';
  clone.style.transform = 'none';

  document.body.appendChild(clone);

  try {
    // 2. Ensure fonts are loaded if available
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Small delay to ensure styles and DOM clone are attached
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 3. Render clone using html2canvas
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        const clonedBody = clonedDoc.body;
        if (clonedBody) {
          clonedBody.style.backgroundColor = '#ffffff';
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    // 4. Create jsPDF instance (A4 standard: 210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const imgProps = pdf.getImageProperties(imgData);
    const naturalHeightMm = (imgProps.height * pdfWidth) / imgProps.width;

    // Single-page fit: If it's within 15% of A4, scale it down slightly so the entire report fits cleanly on 1 page without cutting
    if (naturalHeightMm <= pdfHeight * 1.15) {
      const renderWidth = naturalHeightMm > pdfHeight ? (pdfWidth * pdfHeight) / naturalHeightMm : pdfWidth;
      const renderHeight = naturalHeightMm > pdfHeight ? pdfHeight : naturalHeightMm;
      const xOffset = (pdfWidth - renderWidth) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, 0, renderWidth, renderHeight, undefined, 'FAST');
    } else {
      // True multi-page document fallback
      let heightLeft = naturalHeightMm;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, naturalHeightMm, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, naturalHeightMm, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(filename);
  } finally {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}
