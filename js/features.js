import {
    discoverMedia,
    discoverBoth,
    getTrending,
    getMovieGenres,
    getTvGenres,
    getWatchProviderCatalog,
    getPersonDetails,
    getMovieDetails,
    getTvDetails,
    getPosterUrl,
    getProfileUrl,
    searchMulti
} from "./tmdb.js";

import { openDetails } from "./details.js";

const LANGUAGE_CODES = {
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

const MOODS = {
    Happy: {
        genres: "35|10751"
    },

    Funny: {
        genres: "35"
    },

    Romantic: {
        genres: "10749|18"
    },

    Excited: {
        genres: "28|12"
    },

    Scary: {
        genres: "27|53"
    },

    Emotional: {
        genres: "18|10749"
    },

    Thoughtful: {
        genres: "18|9648|99"
    },

    Relaxed: {
        genres: "16|10751"
    },

    Energetic: {
        genres: "28|12|35"
    }
};

const DOMAINS = [
    {
        key: "movies",
        title: "Movies",
        description: "Big-screen stories",
        type: "discover",
        params: {}
    },
    {
        key: "series",
        title: "TV & Web Series",
        description: "Long-form stories",
        type: "tv",
        params: {}
    },
    {
        key: "anime",
        title: "Anime",
        description: "Japanese animation worlds",
        type: "discover",
        params: {
            with_genres: "16",
            with_original_language: "ja"
        }
    },
    {
        key: "sports",
        title: "Sports",
        description: "Sports films, teams, athletes, racing and documentaries",
        type: "search",
        queries: ["sports", "football", "cricket", "basketball", "Formula 1", "boxing"]
    },
    {
        key: "music",
        title: "Music & Performance",
        description: "Concerts, musicians, bands and music stories",
        type: "search",
        queries: ["music", "concert", "singer", "musical"]
    },
    {
        key: "dance",
        title: "Dance",
        description: "Dance films, performers and choreography",
        type: "search",
        queries: ["dance", "ballet", "dancer"]
    },
    {
        key: "comedy",
        title: "Comedy",
        description: "Good mood territory",
        type: "discover",
        params: {
            with_genres: "35"
        }
    },
    {
        key: "reality",
        title: "Reality & Talent",
        description: "Reality discovery",
        type: "search",
        queries: ["reality", "talent show", "competition series"]
    },
    {
        key: "docs",
        title: "Documentaries",
        description: "Look closer",
        type: "discover",
        params: {
            with_genres: "99"
        }
    },
    {
        key: "family",
        title: "Family & Kids",
        description: "For everyone",
        type: "discover",
        params: {
            with_genres: "10751|16"
        }
    },
    {
        key: "gaming",
        title: "Gaming & Esports",
        description: "Gaming worlds",
        type: "search",
        queries: ["gaming", "video game", "esports", "gamer"]
    },
    {
        key: "education",
        title: "Educational",
        description: "Learn and explore",
        type: "search",
        queries: ["science documentary", "history documentary", "educational documentary", "nature documentary"]
    }
];

let modal = null;
let content = null;
let activeTab = "domains";
let compareFirst = null;

const escapeHTML = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

function createModal() {
    if (modal) {
        return modal;
    }

    modal = document.createElement("div");
    modal.className = "mv-feature-modal";
    modal.hidden = true;

    modal.innerHTML = `
        <div class="mv-feature-backdrop"></div>

        <section
            class="mv-feature-dialog"
            role="dialog"
            aria-modal="true"
        >
            <button
                type="button"
                class="mv-feature-close"
                aria-label="Close explorer"
            >
                ×
            </button>

            <div class="mv-feature-header">
                <p class="kicker">
                    MovieVerse discovery
                </p>

                <h2>
                    Explore your <em>universe.</em>
                </h2>

                <p>
                    Follow a feeling, language, genre,
                    platform or entertainment world.
                </p>
            </div>

            <div class="mv-feature-tabs">
                <button data-feature-tab="domains">
                    Worlds
                </button>

                <button data-feature-tab="genres">
                    Genres
                </button>

                <button data-feature-tab="languages">
                    Languages
                </button>

                <button data-feature-tab="ott">
                    OTT
                </button>

                <button data-feature-tab="moods">
                    Mood
                </button>

                <button data-feature-tab="surprise">
                    Surprise Me
                </button>

                <button data-feature-tab="watchmatch">
                    Watch Match
                </button>

                <button data-feature-tab="compare">
                    Compare
                </button>
            </div>

            <div class="mv-feature-content"></div>
        </section>
    `;

    document.body.appendChild(modal);

    content =
        modal.querySelector(
            ".mv-feature-content"
        );

    modal
        .querySelector(
            ".mv-feature-close"
        )
        ?.addEventListener(
            "click",
            closeFeatures
        );

    modal
        .querySelector(
            ".mv-feature-backdrop"
        )
        ?.addEventListener(
            "click",
            closeFeatures
        );

    modal
        .querySelectorAll(
            "[data-feature-tab]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    openFeatureTab(
                        button.dataset
                            .featureTab
                    );
                }
            );
        });

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                !modal.hidden
            ) {
                closeFeatures();
            }
        }
    );

    return modal;
}

function updateTabs() {
    modal
        .querySelectorAll(
            "[data-feature-tab]"
        )
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset
                    .featureTab ===
                    activeTab
            );
        });
}

export function openFeatures(
    tab = "domains"
) {
    createModal();

    modal.hidden = false;

    document.body.classList.add(
        "mv-feature-open"
    );

    openFeatureTab(tab);
}

export function closeFeatures() {
    if (!modal) {
        return;
    }

    modal.hidden = true;

    document.body.classList.remove(
        "mv-feature-open"
    );
}

async function openFeatureTab(tab) {
    createModal();

    activeTab = tab;

    updateTabs();

    if (tab === "domains") {
        renderDomains();
        return;
    }

    if (tab === "genres") {
        await renderGenres();
        return;
    }

    if (tab === "languages") {
        renderLanguages();
        return;
    }

    if (tab === "ott") {
        await renderOTT();
        return;
    }

    if (tab === "moods") {
        renderMoods();
        return;
    }

    if (tab === "surprise") {
        await renderSurprise();
        return;
    }

    if (tab === "watchmatch") {
        renderWatchMatch();
        return;
    }

    if (tab === "compare") {
        renderComparePicker();
    }
}

function renderDomains() {
    content.innerHTML = `
        <div class="mv-feature-intro">
            <span class="kicker">
                Entertainment worlds
            </span>

            <h3>
                Find your <em>world.</em>
            </h3>
        </div>

        <div class="mv-domain-grid">
            ${DOMAINS.map(
                (domain) => `
                    <button
                        type="button"
                        class="mv-domain-card"
                        data-domain="${escapeHTML(
                            domain.key
                        )}"
                    >
                        <span>
                            ✦
                        </span>

                        <strong>
                            ${escapeHTML(
                                domain.title
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                domain.description
                            )}
                        </small>
                    </button>
                `
            ).join("")}
        </div>
    `;

    content
        .querySelectorAll(
            "[data-domain]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    loadDomain(
                        button.dataset
                            .domain
                    );
                }
            );
        });
}

async function renderGenres() {
    content.innerHTML =
        loadingMarkup();

    try {
        const [
            movieGenres,
            tvGenres
        ] = await Promise.all([
            getMovieGenres(),
            getTvGenres()
        ]);

        const names = new Map();

        [
            ...(movieGenres.genres || []),
            ...(tvGenres.genres || [])
        ].forEach((genre) => {
            names.set(
                genre.name
                    .toLowerCase(),
                genre
            );
        });

        const genres = [...names.values()]
            .sort((a, b) =>
                a.name.localeCompare(
                    b.name
                )
            );

        content.innerHTML = `
            <div class="mv-feature-intro">
                <span class="kicker">
                    Genre universe
                </span>

                <h3>
                    Choose a <em>genre.</em>
                </h3>
            </div>

            <div class="mv-chip-grid">
                ${genres
                    .map(
                        (genre) => `
                            <button
                                type="button"
                                class="mv-chip"
                                data-genre-id="${genre.id}"
                                data-genre-name="${escapeHTML(
                                    genre.name
                                )}"
                            >
                                ${escapeHTML(
                                    genre.name
                                )}
                            </button>
                        `
                    )
                    .join("")}
            </div>
        `;

        content
            .querySelectorAll(
                "[data-genre-id]"
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    () =>
                        loadDiscover(
                            {
                                with_genres:
                                    button
                                        .dataset
                                        .genreId
                            },
                            button.dataset
                                .genreName
                        )
                );
            });
    } catch {
        renderFeatureError();
    }
}

function renderLanguages() {
    const languages =
        Object.keys(
            LANGUAGE_CODES
        );

    content.innerHTML = `
        <div class="mv-feature-intro">
            <span class="kicker">
                Language explorer
            </span>

            <h3>
                Stories in your <em>language.</em>
            </h3>
        </div>

        <div class="mv-chip-grid">
            ${languages
                .map(
                    (language) => `
                        <button
                            type="button"
                            class="mv-chip"
                            data-language="${escapeHTML(
                                language
                            )}"
                        >
                            ${escapeHTML(
                                language
                            )}
                        </button>
                    `
                )
                .join("")}
        </div>
    `;

    content
        .querySelectorAll(
            "[data-language]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    const language =
                        button.dataset
                            .language;

                    loadDiscover(
                        {
                            with_original_language:
                                LANGUAGE_CODES[
                                    language
                                ]
                        },
                        language
                    );
                }
            );
        });
}

async function renderOTT() {
    content.innerHTML =
        loadingMarkup();

    try {
        const [
            movieProviders,
            tvProviders
        ] = await Promise.all([
            getWatchProviderCatalog(
                "movie"
            ),
            getWatchProviderCatalog(
                "tv"
            )
        ]);

        const providers = new Map();

        [
            ...(movieProviders.results || []),
            ...(tvProviders.results || [])
        ].forEach((provider) => {
            providers.set(
                provider.provider_id,
                provider
            );
        });

        const preferredProviders = [
            /netflix/i,
            /amazon prime video|prime video/i,
            /jiohotstar|disney.?hotstar|hotstar/i,
            /^zee5$/i,
            /^aha$/i,
            /sony liv/i,
            /apple tv/i,
            /crunchyroll/i,
            /sun nxt/i,
            /lionsgate play/i,
            /hoichoi/i,
            /manoramamax/i
        ];
        const providerPriority = (name = "") => {
            const index = preferredProviders.findIndex((pattern) => pattern.test(name));
            return index < 0 ? preferredProviders.length : index;
        };
        const sorted = [
            ...providers.values()
        ].sort((a, b) => {
            const priorityDifference = providerPriority(a.provider_name) - providerPriority(b.provider_name);
            return priorityDifference || a.provider_name.localeCompare(b.provider_name);
        });

        content.innerHTML = `
            <div class="mv-feature-intro">
                <span class="kicker">
                    OTT discovery
                </span>

                <h3>
                    Browse by <em>platform.</em>
                </h3>
            </div>

            <div class="mv-provider-grid">
                ${sorted
                    .slice(0, 80)
                    .map(
                        (provider) => `
                            <button
                                type="button"
                                class="mv-provider-card"
                                data-provider-id="${provider.provider_id}"
                                data-provider-name="${escapeHTML(
                                    provider.provider_name
                                )}"
                            >
                                ${
                                    provider.logo_path
                                        ? `
                                            <img
                                                src="${getPosterUrl(
                                                    provider.logo_path,
                                                    "w92"
                                                )}"
                                                alt="${escapeHTML(
                                                    provider.provider_name
                                                )}"
                                            >
                                        `
                                        : `<span>MV</span>`
                                }

                                <strong>
                                    ${escapeHTML(
                                        provider.provider_name
                                    )}
                                </strong>
                            </button>
                        `
                    )
                    .join("")}
            </div>
        `;

        content
            .querySelectorAll(
                "[data-provider-id]"
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    () => {
                        loadDiscover(
                            {
                                with_watch_providers:
                                    button
                                        .dataset
                                        .providerId,

                                watch_region:
                                    "IN",

                                with_watch_monetization_types:
                                    "flatrate|free|ads"
                            },
                            button.dataset
                                .providerName
                        );
                    }
                );
            });
    } catch {
        renderFeatureError();
    }
}

function renderMoods() {
    content.innerHTML = `
        <div class="mv-feature-intro">
            <span class="kicker">
                Discover by feeling
            </span>

            <h3>
                What's your <em>mood?</em>
            </h3>
        </div>

        <div class="mv-chip-grid mood-grid">
            ${Object.keys(MOODS)
                .map(
                    (mood) => `
                        <button
                            type="button"
                            class="mv-chip mood-chip"
                            data-mood="${escapeHTML(
                                mood
                            )}"
                        >
                            ${escapeHTML(
                                mood
                            )}
                        </button>
                    `
                )
                .join("")}
        </div>
    `;

    content
        .querySelectorAll(
            "[data-mood]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    const mood =
                        button.dataset
                            .mood;

                    loadDiscover(
                        {
                            with_genres:
                                MOODS[mood]
                                    .genres
                        },
                        mood
                    );
                }
            );
        });
}

async function renderSurprise() {
    content.innerHTML =
        loadingMarkup();

    try {
        const response =
            await getTrending();

        const results =
            (response.results || [])
                .filter(
                    (item) =>
                        item.id &&
                        (
                            item.media_type ===
                                "movie" ||
                            item.media_type ===
                                "tv"
                        ) &&
                        item.poster_path
                );

        if (!results.length) {
            renderFeatureError();
            return;
        }

        const item =
            results[
                Math.floor(
                    Math.random() *
                        results.length
                )
            ];

        content.innerHTML = `
            <div class="mv-surprise">
                <p class="kicker">
                    A random signal
                </p>

                <h3>
                    Tonight's story is
                    <em>${escapeHTML(
                        item.title ||
                            item.name
                    )}</em>
                </h3>

                <button
                    type="button"
                    class="button button-primary"
                    data-surprise-open
                >
                    Open title <span>↗</span>
                </button>

                <button
                    type="button"
                    class="button button-quiet"
                    data-surprise-again
                >
                    Another signal <span>↻</span>
                </button>
            </div>
        `;

        content
            .querySelector(
                "[data-surprise-open]"
            )
            ?.addEventListener(
                "click",
                () => {
                    closeFeatures();

                    openDetails(
                        item.id,
                        item.media_type
                    );
                }
            );

        content
            .querySelector(
                "[data-surprise-again]"
            )
            ?.addEventListener(
                "click",
                renderSurprise
            );
    } catch {
        renderFeatureError();
    }
}

function renderWatchMatch() {
    content.innerHTML = `
        <div class="mv-feature-intro">
            <span class="kicker">
                MovieVerse Match
            </span>

            <h3>
                Tell us the <em>moment.</em>
            </h3>
        </div>

        <form class="mv-watch-match-form">
            <label>
                How are you feeling?
                <select name="mood">
                    ${Object.keys(MOODS)
                        .map(
                            (mood) => `
                                <option value="${escapeHTML(
                                    mood
                                )}">
                                    ${escapeHTML(
                                        mood
                                    )}
                                </option>
                            `
                        )
                        .join("")}
                </select>
            </label>

            <label>
                How much time?
                <select name="time">
                    <option value="45">
                        Around 45 minutes
                    </option>

                    <option value="75">
                        Around 75 minutes
                    </option>

                    <option value="100" selected>
                        Around 100 minutes
                    </option>

                    <option value="140">
                        2+ hours
                    </option>
                </select>
            </label>

            <label>
                Watching with?
                <select name="company">
                    <option value="solo">
                        Solo
                    </option>

                    <option value="date">
                        Date night
                    </option>

                    <option value="friends">
                        Friends
                    </option>

                    <option value="family">
                        Family
                    </option>
                </select>
            </label>

            <button
                class="button button-primary"
                type="submit"
            >
                Find my match <span>→</span>
            </button>
        </form>
    `;

    content
        .querySelector(
            ".mv-watch-match-form"
        )
        ?.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                const form =
                    event.currentTarget;

                const mood =
                    form.mood.value;

                const time =
                    Number(form.time.value);

                const company =
                    form.company.value;

                let genres =
                    MOODS[mood].genres;

                if (
                    company === "date"
                ) {
                    genres += "|10749";
                }

                if (
                    company === "friends"
                ) {
                    genres += "|35|28";
                }

                if (
                    company === "family"
                ) {
                    genres += "|10751|16";
                }

                await loadDiscover(
                    {
                        with_genres:
                            genres,
                        "with_runtime.lte":
                            time
                    },
                    "Your Watch Match"
                );
            }
        );
}

async function loadDomain(key) {
    const domain = DOMAINS.find((entry) => entry.key === key);
    if (!domain) return;

    content.innerHTML = loadingMarkup();

    if (domain.type === "search") {
        try {
            const queries = domain.queries || [domain.query].filter(Boolean);
            const responses = await Promise.all(queries.map((query) => searchMulti(query)));
            const unique = new Map();

            responses.forEach((response) => {
                (response?.results || []).forEach((item) => {
                    if (!item?.id || !["movie", "tv"].includes(item.media_type)) return;
                    const key = `${item.media_type}:${item.id}`;
                    if (!unique.has(key)) unique.set(key, item);
                });
            });

            const results = [...unique.values()]
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                .slice(0, 24);

            renderResults(results, domain.title);
        } catch (error) {
            console.warn(`MovieVerse ${domain.title} discovery failed:`, error);
            renderFeatureError();
        }
        return;
    }

    if (domain.type === "tv") {
        await loadDiscover({}, domain.title, "tv");
        return;
    }

    await loadDiscover(domain.params, domain.title);
}

/**
 * Open a specific world directly from the homepage tiles, without leaving
 * the user on the generic list of all worlds first.
 */
export function openDomain(key) {
    openFeatures("domains");
    return loadDomain(key);
}

async function loadDiscover(
    params,
    title,
    mediaType = "both"
) {
    content.innerHTML =
        loadingMarkup();

    try {
        let results = [];

        if (
            mediaType === "movie" ||
            mediaType === "tv"
        ) {
            const response =
                await discoverMedia(
                    mediaType,
                    params
                );

            results =
                (response.results || [])
                    .map((item) => ({
                        ...item,
                        media_type:
                            mediaType
                    }));
        } else {
            results =
                await discoverBoth(
                    params
                );
        }

        renderResults(
            results.slice(0, 24),
            title
        );
    } catch {
        renderFeatureError();
    }
}

function renderResults(
    results,
    title
) {
    if (!results.length) {
        content.innerHTML = `
            <div class="mv-feature-empty">
                <span>◌</span>

                <h3>
                    Nothing in orbit yet.
                </h3>

                <p>
                    Try another discovery path.
                </p>
            </div>
        `;

        return;
    }

    content.innerHTML = `
        <div class="mv-results-head">
            <div>
                <p class="kicker">
                    Discovery results
                </p>

                <h3>
                    ${escapeHTML(
                        title
                    )}
                </h3>
            </div>

            <button
                type="button"
                class="button button-quiet"
                data-results-back
            >
                ← Explore
            </button>
        </div>

        <div class="mv-results-grid">
            ${results
                .map((item) => {
                    const itemTitle =
                        item.title ||
                        item.name ||
                        "Untitled";

                    const poster =
                        getPosterUrl(
                            item.poster_path,
                            "w342"
                        );

                    const year = (
                        item.release_date ||
                        item.first_air_date ||
                        ""
                    ).slice(0, 4);

                    return `
                        <button
                            type="button"
                            class="mv-result-card"
                            data-result-id="${item.id}"
                            data-result-type="${item.media_type || "movie"}"
                        >
                            <img
                                src="${poster}"
                                alt="${escapeHTML(
                                    itemTitle
                                )}"
                                loading="lazy"
                            >

                            <div>
                                <strong>
                                    ${escapeHTML(
                                        itemTitle
                                    )}
                                </strong>

                                <small>
                                    ${
                                        item.media_type ===
                                        "tv"
                                            ? "Series"
                                            : "Movie"
                                    }
                                    ${
                                        year
                                            ? ` • ${escapeHTML(
                                                  year
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
                })
                .join("")}
        </div>
    `;

    content
        .querySelector(
            "[data-results-back]"
        )
        ?.addEventListener(
            "click",
            () =>
                openFeatureTab(
                    activeTab ===
                        "watchmatch"
                        ? "watchmatch"
                        : "domains"
                )
        );

    content
        .querySelectorAll(
            "[data-result-id]"
        )
        .forEach((card) => {
            card.addEventListener(
                "click",
                () => {
                    closeFeatures();

                    openDetails(
                        card.dataset
                            .resultId,
                        card.dataset
                            .resultType
                    );
                }
            );
        });
}

function renderComparePicker() {
    content.innerHTML = `
        <div class="mv-feature-intro">
            <span class="kicker">
                Compare titles
            </span>

            <h3>
                Put two stories <em>side by side.</em>
            </h3>
        </div>

        ${
            compareFirst
                ? `
                    <div class="mv-compare-selected">
                        <span>
                            First title
                        </span>

                        <strong>
                            ${escapeHTML(
                                compareFirst.title
                            )}
                        </strong>
                    </div>
                `
                : `
                    <p class="mv-compare-note">
                        Open a movie or series and use
                        Compare, or search for a first title below.
                    </p>
                `
        }

        <div class="mv-compare-search">
            <input
                type="search"
                placeholder="Search the second title..."
                id="mv-compare-input"
            />

            <div
                class="mv-compare-results"
                id="mv-compare-results"
            ></div>
        </div>
    `;

    const input =
        content.querySelector(
            "#mv-compare-input"
        );

    let timer = null;

    input?.addEventListener(
        "input",
        () => {
            window.clearTimeout(
                timer
            );

            const query =
                input.value.trim();

            if (!query) {
                return;
            }

            timer =
                window.setTimeout(
                    () =>
                        searchCompare(
                            query
                        ),
                    300
                );
        }
    );
}

async function searchCompare(
    query
) {
    const target =
        content.querySelector(
            "#mv-compare-results"
        );

    if (!target) {
        return;
    }

    target.innerHTML =
        loadingMarkup();

    try {
        const response =
            await searchMulti(
                query
            );

        const results =
            (response.results || [])
                .filter(
                    (item) =>
                        (
                            item.media_type ===
                                "movie" ||
                            item.media_type ===
                                "tv"
                        ) &&
                        item.poster_path
                )
                .slice(0, 8);

        target.innerHTML =
            results
                .map(
                    (item) => `
                        <button
                            type="button"
                            class="mv-compare-option"
                            data-compare-id="${item.id}"
                            data-compare-type="${item.media_type}"
                        >
                            <img
                                src="${getPosterUrl(
                                    item.poster_path,
                                    "w185"
                                )}"
                                alt="${escapeHTML(
                                    item.title ||
                                        item.name
                                )}"
                            >

                            <span>
                                ${escapeHTML(
                                    item.title ||
                                        item.name
                                )}
                            </span>
                        </button>
                    `
                )
                .join("");

        target
            .querySelectorAll(
                "[data-compare-id]"
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        const second =
                            await getFullDetails(
                                button
                                    .dataset
                                    .compareId,
                                button
                                    .dataset
                                    .compareType
                            );

                        if (
                            !compareFirst
                        ) {
                            compareFirst = {
                                ...second,
                                mediaType:
                                    button
                                        .dataset
                                        .compareType
                            };

                            renderComparePicker();
                            return;
                        }

                        renderComparison(
                            compareFirst,
                            second
                        );
                    }
                );
            });
    } catch {
        target.innerHTML = "";
    }
}

export async function openCompareFromDetails(
    item,
    mediaType
) {
    const full =
        await getFullDetails(
            item.id,
            mediaType
        );

    compareFirst = {
        ...full,
        mediaType
    };

    openFeatures("compare");
}

async function getFullDetails(
    id,
    mediaType
) {
    return mediaType === "tv"
        ? getTvDetails(id)
        : getMovieDetails(id);
}

function renderComparison(
    first,
    second
) {
    const firstTitle =
        first.title ||
        first.name ||
        "Untitled";

    const secondTitle =
        second.title ||
        second.name ||
        "Untitled";

    const firstGenres =
        (first.genres || [])
            .map((item) => item.name)
            .join(", ");

    const secondGenres =
        (second.genres || [])
            .map((item) => item.name)
            .join(", ");

    content.innerHTML = `
        <div class="mv-feature-intro">
            <span class="kicker">
                Title comparison
            </span>

            <h3>
                Two stories. One <em>orbit.</em>
            </h3>
        </div>

        <div class="mv-compare-table">
            <div class="mv-compare-title">
                <img
                    src="${getPosterUrl(
                        first.poster_path,
                        "w342"
                    )}"
                    alt="${escapeHTML(
                        firstTitle
                    )}"
                >

                <strong>
                    ${escapeHTML(
                        firstTitle
                    )}
                </strong>
            </div>

            <div class="mv-compare-title">
                <img
                    src="${getPosterUrl(
                        second.poster_path,
                        "w342"
                    )}"
                    alt="${escapeHTML(
                        secondTitle
                    )}"
                >

                <strong>
                    ${escapeHTML(
                        secondTitle
                    )}
                </strong>
            </div>
        </div>

        <div class="mv-comparison-grid">
            ${comparisonRow(
                "Rating",
                Number.isFinite(
                    first.vote_average
                )
                    ? first.vote_average.toFixed(1)
                    : "—",
                Number.isFinite(
                    second.vote_average
                )
                    ? second.vote_average.toFixed(1)
                    : "—"
            )}

            ${comparisonRow(
                "Votes",
                Number.isFinite(
                    first.vote_count
                )
                    ? first.vote_count.toLocaleString()
                    : "—",
                Number.isFinite(
                    second.vote_count
                )
                    ? second.vote_count.toLocaleString()
                    : "—"
            )}

            ${comparisonRow(
                "Release",
                (
                    first.release_date ||
                    first.first_air_date ||
                    "—"
                ).slice(0, 4),
                (
                    second.release_date ||
                    second.first_air_date ||
                    "—"
                ).slice(0, 4)
            )}

            ${comparisonRow(
                "Runtime",
                first.runtime
                    ? `${first.runtime} min`
                    : "—",
                second.runtime
                    ? `${second.runtime} min`
                    : "—"
            )}

            ${comparisonRow(
                "Genres",
                firstGenres || "—",
                secondGenres || "—"
            )}
        </div>

        <button
            type="button"
            class="button button-quiet"
            data-compare-reset
        >
            Compare another pair
        </button>
    `;

    content
        .querySelector(
            "[data-compare-reset]"
        )
        ?.addEventListener(
            "click",
            () => {
                compareFirst =
                    null;

                renderComparePicker();
            }
        );
}

function comparisonRow(
    label,
    first,
    second
) {
    return `
        <div class="mv-comparison-row">
            <span>
                ${escapeHTML(
                    label
                )}
            </span>

            <strong>
                ${escapeHTML(
                    first
                )}
            </strong>

            <strong>
                ${escapeHTML(
                    second
                )}
            </strong>
        </div>
    `;
}

export async function openPerson(
    personId
) {
    createModal();

    modal.hidden = false;

    document.body.classList.add(
        "mv-feature-open"
    );

    content.innerHTML =
        loadingMarkup();

    try {
        const person =
            await getPersonDetails(
                personId
            );

        renderPerson(person);
    } catch {
        renderFeatureError();
    }
}

function renderPerson(person) {
    const knownFor =
        person.combined_credits
            ?.cast || [];

    const credits =
        [...knownFor]
            .filter(
                (item) =>
                    item.poster_path
            )
            .sort(
                (a, b) =>
                    (b.popularity || 0) -
                    (a.popularity || 0)
            )
            .slice(0, 12);

    content.innerHTML = `
        <div class="mv-person">
            <div class="mv-person-top">
                <div class="mv-person-image">
                    ${
                        person.profile_path
                            ? `
                                <img
                                    src="${getProfileUrl(
                                        person.profile_path,
                                        "w342"
                                    )}"
                                    alt="${escapeHTML(
                                        person.name
                                    )}"
                                >
                            `
                            : `<span>MV</span>`
                    }
                </div>

                <div class="mv-person-copy">
                    <p class="kicker">
                        MovieVerse people
                    </p>

                    <h3>
                        ${escapeHTML(
                            person.name ||
                                "Unknown"
                        )}
                    </h3>

                    <p class="mv-person-known">
                        ${escapeHTML(
                            person.known_for_department ||
                                "Entertainment"
                        )}
                    </p>

                    <p class="mv-person-bio">
                        ${
                            escapeHTML(
                                person.biography ||
                                    "No biography is currently available."
                            )
                        }
                    </p>
                </div>
            </div>

            ${
                credits.length
                    ? `
                        <div class="mv-person-section">
                            <p class="kicker">
                                Known for
                            </p>

                            <h4>
                                Filmography <em>& credits.</em>
                            </h4>

                            <div class="mv-results-grid">
                                ${credits
                                    .map(
                                        (
                                            item
                                        ) => `
                                            <button
                                                type="button"
                                                class="mv-result-card"
                                                data-person-credit-id="${item.id}"
                                                data-person-credit-type="${item.media_type || "movie"}"
                                            >
                                                <img
                                                    src="${getPosterUrl(
                                                        item.poster_path,
                                                        "w342"
                                                    )}"
                                                    alt="${escapeHTML(
                                                        item.title ||
                                                            item.name
                                                    )}"
                                                    loading="lazy"
                                                >

                                                <div>
                                                    <strong>
                                                        ${escapeHTML(
                                                            item.title ||
                                                                item.name
                                                        )}
                                                    </strong>

                                                    <small>
                                                        ${
                                                            item.character
                                                                ? escapeHTML(
                                                                      item.character
                                                                  )
                                                                : ""
                                                        }
                                                    </small>
                                                </div>
                                            </button>
                                        `
                                    )
                                    .join("")}
                            </div>
                        </div>
                    `
                    : ""
            }
        </div>
    `;

    content
        .querySelectorAll(
            "[data-person-credit-id]"
        )
        .forEach((card) => {
            card.addEventListener(
                "click",
                () => {
                    closeFeatures();

                    openDetails(
                        card.dataset
                            .personCreditId,
                        card.dataset
                            .personCreditType
                    );
                }
            );
        });
}

function loadingMarkup() {
    return `
        <div class="mv-feature-loading">
            <div class="details-loader"></div>
            <p>
                Exploring the MovieVerse...
            </p>
        </div>
    `;
}

function renderFeatureError() {
    content.innerHTML = `
        <div class="mv-feature-empty">
            <span>!</span>

            <h3>
                The signal was interrupted.
            </h3>

            <p>
                MovieVerse couldn't load this discovery
                right now.
            </p>
        </div>
    `;
}

function textToMood(text) {
    const value =
        text.toLowerCase();

    return Object.keys(MOODS).find(
        (mood) =>
            value.includes(
                mood.toLowerCase()
            )
    );
}

function setupExternalTriggers() {
    document
        .querySelectorAll(
            ".mood-list button"
        )
        .forEach((button) => {
            button.addEventListener(
                "dblclick",
                () => {
                    const mood =
                        textToMood(
                            button.textContent
                        );

                    if (mood) {
                        openFeatures(
                            "moods"
                        );
                    }
                }
            );
        });

    document
        .querySelectorAll(
            ".genre-cloud span"
        )
        .forEach((element) => {
            element.setAttribute(
                "role",
                "button"
            );

            element.setAttribute(
                "tabindex",
                "0"
            );

            element.addEventListener(
                "click",
                () => {
                    const raw = element.textContent.trim().toLowerCase();
                    const genreIds = {
                        "sci-fi": 878,
                        thriller: 53,
                        comedy: 35,
                        animation: 16,
                        fantasy: 14,
                        drama: 18,
                        crime: 80,
                        romance: 10749
                    };
                    const genreNames = {
                        "sci-fi": "Science Fiction",
                        thriller: "Thriller",
                        comedy: "Comedy",
                        animation: "Animation",
                        fantasy: "Fantasy",
                        drama: "Drama",
                        crime: "Crime",
                        romance: "Romance"
                    };
                    const genreId = genreIds[raw];
                    if (!genreId) return;

                    openFeatures("genres");
                    window.setTimeout(() => {
                        loadDiscover(
                            { with_genres: String(genreId) },
                            genreNames[raw]
                        );
                    }, 50);
                }
            );
        });

    document
        .querySelectorAll(
            ".domain-tile"
        )
        .forEach((tile) => {
            tile.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();

                    const className =
                        [...tile.classList].find(
                            (item) =>
                                item.startsWith(
                                    "domain-"
                                )
                        );

                    const map = {
                        "domain-anime":
                            "anime",
                        "domain-sports":
                            "sports",
                        "domain-music":
                            "music",
                        "domain-docs":
                            "docs",
                        "domain-comedy":
                            "comedy"
                    };

                    openFeatures(
                        "domains"
                    );

                    const key =
                        map[className];

                    if (key) {
                        window.setTimeout(
                            () =>
                                loadDomain(
                                    key
                                ),
                            50
                        );
                    }
                }
            );
        });

    document
        .querySelectorAll(
            ".final-cta .button"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();

                    if (
                        button.textContent
                            .toLowerCase()
                            .includes(
                                "surprise"
                            )
                    ) {
                        openFeatures(
                            "surprise"
                        );
                    } else {
                        openFeatures(
                            "watchmatch"
                        );
                    }
                }
            );
        });

    const exploreNav =
        document.querySelector(
            '.main-nav a[href="#explore"]'
        );

    exploreNav?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();

            openFeatures(
                "domains"
            );
        }
    );
}

export function setupFeatures() {
    createModal();

    setupExternalTriggers();

    const footer =
        document.querySelector(
            ".site-footer"
        );

    if (
        footer &&
        !footer.querySelector(
            ".tmdb-attribution"
        )
    ) {
        const attribution =
            document.createElement(
                "small"
            );

        attribution.className =
            "tmdb-attribution";

        attribution.textContent =
            "MovieVerse uses TMDB data and imagery for entertainment discovery.";

        footer.appendChild(
            attribution
        );
    }
}