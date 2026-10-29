import {
    searchMulti,
    getPosterUrl
} from "./tmdb.js";

import { openDetails } from "./details.js";

import { openPerson } from "./features.js";

let searchModal = null;
let searchInput = null;
let searchResults = null;
let searchStatus = null;
let searchTimer = null;

const escapeHTML = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

function getTitle(item) {
    return (
        item?.title ||
        item?.name ||
        "Untitled"
    );
}

function getYear(item) {
    const date =
        item?.release_date ||
        item?.first_air_date ||
        "";

    return date
        ? date.slice(0, 4)
        : "—";
}

function getResultType(item) {
    if (
        item.media_type === "movie"
    ) {
        return "Movie";
    }

    if (
        item.media_type === "tv"
    ) {
        return "Series";
    }

    if (
        item.media_type === "person"
    ) {
        return "Person";
    }

    return "Entertainment";
}

function getResultImage(item) {
    if (
        item.media_type === "person"
    ) {
        return item.profile_path
            ? getPosterUrl(
                  item.profile_path,
                  "w185"
              )
            : "";
    }

    return item.poster_path
        ? getPosterUrl(
              item.poster_path,
              "w342"
          )
        : "";
}

function createSearchModal() {
    if (
        document.getElementById(
            "movieverse-search-modal"
        )
    ) {
        return document.getElementById(
            "movieverse-search-modal"
        );
    }

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "movieverse-search-modal";

    modal.className =
        "search-modal";

    modal.hidden = true;

    modal.innerHTML = `
        <div class="search-backdrop"></div>

        <section
            class="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-title"
        >
            <div class="search-top">
                <div>
                    <p class="kicker">
                        MovieVerse explorer
                    </p>

                    <h2 id="search-title">
                        Find your <em>next story.</em>
                    </h2>
                </div>

                <button
                    type="button"
                    class="search-close"
                    aria-label="Close search"
                >
                    ×
                </button>
            </div>

            <div class="search-box">
                <span class="search-box-glyph"></span>

                <input
                    type="search"
                    id="movieverse-search-input"
                    placeholder="Search movies, series, anime, actors..."
                    autocomplete="off"
                    spellcheck="false"
                />

                <button
                    type="button"
                    class="search-clear"
                    aria-label="Clear search"
                    hidden
                >
                    Clear
                </button>
            </div>

            <div
                class="search-filters"
                role="tablist"
            >
                <button
                    type="button"
                    class="search-filter active"
                    data-search-filter="all"
                >
                    All
                </button>

                <button
                    type="button"
                    class="search-filter"
                    data-search-filter="movie"
                >
                    Movies
                </button>

                <button
                    type="button"
                    class="search-filter"
                    data-search-filter="tv"
                >
                    Series
                </button>

                <button
                    type="button"
                    class="search-filter"
                    data-search-filter="person"
                >
                    People
                </button>
            </div>

            <p
                class="search-status"
                aria-live="polite"
            >
                Start typing to explore the MovieVerse.
            </p>

            <div class="search-results"></div>
        </section>
    `;

    document.body.appendChild(
        modal
    );

    searchModal = modal;

    searchInput =
        modal.querySelector(
            "#movieverse-search-input"
        );

    searchResults =
        modal.querySelector(
            ".search-results"
        );

    searchStatus =
        modal.querySelector(
            ".search-status"
        );

    modal
        .querySelector(
            ".search-close"
        )
        ?.addEventListener(
            "click",
            closeSearch
        );

    modal
        .querySelector(
            ".search-backdrop"
        )
        ?.addEventListener(
            "click",
            closeSearch
        );

    const clearButton =
        modal.querySelector(
            ".search-clear"
        );

    searchInput?.addEventListener(
        "input",
        () => {
            clearButton.hidden =
                !searchInput.value.trim();

            window.clearTimeout(
                searchTimer
            );

            const query =
                searchInput.value.trim();

            if (!query) {
                renderEmptySearch();
                return;
            }

            searchStatus.textContent =
                "Searching the MovieVerse...";

            searchResults.innerHTML = `
                <div class="search-loading">
                    <div class="details-loader"></div>
                </div>
            `;

            searchTimer =
                window.setTimeout(
                    () =>
                        performSearch(
                            query
                        ),
                    350
                );
        }
    );

    clearButton?.addEventListener(
        "click",
        () => {
            searchInput.value = "";
            clearButton.hidden = true;
            renderEmptySearch();
            searchInput.focus();
        }
    );

    modal
        .querySelectorAll(
            "[data-search-filter]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    modal
                        .querySelectorAll(
                            "[data-search-filter]"
                        )
                        .forEach(
                            (item) =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );

                    const query =
                        searchInput.value.trim();

                    if (query) {
                        performSearch(
                            query
                        );
                    }
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
                closeSearch();
            }
        }
    );

    return modal;
}

function getActiveFilter() {
    return (
        searchModal?.querySelector(
            "[data-search-filter].active"
        )?.dataset
            .searchFilter ||
        "all"
    );
}

function renderEmptySearch() {
    if (
        !searchStatus ||
        !searchResults
    ) {
        return;
    }

    searchStatus.textContent =
        "Start typing to explore the MovieVerse.";

    searchResults.innerHTML = `
        <div class="search-empty">
            <span>✦</span>

            <h3>
                Search across your universe.
            </h3>

            <p>
                Movies, series, anime, performers
                and creators appear here.
            </p>
        </div>
    `;
}

function renderSearchResults(
    results
) {
    if (
        !searchResults ||
        !searchStatus
    ) {
        return;
    }

    if (!results.length) {
        searchStatus.textContent =
            "No matching results were found.";

        searchResults.innerHTML = `
            <div class="search-empty">
                <span>◌</span>

                <h3>
                    Nothing in orbit yet.
                </h3>

                <p>
                    Try another title, actor,
                    creator or keyword.
                </p>
            </div>
        `;

        return;
    }

    searchStatus.textContent =
        `${results.length} result${
            results.length === 1
                ? ""
                : "s"
        } found`;

    searchResults.innerHTML =
        results
            .map((item) => {
                const title =
                    getTitle(item);

                const type =
                    getResultType(item);

                const year =
                    getYear(item);

                const image =
                    getResultImage(item);

                const isPerson =
                    item.media_type ===
                    "person";

                return `
                    <article
                        class="search-result"
                        data-search-id="${item.id}"
                        data-search-type="${
                            item.media_type ||
                            ""
                        }"
                        data-search-person="${
                            isPerson
                                ? "true"
                                : "false"
                        }"
                        tabindex="0"
                    >
                        <div class="search-result-image">
                            ${
                                image
                                    ? `
                                        <img
                                            src="${image}"
                                            alt="${escapeHTML(
                                                title
                                            )}"
                                            loading="lazy"
                                        >
                                    `
                                    : `
                                        <span class="search-result-fallback">
                                            MV
                                        </span>
                                    `
                            }
                        </div>

                        <div class="search-result-copy">
                            <span class="search-result-type">
                                ${escapeHTML(
                                    type
                                )}
                            </span>

                            <h3>
                                ${escapeHTML(
                                    title
                                )}
                            </h3>

                            <p>
                                ${
                                    isPerson
                                        ? escapeHTML(
                                              item.known_for_department ||
                                                  "Entertainment"
                                          )
                                        : `${escapeHTML(
                                              year
                                          )}${
                                              Number.isFinite(item.vote_average) && item.vote_average > 0
                                                  ? ` • ★ ${item.vote_average.toFixed(
                                                        1
                                                    )}`
                                                  : ""
                                          }`
                                }
                            </p>
                        </div>

                        <span class="search-result-arrow">
                            ↗
                        </span>
                    </article>
                `;
            })
            .join("");

    searchResults
        .querySelectorAll(
            ".search-result"
        )
        .forEach((result) => {
            const open = () => {
                const id =
                    result.dataset
                        .searchId;

                const type =
                    result.dataset
                        .searchType;

                closeSearch();

                if (
                    result.dataset
                        .searchPerson ===
                    "true"
                ) {
                    openPerson(id);
                    return;
                }

                openDetails(
                    id,
                    type || "movie"
                );
            };

            result.addEventListener(
                "click",
                open
            );

            result.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key ===
                            "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        open();
                    }
                }
            );
        });
}

async function performSearch(
    query
) {
    try {
        const response =
            await searchMulti(query);

        let results =
            Array.isArray(
                response?.results
            )
                ? response.results
                : [];

        const filter =
            getActiveFilter();

        if (
            filter !== "all"
        ) {
            results =
                results.filter(
                    (item) =>
                        item.media_type ===
                        filter
                );
        }

        results =
            results
                .filter(
                    (item) =>
                        (
                            item.media_type ===
                                "movie" ||
                            item.media_type ===
                                "tv" ||
                            item.media_type ===
                                "person"
                        ) &&
                        item.id
                )
                .slice(0, 24);

        renderSearchResults(
            results
        );
    } catch (error) {
        console.error(
            "MovieVerse search failed:",
            error
        );

        searchStatus.textContent =
            "Search is temporarily unavailable.";

        searchResults.innerHTML = `
            <div class="search-empty search-error">
                <span>!</span>

                <h3>
                    The signal was interrupted.
                </h3>

                <p>
                    MovieVerse couldn't reach
                    the search service.
                </p>
            </div>
        `;
    }
}

export function openSearch() {
    const modal =
        createSearchModal();

    modal.hidden = false;

    document.body.classList.add(
        "search-open"
    );

    window.setTimeout(
        () => searchInput?.focus(),
        50
    );
}

export function closeSearch() {
    if (!searchModal) {
        return;
    }

    searchModal.hidden = true;

    document.body.classList.remove(
        "search-open"
    );
}

export function setupSearch() {
    const searchButton =
        document.querySelector(
            '.icon-button[aria-label="Search"]'
        );

    if (
        !searchButton ||
        searchButton.dataset.searchReady
    ) {
        return;
    }

    searchButton.dataset.searchReady =
        "true";

    searchButton.removeAttribute(
        "title"
    );

    searchButton.addEventListener(
        "click",
        openSearch
    );
}