
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

/**
 * Generates a full Supabase Backend Blueprint for ChatGPT.
 * Refined with comprehensive RLS policies for security.
 */
export const generateSupabaseSpecPDF = (): void => {
    const doc = new jsPDF();
    const margin = 14;
    let y = 22;

    const addText = (text: string, size: number = 10, style: string = 'normal', color: [number, number, number] = [0, 0, 0]) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, 180);
        lines.forEach((line: string) => {
            if (y > 275) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, margin, y);
            y += size * 0.5 + 2;
        });
    };

    addText("CineMontauge: Supabase Backend Specification v3.5", 18, 'bold', [65, 105, 225]);
    y += 4;
    addText("COMPREHENSIVE RLS POLICIES & SCHEMA FOR CHATGPT", 12, 'bold', [100, 100, 100]);
    addText("--------------------------------------------------------------------------------", 10, 'normal', [150, 150, 150]);
    y += 5;

    addText("1. Relational Schema Requirements", 14, 'bold');
    addText("Table: profiles -> Basic user metadata (Public read, Owner edit).");
    addText("Table: library -> Shows/Movies tracked (Private, Owner only).");
    addText("Table: watch_progress -> JSONB episode states (Private, Owner only).");
    addText("Table: custom_media -> Owner-assigned posters and backdrops.");
    y += 5;

    addText("2. Storage Buckets & Policies", 14, 'bold');
    
    addText("Bucket: avatars", 11, 'bold');
    addText("- Public Access: Enabled (Anyone can view avatars).");
    addText("- RLS SELECT: 'true'");
    addText("- RLS INSERT/UPDATE/DELETE (Role: authenticated):");
    addText("  'bucket_id = \"avatars\" AND (metadata->>\"owner_id\")::uuid = auth.uid()'");
    y += 4;

    addText("Bucket: custom-media", 11, 'bold');
    addText("- Public Access: Enabled.");
    addText("- RLS INSERT/UPDATE/DELETE (Role: authenticated):");
    addText("  'bucket_id = \"custom-media\" AND (metadata->>\"owner_id\")::uuid = auth.uid()'");
    y += 5;

    addText("3. Detailed RLS Logic (SQL Format)", 14, 'bold');
    addText("Run the following in the Supabase SQL Editor:", 10, 'italic');
    addText("ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;", 9, 'normal', [80, 80, 80]);
    addText("CREATE POLICY \"Public Read\" ON storage.objects FOR SELECT USING (true);", 9);
    addText("CREATE POLICY \"Owner Management\" ON storage.objects FOR ALL TO authenticated USING (bucket_id IN ('avatars', 'custom-media') AND (metadata->>'owner_id')::uuid = auth.uid());", 9);
    y += 5;

    addText("4. Profiles & Triggers", 14, 'bold');
    addText("- auth.users -> Profiles table sync trigger (Owner only update).");
    y += 5;

    addText("--------------------------------------------------------------------------------", 10, 'normal', [150, 150, 150]);
    addText("Generated by CineMontauge Admin Portal", 8, 'italic', [150, 150, 150]);

    doc.save("CineMontauge_Supabase_Final_Spec.pdf");
};
