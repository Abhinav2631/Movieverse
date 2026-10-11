import {
    discoverBoth,
    getMovieGenres,
    getTvGenres,
    getPosterUrl
} from "./tmdb.js";

import {
    getActiveProfile
} from "./profiles.js";

import {
    openDetails
} from "./details.js";

const escapeHTML = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

function getTitle(item) {
    return item.title || item.name || "Untitled";
}

function getYear(item) {
    const date =
        item.release_date ||
        item.first_air_date ||
        "";

    return date ? date.slice(0, 4) : "";
}

async function getPreferenceParams(profile) {
    const preferences =
        profile?.preferences || {};

    const params = {};

    const languages =
        Array.isArray(preferences.languages)
            ? preferences.languages
            : [];

    const domains =
        Array.isArray(preferences.domains)
            ? preferences.domains
            : [];

    const selectedGenres =
        Array.isArray(preferences.genres)
            ? preferences.genres
            : [];

    if (languages.length) {
        const languageMap = {
            English: "en",
            Hindi: "hi",
            Telugu: "te",
            Tamil: "ta",
            Malayalam: "ml",
            Kannada: "kn",
            Korean: "ko",
            Japanese: "ja",
            Spanish: "es",
            French: "fr",
            German: "de",
            Italian: "it",
            Chinese: "zh"
        };

        const code =
            languageMap[languages[0]];

        if (code) {
            params.with_original_language =
                code;
        }
    }

    const [
        movieGenres,
        tvGenres
    ] = await Promise.all([
        getMovieGenres(),
        getTvGenres()
    ]);

    const genreMap = new Map();

    [
        ...(movieGenres.genres || []),
        ...(tvGenres.genres || [])
    ].forEach((genre) => {
        genreMap.set(
            genre.name.toLowerCase(),
            genre.id
        );
    });

    const genreIds =
        selectedGenres
            .map(
                (genre) =>
                    genreMap.get(
                        genre.toLowerCase()
                    )
            )
            .filter(Boolean);

    if (genreIds.length) {
        params.with_genres =
            genreIds
                .slice(0, 4)
                .join("|");
    }

    if (
        domains.some(
            (domain) =>
                domain.toLowerCase() ===
                "anime"
        )
    ) {
        params.with_genres =
            params.with_genres
                ? `${params.with_genres}|16`
                : "16";

        params.with_original_language =
            "ja";
    }

    return params;
}

function createCard(item) {
    const title = getTitle(item);

    const poster =
        item.poster_path
            ? getPosterUrl(
                  item.poster_path,
                  "w342"
              )
            : "";

    return `
        <button
            type="button"
            class="personalized-card"
            data-id="${item.id}"
            data-type="${
                item.media_type || "movie"
            }"
        >
            <div class="personalized-poster">
                ${
                    poster
                        ? `
                            <img
                                src="${poster}"
                                alt="${escapeHTML(
                                    title
                                )}"
                                loading="lazy"
                            >
                        `
                        : `
                            <span>MV</span>
                        `
                }
            </div>

            <div class="personalized-copy">
                <strong>
                    ${escapeHTML(title)}
                </strong>

                <small>
                    ${
                        item.media_type ===
                        "tv"
                            ? "Series"
                            : "Movie"
                    }
                    ${
                        getYear(item)
                            ? ` • ${getYear(
                                  item
                              )}`
                            : ""
                    }
                    ${
                        Number.isFinite(
                            item.vote_average
                        )
                            ? ` • ★ ${item.vote_average.toFixed(
                                  1
                              )}`
                            : ""
                    }
                </small>
            </div>
        </button>
    `;
}

function createSection(profile) {
    const section =
        document.createElement("section");

    section.id =
        "personalized-discovery";

    section.className =
        "content-section section-reveal personalized-section";

    section.innerHTML = `
        <div class="section-heading">
            <div>
                <p class="kicker">
                    Curated for ${
                        escapeHTML(
                            profile?.name ||
                                "you"
                        )
                    }
                </p>

                <h2>
                    Made for <em>your orbit.</em>
                </h2>
            </div>
        </div>

        <div class="personalized-rail">
            <div class="personalized-loading">
                <div class="details-loader"></div>
            </div>
        </div>
    `;

    return section;
}

async function renderPersonalized() {
    const wrap =
        document.querySelector(
            ".content-wrap"
        );

    if (!wrap) {
        return;
    }

    document
        .getElementById(
            "personalized-discovery"
        )
        ?.remove();

    const profile =
        getActiveProfile();

    if (!profile) {
        return;
    }

    const section =
        createSection(profile);

    const recommendation =
        wrap.querySelector(
            '[data-rail="recommendations"]'
        )?.closest(
            ".content-section"
        );

    if (recommendation) {
        recommendation.insertAdjacentElement(
            "afterend",
            section
        );
    } else {
        wrap.prepend(section);
    }

    try {
        const params =
            await getPreferenceParams(
                profile
            );

        const results =
            await discoverBoth(
                params
            );

        const filtered =
            results
                .filter(
                    (item) =>
                        item.poster_path
                )
                .slice(0, 12);

        const rail =
            section.querySelector(
                ".personalized-rail"
            );

        if (!filtered.length) {
            rail.innerHTML = `
                <div class="personalized-empty">
                    MovieVerse is still learning your orbit.
                </div>
            `;
        } else {
            rail.innerHTML =
                filtered
                    .map(createCard)
                    .join("");

            rail
                .querySelectorAll(
                    "[data-id]"
                )
                .forEach((card) => {
                    card.addEventListener(
                        "click",
                        () => {
                            openDetails(
                                card.dataset.id,
                                card.dataset.type
                            );
                        }
                    );
                });
        }

        requestAnimationFrame(
            () =>
                section.classList.add(
                    "is-visible"
                )
        );
    } catch (error) {
        console.warn(
            "MovieVerse personalization failed:",
            error
        );

        section.querySelector(
            ".personalized-rail"
        ).innerHTML = `
            <div class="personalized-empty">
                Personalized discovery will appear when more preferences are available.
            </div>
        `;

        section.classList.add(
            "is-visible"
        );
    }
}

export function setupPersonalization() {
    renderPersonalized();

    window.addEventListener(
        "movieverse:profile-selected",
        renderPersonalized
    );

    window.addEventListener(
        "movieverse:library-updated",
        renderPersonalized
    );
}