import { jsPDF } from 'jspdf';

interface ReportRow {
    title: string;
    status: string;
    details: string;
}

/**
 * Generates a focused PDF report.
 * @param title Report title
 * @param data Array of rows
 * @param pageLimit Maximum number of pages allowed (default 10)
 * @returns number of rows processed
 */
export const generateAirtimePDF = (title: string, data: ReportRow[], pageLimit: number = 10): number => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(65, 105, 225); 
    doc.text("SceneIt Airtime Reference", margin, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(title, margin, 32);
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 40);
    
    // Table Config
    const colNoWidth = 10;
    const colTitleWidth = 85;
    const colStatusWidth = 40;
    const colDetailsWidth = tableWidth - colNoWidth - colTitleWidth - colStatusWidth;

    const xNo = margin;
    const xTitle = xNo + colNoWidth;
    const xStatus = xTitle + colTitleWidth;
    const xDetails = xStatus + colStatusWidth;

    // Table Headers
    doc.setFontSize(10);
    doc.setTextColor(255);
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, 46, tableWidth, 8, 'F');
    
    doc.text("#", xNo + 2, 51);
    doc.text("Title / Episode", xTitle + 2, 51);
    doc.text("Status / Air Date", xStatus + 2, 51);
    doc.text("Latest Progress / ID", xDetails + 2, 51);
    
    let y = 58;
    let episodeCounter = 0;
    let rowsProcessed = 0;
    let currentPageCount = 1;
    doc.setTextColor(0);

    const isEpisode = (t: string) => t.trim().startsWith('-') || (t.includes('E') && !t.startsWith('>>'));

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Check for page break or limit
        if (y > 280) {
            if (currentPageCount >= pageLimit) break;
            
            doc.addPage();
            currentPageCount++;
            y = 20;
            
            // Re-draw headers on new page
            doc.setFillColor(30, 30, 30);
            doc.rect(margin, y - 5, tableWidth, 8, 'F');
            doc.setTextColor(255);
            doc.text("#", xNo + 2, y);
            doc.text("Title / Episode", xTitle + 2, y);
            doc.text("Status / Air Date", xStatus + 2, y);
            doc.text("Latest Progress / ID", xDetails + 2, y);
            doc.setTextColor(0);
            y += 10;
        }
        
        const isEp = isEpisode(row.title);
        if (isEp) episodeCounter++;

        // Row background
        if (!isEp) {
            doc.setFillColor(230, 235, 255); 
            doc.rect(margin, y - 4, tableWidth, 8, 'F');
            doc.setFont("helvetica", "bold");
        } else {
            if (episodeCounter % 2 === 0) {
                doc.setFillColor(248, 248, 248);
                doc.rect(margin, y - 4, tableWidth, 8, 'F');
            }
            doc.setFont("helvetica", "normal");
        }
        
        if (isEp) {
            doc.setFontSize(8);
            doc.text(episodeCounter.toString(), xNo + 2, y);
        }

        doc.setFontSize(isEp ? 8 : 9);
        doc.text(row.title.substring(0, 55), xTitle + 2, y);
        doc.text(row.status.substring(0, 25), xStatus + 2, y);
        doc.text(row.details.substring(0, 35), xDetails + 2, y);
        
        y += 8;
        if (isEp) y += 4; // Spacing
        rowsProcessed++;
    }
    
    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let j = 1; j <= totalPages; j++) {
        doc.setPage(j);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${j} of ${totalPages} | 10-Page Focus Segment`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    doc.save(`SceneIt_${title.replace(/\s+/g, '_')}_Part_${Math.ceil(rowsProcessed/250) || 1}.pdf`);
    return rowsProcessed;
};