import { TmdbMediaDetails } from '../types';

interface RatingInfo {
  rating: string;
  colorClass: string;
}

export const getRating = (details: TmdbMediaDetails): RatingInfo | null => {
  let rating: string | undefined;
  const countryPriority = ['US', 'GB', 'CA', 'AU'];

  if (details.media_type === 'movie') {
    const allReleases = details.release_dates?.results || [];
    let releaseInfo;

    // Find release info based on country priority
    for (const country of countryPriority) {
        releaseInfo = allReleases.find(r => r.iso_3166_1 === country);
        if (releaseInfo?.release_dates?.some(rd => rd.certification && rd.certification.trim() !== "")) break;
        releaseInfo = undefined; // reset if no certs found
    }
    // Fallback to first available with a certification if no priority country found
    if (!releaseInfo) {
        releaseInfo = allReleases.find(r => r.release_dates?.some(rd => rd.certification && rd.certification.trim() !== ""));
    }
    
    if (releaseInfo?.release_dates) {
        let theatricalCert: string | undefined;
        let firstCert: string | undefined;

        for (const rd of releaseInfo.release_dates) {
            if (rd.certification && rd.certification.trim() !== "") {
                if (rd.type === 3) { // Prioritize theatrical release
                    theatricalCert = rd.certification;
                    break;
                }
                if (!firstCert) {
                    firstCert = rd.certification;
                }
            }
        }
        rating = theatricalCert || firstCert;
    }
  } else if (details.media_type === 'tv') {
    const allRatings = details.content_ratings?.results || [];
    let ratingInfo;

    // Find rating info based on country priority
    for (const country of countryPriority) {
        ratingInfo = allRatings.find(r => r.iso_3166_1 === country);
        if (ratingInfo?.rating && ratingInfo.rating.trim() !== "") break;
        ratingInfo = undefined;
    }
    // Fallback to first available if no priority country found
    if (!ratingInfo) {
        ratingInfo = allRatings.find(r => r.rating && r.rating.trim() !== "");
    }

    rating = ratingInfo?.rating;
  }

  if (!rating || rating === "NR" || rating.trim() === "") {
    return null;
  }

  let colorClass = 'bg-gray-500/20 text-gray-300'; // Default/unknown

  const r = rating.toUpperCase();
  if (['G', 'TV-Y', 'TV-Y7', 'TV-G', 'U'].includes(r)) {
    colorClass = 'bg-green-500/20 text-green-300';
  } else if (['PG', 'TV-PG', 'PG-13', 'TV-14', '12', '12A', '15'].includes(r)) {
    colorClass = 'bg-yellow-500/20 text-yellow-300';
  } else if (['R', 'NC-17', 'TV-MA', '18'].includes(r)) {
    colorClass = 'bg-red-500/20 text-red-300';
  }

  return { rating, colorClass };
};
