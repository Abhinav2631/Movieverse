import { MOVIEVERSE_CONFIG } from "../config/config.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

const emptyTmdbResponse = () => ({
    page: 1,
    results: [],
    total_pages: 0,
    total_results: 0
});

const getTmdbHeaders = () => {
    const token = MOVIEVERSE_CONFIG?.tmdbReadToken?.trim();

    return token
        ? {
              accept: "application/json",
              Authorization: `Bearer ${token}`
          }
        : {
              accept: "application/json"
          };
};

async function tmdbFetch(endpoint, params = {}) {
    const token = MOVIEVERSE_CONFIG?.tmdbReadToken?.trim();

    if (!token) {
        console.warn(
            "TMDB read token is not configured. MovieVerse is running in demo mode without live TMDB data."
        );

        return emptyTmdbResponse();
    }

    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

    Object.entries({
        language: "en-US",
        ...params
    }).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url, {
        headers: getTmdbHeaders()
    });

    if (response.status === 401 || response.status === 403) {
        console.warn(
            "TMDB rejected the configured read token. Check config/config.js and verify the token is valid."
        );

        return emptyTmdbResponse();
    }

    if (!response.ok) {
        const text = await response.text().catch(() => "");

        throw new Error(
            `TMDB request failed: ${response.status}${
                text ? ` - ${text}` : ""
            }`
        );
    }

    return response.json();
}

export function getPosterUrl(path, size = "w500") {
    return path
        ? `${TMDB_IMAGE_BASE_URL}/${size}${path}`
        : "";
}

export function getBackdropUrl(
    path,
    size = "original"
) {
    return path
        ? `${TMDB_IMAGE_BASE_URL}/${size}${path}`
        : "";
}

export function getProfileUrl(
    path,
    size = "w185"
) {
    return path
        ? `${TMDB_IMAGE_BASE_URL}/${size}${path}`
        : "";
}

export async function discoverMedia(
    mediaType = "movie",
    params = {}
) {
    const endpoint =
        mediaType === "tv"
            ? "/discover/tv"
            : "/discover/movie";

    return tmdbFetch(endpoint, {
        ...params,
        sort_by: "popularity.desc",
        region: MOVIEVERSE_CONFIG.tmdbRegion
    });
}

export async function discoverBoth(params = {}) {
    const [movies, tv] = await Promise.all([
        discoverMedia("movie", params),
        discoverMedia("tv", params)
    ]);

    // Movie and TV catalogs have separate ID namespaces; preserve the media type
    // before deduplicating so an ID collision does not discard a valid result.
    const combined = [
        ...(movies?.results || []).map((item) => ({ ...item, media_type: "movie" })),
        ...(tv?.results || []).map((item) => ({ ...item, media_type: "tv" }))
    ];

    const unique = new Map();

    combined.forEach((item) => {
        const identity = item?.id ?? `${item?.title || item?.name || "unknown"}`;
        const key = `${item?.media_type || "movie"}:${identity}`;

        if (!unique.has(key)) {
            unique.set(key, item);
        }
    });

    return [...unique.values()].sort(
        (a, b) =>
            (b.popularity || 0) - (a.popularity || 0)
    );
}

export async function getMovieGenres() {
    return tmdbFetch("/genre/movie/list");
}

export async function getTvGenres() {
    return tmdbFetch("/genre/tv/list");
}

export async function getWatchProviderCatalog(
    mediaType = "movie"
) {
    return tmdbFetch(
        mediaType === "tv"
            ? "/watch/providers/tv"
            : "/watch/providers/movie",
        { watch_region: MOVIEVERSE_CONFIG.tmdbRegion || "IN" }
    );
}

export async function getMovieWatchProviders(movieId) {
    return tmdbFetch(`/movie/${movieId}/watch/providers`);
}

export async function getTvWatchProviders(seriesId) {
    return tmdbFetch(`/tv/${seriesId}/watch/providers`);
}

export async function getPersonDetails(personId) {
    return tmdbFetch(`/person/${personId}`, {
        append_to_response: "combined_credits,images"
    });
}

// HOME
export async function getTrending(page = 1) {
    // Daily global trends are paginated; the hero loads three pages to fill a 20-title carousel after filtering.
    return tmdbFetch("/trending/all/day", {
        region: MOVIEVERSE_CONFIG.tmdbRegion,
        page
    });
}

export async function getPopularMovies() {
    return tmdbFetch("/movie/popular", {
        region: MOVIEVERSE_CONFIG.tmdbRegion
    });
}

export async function getPopularSeries() {
    return tmdbFetch("/tv/popular", {
        region: MOVIEVERSE_CONFIG.tmdbRegion
    });
}

export async function getTopRatedMovies() {
    return tmdbFetch("/movie/top_rated", {
        region: MOVIEVERSE_CONFIG.tmdbRegion
    });
}

export async function getNowPlaying() {
    return tmdbFetch("/movie/now_playing", {
        region: MOVIEVERSE_CONFIG.tmdbRegion
    });
}

export async function getUpcomingMovies() {
    return tmdbFetch("/movie/upcoming", {
        region: MOVIEVERSE_CONFIG.tmdbRegion
    });
}

// DETAILS
export async function getMovieDetails(id) {
    return tmdbFetch(`/movie/${id}`, {
        append_to_response: "watch/providers,images,external_ids"
    });
}

export async function getTvDetails(id) {
    return tmdbFetch(`/tv/${id}`, {
        append_to_response: "watch/providers,images,external_ids"
    });
}

export async function getCredits(
    id,
    mediaType = "movie"
) {
    const endpoint =
        mediaType === "tv"
            ? `/tv/${id}/credits`
            : `/movie/${id}/credits`;

    return tmdbFetch(endpoint);
}

export async function getVideos(
    id,
    mediaType = "movie"
) {
    const endpoint =
        mediaType === "tv"
            ? `/tv/${id}/videos`
            : `/movie/${id}/videos`;

    return tmdbFetch(endpoint);
}

export async function getSimilar(
    id,
    mediaType = "movie"
) {
    const endpoint =
        mediaType === "tv"
            ? `/tv/${id}/similar`
            : `/movie/${id}/similar`;

    return tmdbFetch(endpoint, {
        page: 1
    });
}

// SEARCH
export async function searchMulti(
    query,
    page = 1
) {
    if (!query?.trim()) {
        return emptyTmdbResponse();
    }

    return tmdbFetch("/search/multi", {
        query: query.trim(),
        include_adult: false,
        region: MOVIEVERSE_CONFIG.tmdbRegion,
        page
    });
}

export async function searchMovies(
    query,
    page = 1
) {
    if (!query?.trim()) {
        return emptyTmdbResponse();
    }

    return tmdbFetch("/search/movie", {
        query: query.trim(),
        include_adult: false,
        region: MOVIEVERSE_CONFIG.tmdbRegion,
        page
    });
}

export async function searchTv(
    query,
    page = 1
) {
    if (!query?.trim()) {
        return emptyTmdbResponse();
    }

    return tmdbFetch("/search/tv", {
        query: query.trim(),
        include_adult: false,
        page
    });
}
