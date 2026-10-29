import {
    placeholderContent,
    palette,
    cardThemes,
    themeLabels
} from "./data/content.js";

import {
    contentVisuals
} from "./data/visuals.js";

import {
    getTrending,
    getPopularMovies,
    getPopularSeries,
    getTopRatedMovies,
    getNowPlaying,
    getUpcomingMovies,
    getPosterUrl
} from "./tmdb.js";

import {
    getAccessTier
} from "./access.js";

const railLoaders = {
    trending: getTrending,
    popularMovies:
        getPopularMovies,
    popularSeries:
        getPopularSeries,
    topRated:
        getTopRatedMovies,
    nowPlaying:
        getNowPlaying,
    upcoming:
        getUpcomingMovies,
    recommendations:
        null
};

let lastRailsRefreshAt = 0;
let railRefreshInterval = null;
let railVisibilityRefreshBound = false;

const escapeHTML = (
    value = ""
) =>
    String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

function getTitle(item) {
    return (
        item.title ||
        item.name ||
        "Untitled"
    );
}

function getType(
    item,
    section
) {
    if (
        item.media_type ===
            "tv" ||
        section ===
            "popularSeries"
    ) {
        return "Series";
    }

    if (
        section ===
        "upcoming"
    ) {
        return "Coming soon";
    }

    return "Movie";
}

function getYear(item) {
    const date = item.release_date || item.first_air_date;
    return date ? date.slice(0, 4) : "—";
}

function getRating(item) {
    return Number.isFinite(item.vote_average)
        ? item.vote_average.toFixed(1)
        : "—";
}

function getFallback(
    section,
    index
) {
    const themes =
        cardThemes[
            section
        ] ||
        cardThemes.trending;

    const theme =
        themes[
            index %
                themes.length
        ];

    return {
        theme,

        image:
            contentVisuals[
                theme
            ] ||
            contentVisuals.drama
    };
}

function createMovieCard(
    item,
    index,
    section
) {
    const title =
        getTitle(item);

    const type =
        getType(
            item,
            section
        );

    const year = getYear(item);

    const rating = getRating(item);

    const fallback =
        getFallback(
            section,
            index
        );

    const tier =
        getAccessTier(
            item
        );

    const image =
        item.poster_path
            ? getPosterUrl(
                  item.poster_path,
                  "w500"
              )
            : fallback.image;

    const colors =
        palette[
            index %
                palette.length
        ];

    return `
        <article
            class="movie-card"
            tabindex="0"
            data-tmdb-id="${
                item.id || ""
            }"
            data-media-type="${
                item.media_type ||
                (
                    type ===
                    "Series"
                        ? "tv"
                        : "movie"
                )
            }"
            data-access-tier="${tier}"
            aria-label="${escapeHTML(
                title
            )}, ${escapeHTML(
                type
            )}"
        >
            <div
                class="poster-placeholder"
                style="
                    --card-start:${colors[0]};
                    --card-end:${colors[1]};
                    --card-image:url('${image}');
                "
            >
                ${
                    item.poster_path
                        ? ""
                        : `
                            <strong>
                                ${escapeHTML(
                                    title
                                )}
                            </strong>
                        `
                }
            </div>

            <span
                class="tier tier-${tier.toLowerCase()}"
                data-access-tier="${tier}"
                title="${
                    tier ===
                    "FREE"
                        ? "MovieVerse FREE access"
                        : `MovieVerse ${tier} access — click for access options`
                }"
            >
                ${
                    tier ===
                    "FREE"
                        ? "FREE"
                        : `🔒 ${tier}`
                }
            </span>

            <div
                class="movie-overlay"
            >
                <h3
                    class="movie-title"
                >
                    ${escapeHTML(
                        title
                    )}
                </h3>

                <div
                    class="movie-meta"
                >
                    <span>
                        ${escapeHTML(
                            type
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            themeLabels[
                                fallback.theme
                            ] ||
                                "Entertainment"
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            year
                        )}
                    </span>

                    <span title="Rating supplied by TMDB">
                        ★ ${rating} TMDB
                    </span>
                    <a class="movie-imdb-link" data-imdb-search href="https://www.imdb.com/find/?q=${encodeURIComponent(title)}" target="_blank" rel="noopener noreferrer" aria-label="Find ${escapeHTML(title)} on IMDb">IMDb ↗</a>
                </div>
            </div>
        </article>
    `;
}

function renderFallbackRail(
    rail,
    section
) {
    const titles =
        placeholderContent[
            section
        ] || [];

    rail.innerHTML =
        titles
            .map(
                (
                    title,
                    index
                ) =>
                    createMovieCard(
                        {
                            id: "",
                            title,
                            poster_path:
                                null,
                            vote_average:
                                null,
                            release_date:
                                "",
                            media_type:
                                section ===
                                "popularSeries"
                                    ? "tv"
                                    : "movie"
                        },
                        index,
                        section
                    )
            )
            .join("");
}

export async function renderRails() {
    lastRailsRefreshAt = Date.now();

    const rails =
        document.querySelectorAll(
            "[data-rail]"
        );

    rails.forEach(
        (rail) => {
            const titles =
                placeholderContent[
                    rail.dataset
                        .rail
                ] || [];

            rail.innerHTML =
                titles
                    .map(
                        () =>
                            `
                                <div
                                    class="movie-card card-skeleton"
                                    aria-hidden="true"
                                ></div>
                            `
                    )
                    .join("");
        }
    );

    await Promise.all(
        [...rails].map(
            async (
                rail
            ) => {
                const section =
                    rail.dataset
                        .rail;

                const loader =
                    railLoaders[
                        section
                    ];

                if (!loader) {
                    renderFallbackRail(
                        rail,
                        section
                    );

                    return;
                }

                try {
                    const data =
                        await loader();

                    const results =
                        Array.isArray(
                            data?.results
                        )
                            ? data.results
                                  .filter(
                                      (
                                          item
                                      ) =>
                                          item.id
                                  )
                            : [];

                    if (
                        !results.length
                    ) {
                        renderFallbackRail(
                            rail,
                            section
                        );

                        return;
                    }

                    rail.innerHTML =
                        results
                            .slice(
                                0,
                                12
                            )
                            .map(
                                (
                                    item,
                                    index
                                ) =>
                                    createMovieCard(
                                        item,
                                        index,
                                        section
                                    )
                            )
                            .join("");
                } catch (
                    error
                ) {
                    console.warn(
                        `MovieVerse ${section} failed:`,
                        error
                    );

                    renderFallbackRail(
                        rail,
                        section
                    );
                }
            }
        )
    );
}

export function setupHomeInteractions() {
    const header =
        document.querySelector(
            ".site-header"
        );

    const menu =
        document.querySelector(
            ".menu-toggle"
        );

    const nav =
        document.querySelector(
            ".main-nav"
        );

    if (
        !header ||
        header.dataset.ready
    ) {
        return;
    }

    header.dataset.ready =
        "true";

    // Refresh live TMDB home rails on a 30-minute cadence while the app is visible.
    // If the tab was hidden for a while, refresh when the user returns to it.
    if (!railRefreshInterval) {
        railRefreshInterval = window.setInterval(() => {
            const appShell = document.getElementById("app-shell");
            if (
                appShell &&
                !appShell.hidden &&
                document.visibilityState === "visible"
            ) {
                renderRails();
            }
        }, 30 * 60 * 1000);
    }

    if (!railVisibilityRefreshBound) {
        document.addEventListener("visibilitychange", () => {
            const appShell = document.getElementById("app-shell");
            if (
                document.visibilityState === "visible" &&
                appShell &&
                !appShell.hidden &&
                Date.now() - lastRailsRefreshAt >= 30 * 60 * 1000
            ) {
                renderRails();
            }
        });
        railVisibilityRefreshBound = true;
    }

    window.addEventListener(
        "scroll",
        () =>
            header.classList.toggle(
                "scrolled",
                window.scrollY >
                    12
            ),
        {
            passive: true
        }
    );

    menu?.addEventListener(
        "click",
        () => {
            const isOpen =
                nav?.classList.toggle(
                    "open"
                ) || false;

            menu.setAttribute(
                "aria-expanded",
                String(
                    isOpen
                )
            );
        }
    );

    document
        .querySelectorAll(
            ".mood-list button"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        document
                            .querySelectorAll(
                                ".mood-list button"
                            )
                            .forEach(
                                (
                                    item
                                ) =>
                                    item.classList.remove(
                                        "selected"
                                    )
                            );

                        button.classList.add(
                            "selected"
                        );
                    }
                );
            }
        );

    if (
        "IntersectionObserver" in
        window
    ) {
        const observer =
            new IntersectionObserver(
                (
                    entries
                ) =>
                    entries.forEach(
                        (
                            entry
                        ) => {
                            if (
                                entry.isIntersecting
                            ) {
                                entry.target.classList.add(
                                    "is-visible"
                                );

                                observer.unobserve(
                                    entry.target
                                );
                            }
                        }
                    ),
                {
                    threshold:
                        0.1
                }
            );

        document
            .querySelectorAll(
                ".section-reveal"
            )
            .forEach(
                (
                    section
                ) =>
                    observer.observe(
                        section
                    )
            );
    } else {
        document
            .querySelectorAll(
                ".section-reveal"
            )
            .forEach(
                (
                    section
                ) =>
                    section.classList.add(
                        "is-visible"
                    )
            );
    }
}