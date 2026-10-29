import {
    getMovieDetails,
    getTvDetails,
    getCredits,
    getVideos,
    getSimilar,
    getPosterUrl
} from "./tmdb.js";

import { MOVIEVERSE_CONFIG } from "../config/config.js";

import {
    toggleMyList,
    toggleWishlist,
    markWatched,
    isInMyList,
    isInWishlist,
    isWatched,
    addRecentlyViewed
} from "./library.js";

let detailsModal = null;
let currentDetailItem = null;
let currentMediaType = "movie";

const escapeHTML = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

function getTitle(item) {
    return item?.title || item?.name || "Untitled";
}

function getReleaseDate(item) {
    return item?.release_date || item?.first_air_date || "";
}

function getYear(item) {
    const date = getReleaseDate(item);
    return date ? date.slice(0, 4) : "—";
}

function formatRuntime(item) {
    if (item?.runtime) {
        return `${item.runtime} min`;
    }

    if (
        Array.isArray(item?.episode_run_time) &&
        item.episode_run_time[0]
    ) {
        return `${item.episode_run_time[0]} min/ep`;
    }

    return "Runtime unavailable";
}

function formatGenres(item) {
    return Array.isArray(item?.genres)
        ? item.genres.map((genre) => genre.name).join(" • ")
        : "";
}

function findTrailer(videos) {
    const results = videos?.results || [];

    return (
        results.find(
            (video) =>
                video.site === "YouTube" &&
                video.type === "Trailer" &&
                video.official
        ) ||
        results.find(
            (video) =>
                video.site === "YouTube" &&
                video.type === "Trailer"
        ) ||
        results.find(
            (video) =>
                video.site === "YouTube" &&
                video.type === "Teaser"
        )
    );
}

function getRegionProviders(item) {
    const region =
        MOVIEVERSE_CONFIG.tmdbRegion || "US";

    const providerData =
        item?.["watch/providers"]?.results?.[region];

    if (!providerData) {
        return null;
    }

    return {
        link: providerData.link || "",
        flatrate: providerData.flatrate || [],
        free: providerData.free || [],
        ads: providerData.ads || [],
        rent: providerData.rent || [],
        buy: providerData.buy || []
    };
}

function createProviderCards(providers = []) {
    return providers
        .slice(0, 8)
        .map((provider) => {
            const name = escapeHTML(
                provider.provider_name || "Provider"
            );

            const logo = provider.logo_path
                ? `https://image.tmdb.org/t/p/w92${provider.logo_path}`
                : "";

            return `
                <div class="provider-card">
                    <div class="provider-logo">
                        ${
                            logo
                                ? `
                                    <img
                                        src="${logo}"
                                        alt="${name}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <span>MV</span>
                                `
                        }
                    </div>

                    <span>${name}</span>
                </div>
            `;
        })
        .join("");
}

function renderWhereToWatch(item) {
    const providers = getRegionProviders(item);

    if (!providers) {
        return `
            <section class="details-section">
                <div class="details-section-heading">
                    <div>
                        <p class="kicker">Availability</p>
                        <h2>Where to <em>watch.</em></h2>
                    </div>
                </div>

                <div class="provider-empty">
                    <span>◌</span>

                    <div>
                        <strong>
                            No provider listing found
                        </strong>

                        <p>
                            TMDB does not currently list
                            availability for this title in
                            your selected region.
                        </p>
                    </div>
                </div>
            </section>
        `;
    }

    const sections = [
        {
            key: "flatrate",
            label: "Streaming",
            items: providers.flatrate
        },
        {
            key: "free",
            label: "Free",
            items: providers.free
        },
        {
            key: "ads",
            label: "With ads",
            items: providers.ads
        },
        {
            key: "rent",
            label: "Rent",
            items: providers.rent
        },
        {
            key: "buy",
            label: "Buy",
            items: providers.buy
        }
    ];

    const availableSections =
        sections.filter(
            (section) => section.items.length
        );

    if (!availableSections.length) {
        return `
            <section class="details-section">
                <div class="details-section-heading">
                    <div>
                        <p class="kicker">Availability</p>
                        <h2>Where to <em>watch.</em></h2>
                    </div>
                </div>

                <div class="provider-empty">
                    <span>◌</span>

                    <div>
                        <strong>
                            No availability listed
                        </strong>

                        <p>
                            TMDB currently has no provider
                            options listed for this title
                            in your selected region.
                        </p>
                    </div>
                </div>
            </section>
        `;
    }

    return `
        <section class="details-section">
            <div class="details-section-heading">
                <div>
                    <p class="kicker">Availability</p>
                    <h2>Where to <em>watch.</em></h2>
                </div>

                <span class="provider-region">
                    REGION
                    ${escapeHTML(
                        MOVIEVERSE_CONFIG.tmdbRegion || "US"
                    )}
                </span>
            </div>

            <div class="provider-groups">
                ${availableSections
                    .map(
                        (section) => `
                            <div class="provider-group">
                                <span class="provider-group-label">
                                    ${escapeHTML(
                                        section.label
                                    )}
                                </span>

                                <div class="provider-grid">
                                    ${createProviderCards(
                                        section.items
                                    )}
                                </div>
                            </div>
                        `
                    )
                    .join("")}
            </div>

            ${
                providers.link
                    ? `
                        <a
                            class="button button-outline provider-link"
                            href="${escapeHTML(
                                providers.link
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View availability ↗
                        </a>
                    `
                    : ""
            }
        </section>
    `;
}

function createModal() {
    if (
        document.getElementById(
            "movieverse-details-modal"
        )
    ) {
        return document.getElementById(
            "movieverse-details-modal"
        );
    }

    const modal = document.createElement("div");

    modal.id = "movieverse-details-modal";
    modal.className = "details-modal";
    modal.hidden = true;

    modal.innerHTML = `
        <div class="details-backdrop"></div>

        <div
            class="details-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-title"
        >
            <button
                type="button"
                class="details-close"
                aria-label="Close details"
            >
                ×
            </button>

            <div class="details-loading">
                <div class="details-loader"></div>
                <p>
                    Opening your next story...
                </p>
            </div>

            <div
                class="details-content"
                hidden
            ></div>
        </div>
    `;

    document.body.appendChild(modal);

    modal
        .querySelector(".details-close")
        ?.addEventListener(
            "click",
            closeDetails
        );

    modal
        .querySelector(".details-backdrop")
        ?.addEventListener(
            "click",
            closeDetails
        );

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            !modal.hidden
        ) {
            closeDetails();
        }
    });

    return modal;
}

function renderLoading() {
    detailsModal.querySelector(
        ".details-loading"
    ).hidden = false;

    detailsModal.querySelector(
        ".details-content"
    ).hidden = true;
}

function renderError(
    message =
        "This title could not be opened right now."
) {
    const content =
        detailsModal.querySelector(
            ".details-content"
        );

    content.innerHTML = `
        <div class="details-error">
            <p class="kicker">
                MovieVerse
            </p>

            <h2>
                Something interrupted<br>
                <em>the story.</em>
            </h2>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                class="button button-primary"
                data-details-close
            >
                Close <span>×</span>
            </button>
        </div>
    `;

    detailsModal.querySelector(
        ".details-loading"
    ).hidden = true;

    content.hidden = false;

    content
        .querySelector("[data-details-close]")
        ?.addEventListener(
            "click",
            closeDetails
        );
}

function toLibraryItem(item, mediaType) {
    return {
        id: String(item.id),
        mediaType,
        title: getTitle(item),
        posterPath: item.poster_path || null,
        backdropPath: item.backdrop_path || null,
        overview: item.overview || "",
        voteAverage: Number.isFinite(
            item.vote_average
        )
            ? item.vote_average
            : null,
        releaseDate:
            item.release_date ||
            item.first_air_date ||
            ""
    };
}

function renderDetails(
    item,
    credits,
    videos,
    similar,
    mediaType
) {
    const content =
        detailsModal.querySelector(
            ".details-content"
        );

    currentDetailItem = item;
    currentMediaType = mediaType;

    const title = getTitle(item);
    const year = getYear(item);
    const runtime = formatRuntime(item);
    const genres = formatGenres(item);

    const rating = Number.isFinite(
        item?.vote_average
    )
        ? item.vote_average.toFixed(1)
        : "—";

    const votes = Number.isFinite(
        item?.vote_count
    )
        ? item.vote_count.toLocaleString()
        : "—";

    const imdbId = item?.external_ids?.imdb_id || item?.imdb_id || "";
    const imdbUrl = imdbId
        ? `https://www.imdb.com/title/${encodeURIComponent(imdbId)}/`
        : `https://www.imdb.com/find/?q=${encodeURIComponent(title)}`;

    const overview =
        item?.overview ||
        "No overview is currently available for this title.";

    const backdrop = item?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
        : "";

    const poster = getPosterUrl(
        item?.poster_path
    );

    const trailer = findTrailer(videos);

    const cast = Array.isArray(credits?.cast)
        ? credits.cast.slice(0, 8)
        : [];

    const crew = Array.isArray(credits?.crew)
        ? credits.crew
        : [];

    const director =
        crew.find(
            (person) =>
                person.job === "Director"
        ) ||
        crew.find(
            (person) =>
                person.job === "Series Director"
        ) ||
        null;

    const creator =
        Array.isArray(item?.created_by) &&
        item.created_by.length
            ? item.created_by[0]
            : null;

    const similarResults =
        Array.isArray(similar?.results)
            ? similar.results
                  .filter(
                      (entry) =>
                          entry.poster_path
                  )
                  .slice(0, 6)
            : [];

    const movieverseTier =
        item?.vote_average >= 8.5
            ? "MAX"
            : item?.vote_average >= 7.5
                ? "SUPER"
                : "FREE";

    const libraryItem =
        toLibraryItem(
            item,
            mediaType
        );

    const inMyList = isInMyList(
        libraryItem.id
    );

    const inWishlist = isInWishlist(
        libraryItem.id
    );

    const watched = isWatched(
        libraryItem.id
    );

    content.innerHTML = `
        <section
            class="details-hero"
            style="--details-backdrop:url('${backdrop}')"
        >
            <div class="details-hero-image">
                ${
                    poster
                        ? `
                            <img
                                src="${poster}"
                                alt="${escapeHTML(
                                    title
                                )} poster"
                            >
                        `
                        : `
                            <div class="details-poster-fallback">
                                ${escapeHTML(title)}
                            </div>
                        `
                }
            </div>

            <div class="details-hero-copy">
                <p class="kicker">
                    MovieVerse title
                </p>

                <h1 id="details-title">
                    ${escapeHTML(title)}
                </h1>

                ${
                    item?.tagline
                        ? `
                            <p class="details-tagline">
                                ${escapeHTML(
                                    item.tagline
                                )}
                            </p>
                        `
                        : ""
                }

                <div class="details-facts">
                    <span>
                        ${escapeHTML(year)}
                    </span>

                    <span title="Rating provided by TMDB">
                        ★ ${rating} TMDB
                    </span>

                    <a class="details-imdb-link" href="${escapeHTML(imdbUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHTML(title)} on IMDb">
                        IMDb page ↗
                    </a>

                    <span>
                        ${
                            mediaType === "tv"
                                ? "Series"
                                : "Movie"
                        }
                    </span>

                    <span>
                        ${escapeHTML(runtime)}
                    </span>
                </div>

                ${
                    genres
                        ? `
                            <p class="details-genres">
                                ${escapeHTML(
                                    genres
                                )}
                            </p>
                        `
                        : ""
                }

                <p class="details-overview">
                    ${escapeHTML(overview)}
                </p>

                <div class="details-actions">
                    <button
                        type="button"
                        class="button ${
                            inMyList
                                ? "button-primary"
                                : "button-primary"
                        }"
                        data-details-list
                        data-active="${
                            inMyList
                                ? "true"
                                : "false"
                        }"
                    >
                        ${
                            inMyList
                                ? "✓ In My List"
                                : "+ My List"
                        }
                    </button>

                    <button
                        type="button"
                        class="button button-quiet"
                        data-details-wishlist
                        data-active="${
                            inWishlist
                                ? "true"
                                : "false"
                        }"
                    >
                        ${
                            inWishlist
                                ? "♥ In Wishlist"
                                : "♡ Wishlist"
                        }
                    </button>

                    <button
                        type="button"
                        class="button button-quiet"
                        data-details-watched
                        data-active="${
                            watched
                                ? "true"
                                : "false"
                        }"
                    >
                        ${
                            watched
                                ? "✓ Watched"
                                : "Mark Watched"
                        }
                    </button>

                    ${
                        trailer
                            ? `
                                <button
                                    type="button"
                                    class="button button-outline"
                                    data-trailer-key="${escapeHTML(
                                        trailer.key
                                    )}"
                                >
                                    Watch Trailer ↗
                                </button>
                            `
                            : ""
                    }
                </div>

                <div class="details-access">
                    <span class="tier tier-${movieverseTier.toLowerCase()}">
                        ${movieverseTier}
                    </span>

                    <span>
                        MovieVerse access
                    </span>
                </div>
            </div>
        </section>

        <section class="details-section">
            <div class="details-section-heading">
                <div>
                    <p class="kicker">
                        The story
                    </p>

                    <h2>
                        About <em>this title.</em>
                    </h2>
                </div>
            </div>

            <div class="details-info-grid">
                <div>
                    <span class="details-label">
                        TMDB rating
                    </span>

                    <strong>
                        ★ ${rating} / 10
                    </strong>
                    <a class="details-imdb-link" href="${escapeHTML(imdbUrl)}" target="_blank" rel="noopener noreferrer">Check IMDb ↗</a>
                </div>

                <div>
                    <span class="details-label">
                        Votes
                    </span>

                    <strong>
                        ${votes}
                    </strong>
                </div>

                <div>
                    <span class="details-label">
                        Release
                    </span>

                    <strong>
                        ${escapeHTML(year)}
                    </strong>
                </div>

                <div>
                    <span class="details-label">
                        Runtime
                    </span>

                    <strong>
                        ${escapeHTML(runtime)}
                    </strong>
                </div>
            </div>
        </section>

        ${renderWhereToWatch(item)}

        ${
            director || creator
                ? `
                    <section class="details-section">
                        <div class="details-section-heading">
                            <div>
                                <p class="kicker">
                                    Behind the story
                                </p>

                                <h2>
                                    Key <em>creator.</em>
                                </h2>
                            </div>
                        </div>

                        <div class="details-person-row">
                            ${
                                director
                                    ? `
                                        <div class="details-person">
                                            <strong>
                                                Director
                                            </strong>

                                            <span>
                                                ${escapeHTML(
                                                    director.name
                                                )}
                                            </span>
                                        </div>
                                    `
                                    : ""
                            }

                            ${
                                creator
                                    ? `
                                        <div class="details-person">
                                            <strong>
                                                Creator
                                            </strong>

                                            <span>
                                                ${escapeHTML(
                                                    creator.name
                                                )}
                                            </span>
                                        </div>
                                    `
                                    : ""
                            }
                        </div>
                    </section>
                `
                : ""
        }

        ${
            cast.length
                ? `
                    <section class="details-section">
                        <div class="details-section-heading">
                            <div>
                                <p class="kicker">
                                    Faces you know
                                </p>

                                <h2>
                                    Cast
                                    <em>& characters.</em>
                                </h2>
                            </div>
                        </div>

                        <div class="details-cast-grid">
                            ${cast
                                .map((person) => {
                                    const profileImage =
                                        person.profile_path
                                            ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                                            : "";

                                    return `
                                        <article
                                            class="details-cast-card"
                                            tabindex="0"
                                            role="link"
                                            data-person-id="${escapeHTML(person.id || "")}"
                                            data-person-name="${escapeHTML(person.name || "")}"
                                            data-person-character="${escapeHTML(person.character || "")}"
                                            title="Hover for cast details · click to search Google"
                                            aria-label="More about ${escapeHTML(person.name || "cast member")}"
                                        >
                                            <div
                                                class="details-cast-image"
                                            >
                                                ${
                                                    profileImage
                                                        ? `
                                                            <img
                                                                src="${profileImage}"
                                                                alt="${escapeHTML(
                                                                    person.name
                                                                )}"
                                                                loading="lazy"
                                                            >
                                                        `
                                                        : `
                                                            <span>
                                                                MV
                                                            </span>
                                                        `
                                                }
                                            </div>

                                            <strong>
                                                ${escapeHTML(
                                                    person.name
                                                )}
                                            </strong>

                                            <small>
                                                ${escapeHTML(
                                                    person.character ||
                                                    "Cast"
                                                )}
                                            </small>
                                        </article>
                                    `;
                                })
                                .join("")}
                        </div>
                    </section>
                `
                : ""
        }

        ${
            similarResults.length
                ? `
                    <section class="details-section">
                        <div class="details-section-heading">
                            <div>
                                <p class="kicker">
                                    Stay in orbit
                                </p>

                                <h2>
                                    More like <em>this.</em>
                                </h2>
                            </div>
                        </div>

                        <div class="details-similar-grid">
                            ${similarResults
                                .map((entry) => {
                                    const entryTitle =
                                        getTitle(entry);

                                    const entryPoster =
                                        getPosterUrl(
                                            entry.poster_path
                                        );

                                    const entryType =
                                        entry.media_type ||
                                        mediaType;

                                    return `
                                        <button
                                            type="button"
                                            class="details-similar-card"
                                            data-similar-id="${entry.id}"
                                            data-similar-type="${entryType}"
                                        >
                                            <img
                                                src="${entryPoster}"
                                                alt="${escapeHTML(
                                                    entryTitle
                                                )}"
                                                loading="lazy"
                                            >

                                            <span>
                                                ${escapeHTML(
                                                    entryTitle
                                                )}
                                            </span>
                                        </button>
                                    `;
                                })
                                .join("")}
                        </div>
                    </section>
                `
                : ""
        }
    `;

    detailsModal.querySelector(
        ".details-loading"
    ).hidden = true;

    content.hidden = false;

    bindDetailsActions(
        libraryItem,
        trailer
    );

    addRecentlyViewed(
        libraryItem
    );
}

function bindDetailsActions(
    libraryItem,
    trailer
) {
    const listButton =
        detailsModal.querySelector(
            "[data-details-list]"
        );

    const wishlistButton =
        detailsModal.querySelector(
            "[data-details-wishlist]"
        );

    const watchedButton =
        detailsModal.querySelector(
            "[data-details-watched]"
        );

    listButton?.addEventListener(
        "click",
        () => {
            const result =
                toggleMyList(
                    libraryItem
                );

            if (result.active) {
                listButton.textContent =
                    "✓ In My List";

                listButton.dataset.active =
                    "true";
            } else {
                listButton.textContent =
                    "+ My List";

                listButton.dataset.active =
                    "false";
            }
        }
    );

    wishlistButton?.addEventListener(
        "click",
        () => {
            const result =
                toggleWishlist(
                    libraryItem
                );

            if (result.active) {
                wishlistButton.textContent =
                    "♥ In Wishlist";

                wishlistButton.dataset.active =
                    "true";
            } else {
                wishlistButton.textContent =
                    "♡ Wishlist";

                wishlistButton.dataset.active =
                    "false";
            }
        }
    );

    watchedButton?.addEventListener(
        "click",
        () => {
            markWatched(
                libraryItem
            );

            watchedButton.textContent =
                "✓ Watched";

            watchedButton.dataset.active =
                "true";
        }
    );

    detailsModal
        .querySelector("[data-trailer-key]")
        ?.addEventListener(
            "click",
            (event) => {
                const key =
                    event.currentTarget
                        .dataset
                        .trailerKey;

                if (!key) {
                    return;
                }

                window.open(
                    `https://www.youtube.com/watch?v=${encodeURIComponent(
                        key
                    )}`,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        );

    detailsModal
        .querySelectorAll(
            "[data-similar-id]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    openDetails(
                        button.dataset
                            .similarId,
                        button.dataset
                            .similarType ||
                            "movie"
                    );
                }
            );
        });
}

async function loadDetails(
    id,
    mediaType
) {
    const isTv =
        mediaType === "tv";

    const [
        item,
        credits,
        videos,
        similar
    ] = await Promise.all([
        isTv
            ? getTvDetails(id)
            : getMovieDetails(id),

        getCredits(
            id,
            mediaType
        ),

        getVideos(
            id,
            mediaType
        ),

        getSimilar(
            id,
            mediaType
        )
    ]);

    renderDetails(
        item,
        credits,
        videos,
        similar,
        mediaType
    );
}

export async function openDetails(
    id,
    mediaType = "movie"
) {
    if (!id) {
        return;
    }

    detailsModal =
        createModal();

    detailsModal.hidden = false;

    document.body.classList.add(
        "details-open"
    );

    renderLoading();

    try {
        await loadDetails(
            id,
            mediaType
        );
    } catch (error) {
        console.error(
            "MovieVerse details failed:",
            error
        );

        renderError(
            "MovieVerse could not load this title from TMDB."
        );
    }
}

export function closeDetails() {
    if (!detailsModal) {
        return;
    }

    detailsModal.hidden = true;

    document.body.classList.remove(
        "details-open"
    );
}

export function setupDetails() {
    document.addEventListener(
        "click",
        (event) => {
            const card =
                event.target.closest(
                    ".movie-card[data-tmdb-id]"
                );

            if (!card) {
                return;
            }

            const id =
                card.dataset.tmdbId;

            const mediaType =
                card.dataset.mediaType ||
                "movie";

            if (!id) {
                return;
            }

            openDetails(
                id,
                mediaType
            );
        }
    );
}