import { jsPDF } from 'jspdf';

interface ReportRow {
    title: string;
    status: string;
    details: string;
}

/**
 * Generates a refined show-level truth audit report for the CineMontauge registry.
 */
export const generateAirtimePDF = (title: string, data: ReportRow[], part: number = 1): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    
    // Branding Header
    doc.setFontSize(22);
    doc.setTextColor(65, 105, 225); 
    doc.text("CineMontauge Registry Audit", margin, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`${title} (Part ${part})`, margin, 32);
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text(`CineMontauge Admin Export • ${new Date().toLocaleString()}`, margin, 40);
    
    // Column Definitions
    const colNoWidth = 10;
    const colTitleWidth = 75;
    const colStatusWidth = 35;
    const colDetailsWidth = tableWidth - colNoWidth - colTitleWidth - colStatusWidth;

    const xNo = margin;
    const xTitle = xNo + colNoWidth;
    const xStatus = xTitle + colTitleWidth;
    const xDetails = xStatus + colStatusWidth;

    const drawHeader = (y: number) => {
        doc.setFontSize(10);
        doc.setTextColor(255);
        doc.setFillColor(20, 20, 20); 
        doc.rect(margin, y - 5, tableWidth, 8, 'F');
        doc.text("#", xNo + 2, y);
        doc.text("Registry Title", xTitle + 2, y);
        doc.text("Status/Part", xStatus + 2, y);
        doc.text("Audit Log / Gap Signature", xDetails + 2, y);
    };

    drawHeader(51);
    
    let y = 58;
    let entryCount = 0;
    doc.setTextColor(0);

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Wrap text for details column
        const wrappedDetails = doc.splitTextToSize(row.details, colDetailsWidth - 4);
        const rowHeight = Math.max(8, wrappedDetails.length * 5);

        // Page break logic
        if (y + rowHeight > 280) {
            doc.addPage();
            y = 20;
            drawHeader(y);
            y += 10;
            doc.setTextColor(0);
        }
        
        entryCount++;

        // Alternate row shading for readability
        if (entryCount % 2 !== 0) {
            doc.setFillColor(245, 247, 255); 
            doc.rect(margin, y - 4, tableWidth, rowHeight, 'F');
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        
        // Row Number
        doc.text(`${entryCount}`, xNo + 2, y);
        
        // Title
        doc.text(row.title.substring(0, 50), xTitle + 2, y);
        
        // Status
        doc.setFont("helvetica", "normal");
        doc.text(row.status.substring(0, 20), xStatus + 2, y);
        
        // Wrapped metadata
        doc.setFontSize(8);
        doc.text(wrappedDetails, xDetails + 2, y);
        
        y += rowHeight;
    }
    
    // Final Footer with page numbering
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let j = 1; j <= totalPages; j++) {
        doc.setPage(j);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`CineMontauge Archive • Part ${part} • Page ${j} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    doc.save(`CineMontauge_Truth_Audit_Part_${part}.pdf`);
};