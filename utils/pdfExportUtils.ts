
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
 * Refined with comprehensive Storage RLS policies and new recommended tables.
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
            y += size * 0.5 + 4;
        });
    };

    addText("CineMontauge: Supabase Backend Specification v7.0", 18, 'bold', [65, 105, 225]);
    y += 4;
    addText("PRODUCTION-READY SCHEMA & ARCHITECTURE", 12, 'bold', [100, 100, 100]);
    addText("--------------------------------------------------------------------------------", 10, 'normal', [150, 150, 150]);
    y += 5;

    addText("1. Core Registry & Meta-Cache", 14, 'bold');
    addText("profiles: (id uuid pk, username text unique, avatar_url text, timezone text, user_xp int, app_settings jsonb)");
    addText("library: (id uuid pk, user_id uuid fk, tmdb_id int, media_type text, status text, added_at timestamptz)");
    addText("episode_progress: (id uuid pk, user_id uuid fk, tmdb_id int, season_int int, ep_int int, status int)");
    addText("media_registry_cache: (tmdb_id int pk, title text, poster_path text, backdrop_path text, media_type text, first_air_date text)");
    addText("custom_media: (id uuid pk, user_id uuid fk, tmdb_id int, asset_type text, url text, season_int int, ep_int int)");
    y += 5;

    addText("2. Social Architecture", 14, 'bold');
    addText("follows: (id uuid pk, follower_id uuid fk, following_id uuid fk)");
    addText("comments: (id uuid pk, user_id uuid fk, media_key text, content text, parent_id uuid fk, visibility text, is_spoiler bool)");
    addText("interactions: (id uuid pk, user_id uuid fk, target_id uuid, target_type text, type text)"); // Likes, Bookmarks
    addText("user_blocking: (id uuid pk, blocker_id uuid fk, blocked_id uuid fk)");
    addText("activity_stream: (id uuid pk, user_id uuid fk, event_type text, metadata jsonb, created_at timestamptz)");
    y += 5;

    addText("3. Community Intelligence", 14, 'bold');
    addText("truth_overrides: (id uuid pk, tmdb_id int, season_number int, episode_number int, airtime text, provider text, user_id uuid fk)");
    addText("weekly_picks: (id uuid pk, user_id uuid fk, tmdb_id int, category text, week_key text, day_index int)");
    y += 5;

    addText("4. Storage RLS Policies (Critical)", 14, 'bold');
    addText("BUCKETS: avatars, custom-media, brand-assets", 11, 'bold');
    addText("- Public Read: ALLOW SELECT to PUBLIC on all buckets.");
    addText("- Secure Write: ALLOW ALL to AUTHENTICATED where (storage.foldername(name))[1] = auth.uid()::text.");
    y += 5;

    addText("5. Performance Triggers (PostgreSQL)", 14, 'bold');
    addText("- NEW PROFILE: CREATE TRIGGER on auth.users for automatic insertion into public.profiles.");
    addText("- ACTIVITY FEED: TRIGGER on library change to auto-insert into activity_stream.");
    addText("- ANALYTICS: CRON JOB to recalculate user_analytics every 24h.");
    y += 10;

    addText("--------------------------------------------------------------------------------", 10, 'normal', [150, 150, 150]);
    addText("Generated by CineMontauge Engineering Console", 8, 'italic', [150, 150, 150]);

    doc.save("CineMontauge_Backend_Blueprint_v7.pdf");
};
