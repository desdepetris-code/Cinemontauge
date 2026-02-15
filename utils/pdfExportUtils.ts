
import { jsPDF } from 'jspdf';

interface ReportRow {
    title: string;
    status: string;
    details: string;
}

interface SummaryData {
    totalScanned: number;
    matchesFound: number;
    criteria: string;
    partNumber: number;
}

/**
 * Specialized generator for the Editorial Recommendation Checklist.
 */
export const generateRecTrackingPDF = (
    data: { title: string; type: string; year: string; genres: string; id: number; status: string }[]
): { blob: Blob; fileName: string } => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    
    // Header Branding
    doc.setFontSize(22);
    doc.setTextColor(65, 105, 225); // Royal Blue
    doc.setFont("helvetica", "bold");
    doc.text("CineMontauge Editorial Registry", margin, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Media Recommendation Tracking Checklist • ${new Date().toLocaleString()}`, margin, 32);
    
    // Summary Section
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(margin, 38, tableWidth, 25, 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.text("WORKFLOW SUMMARY", margin + 5, 48);
    
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.setFont("helvetica", "normal");
    doc.text(`Registry Items in current batch (Max 100): ${data.length}`, margin + 5, 56);
    
    // Table Column Definitions
    const colTitleWidth = 65;
    const colTypeWidth = 25;
    const colYearWidth = 20;
    const colIdWidth = 30;
    const colGenresWidth = tableWidth - colTitleWidth - colTypeWidth - colYearWidth - colIdWidth;

    const xTitle = margin;
    const xType = xTitle + colTitleWidth;
    const xYear = xType + colTypeWidth;
    const xId = xYear + colYearWidth;
    const xGenres = xId + colIdWidth;

    const drawTableHeader = (y: number) => {
        doc.setFontSize(9);
        doc.setTextColor(255);
        doc.setFillColor(30, 30, 30);
        doc.rect(margin, y - 5, tableWidth, 8, 'F');
        doc.text("Media Title", xTitle + 2, y);
        doc.text("Type", xType + 2, y);
        doc.text("Year", xYear + 2, y);
        doc.text("TMDB ID", xId + 2, y);
        doc.text("Genre Set", xGenres + 2, y);
    };

    let y = 75;
    drawTableHeader(y);
    y += 8;
    
    data.forEach((row, index) => {
        const wrappedGenres = doc.splitTextToSize(row.genres, colGenresWidth - 4);
        const rowHeight = Math.max(10, wrappedGenres.length * 5 + 4);

        if (y + rowHeight > 280) {
            doc.addPage();
            y = 30;
            drawTableHeader(y);
            y += 8;
        }

        // Shading
        if (index % 2 === 0) {
            doc.setFillColor(252, 252, 252);
            doc.rect(margin, y - 5, tableWidth, rowHeight, 'F');
        }

        doc.setFontSize(8);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        
        doc.text(doc.splitTextToSize(row.title, colTitleWidth - 4), xTitle + 2, y);
        doc.text(row.type, xType + 2, y);
        doc.text(row.year, xYear + 2, y);
        doc.text(String(row.id), xId + 2, y);
        doc.text(wrappedGenres, xGenres + 2, y);
        
        y += rowHeight;
    });

    const fileName = `Media_Recommendation_Tracking.pdf`;
    return {
        blob: doc.output('blob'),
        fileName
    };
};

/**
 * Generates a professional registry report with a summary section and data tables.
 * Returns the PDF blob for storage upload.
 */
export const generateSummaryReportPDF = (
    title: string, 
    data: ReportRow[], 
    summary: SummaryData
): { blob: Blob; fileName: string } => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    
    // Header Branding
    doc.setFontSize(24);
    doc.setTextColor(65, 105, 225); // Royal Blue
    doc.setFont("helvetica", "bold");
    doc.text("CineMontauge Engineering", margin, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text(`Registry Audit Log • ${new Date().toLocaleString()}`, margin, 32);
    
    // Summary Section
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(margin, 38, tableWidth, 40, 3, 3, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.text("AUDIT SUMMARY", margin + 5, 48);
    
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Title: ${title}`, margin + 5, 56);
    doc.text(`Target Criteria: ${summary.criteria}`, margin + 5, 62);
    doc.text(`Scanning Batch Size: 100 Items`, margin + 5, 68);
    doc.text(`Matches Found in Batch: ${summary.matchesFound}`, margin + 5, 74);
    
    doc.setFontSize(12);
    doc.setTextColor(65, 105, 225);
    doc.text(`PART ${summary.partNumber}`, pageWidth - margin - 20, 48, { align: 'right' });

    // Table Column Definitions
    const colNoWidth = 10;
    const colTitleWidth = 60;
    const colStatusWidth = 30;
    const colDetailsWidth = tableWidth - colNoWidth - colTitleWidth - colStatusWidth;

    const xNo = margin;
    const xTitle = xNo + colNoWidth;
    const xStatus = xTitle + colTitleWidth;
    const xDetails = xStatus + colStatusWidth;

    const drawTableHeader = (y: number) => {
        doc.setFontSize(9);
        doc.setTextColor(255);
        doc.setFillColor(30, 30, 30);
        doc.rect(margin, y - 5, tableWidth, 8, 'F');
        doc.text("#", xNo + 2, y);
        doc.text("Registry Item", xTitle + 2, y);
        doc.text("Status", xStatus + 2, y);
        doc.text("Technical Details / Findings", xDetails + 2, y);
    };

    let y = 90;
    drawTableHeader(y);
    y += 8;
    
    data.forEach((row, index) => {
        const wrappedDetails = doc.splitTextToSize(row.details, colDetailsWidth - 4);
        const rowHeight = Math.max(10, wrappedDetails.length * 5 + 4);

        if (y + rowHeight > 280) {
            doc.addPage();
            y = 30;
            drawTableHeader(y);
            y += 8;
        }

        // Shading
        if (index % 2 === 0) {
            doc.setFillColor(252, 252, 252);
            doc.rect(margin, y - 5, tableWidth, rowHeight, 'F');
        }

        doc.setFontSize(8);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        
        doc.text(`${index + 1}`, xNo + 2, y);
        doc.text(doc.splitTextToSize(row.title, colTitleWidth - 4), xTitle + 2, y);
        doc.text(doc.splitTextToSize(row.status, colStatusWidth - 4), xStatus + 2, y);
        doc.text(wrappedDetails, xDetails + 2, y);
        
        y += rowHeight;
    });

    const fileName = `CM_Report_${title.replace(/\s+/g, '_')}_P${summary.partNumber}_${Date.now()}.pdf`;
    return {
        blob: doc.output('blob'),
        fileName
    };
};

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
    addText("library: (id uuid pk, user_id uuid fk, tmdb_id int, media_type text, status text, recommendation_status text default 'Pending', added_at timestamptz)");
    addText("episode_progress: (id uuid pk, user_id uuid fk, tmdb_id int, season_int int, ep_int int, status int)");
    addText("media_registry_cache: (tmdb_id int pk, title text, poster_path text, backdrop_path text, media_type text, first_air_date text)");
    addText("custom_media: (id uuid pk, user_id uuid fk, tmdb_id int, asset_type text, url text, season_int int, ep_int int)");
    y += 5;

    addText("2. Social Architecture", 14, 'bold');
    addText("follows: (id uuid pk, follower_id uuid fk, following_id uuid fk)");
    addText("comments: (id uuid pk, user_id uuid fk, media_key text, content text, parent_id uuid fk, visibility text, is_spoiler bool)");
    addText("interactions: (id uuid pk, user_id uuid fk, target_id uuid, target_type text, type text)");
    addText("user_blocking: (id uuid pk, blocker_id uuid fk, blocked_id uuid fk)");
    addText("activity_stream: (id uuid pk, user_id uuid fk, event_type text, metadata jsonb, created_at timestamptz)");
    y += 5;

    addText("3. Community Intelligence", 14, 'bold');
    addText("truth_overrides: (id uuid pk, tmdb_id int, season_number int, episode_number int, airtime text, provider text, user_id uuid fk)");
    addText("weekly_picks: (id uuid pk, user_id uuid fk, tmdb_id int, category text, week_key text, day_index int)");
    y += 5;

    addText("4. Storage RLS Policies (Critical)", 14, 'bold');
    addText("BUCKETS: avatars, custom-media, brand-assets, admin-reports", 11, 'bold');
    addText("- Public Read: ALLOW SELECT to PUBLIC on all buckets.");
    addText("- Admin Write: ALLOW ALL to AUTHENTICATED where is_admin = true.");
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
