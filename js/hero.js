import {
    getTrending,
    getBackdropUrl,
    getPosterUrl
} from "./tmdb.js";

import { openDetails } from "./details.js";

const escapeHTML = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

function getTitle(item) {
    return item?.title || item?.name || "MovieVerse";
}

function getYear(item) {
    const date = item?.release_date || item?.first_air_date || "";
    return date ? date.slice(0, 4) : "";
}

function getMediaType(item) {
    return item?.media_type === "tv" ? "Series" : "Movie";
}

function updateHero(item) {
    const hero = document.querySelector(".hero");

    if (!hero || !item) {
        return;
    }

    const title = getTitle(item);
    const year = getYear(item);
    const type = getMediaType(item);

    const backdrop = getBackdropUrl(
        item.backdrop_path,
        "original"
    );

    const poster = getPosterUrl(
        item.poster_path,
        "w500"
    );

    if (backdrop) {
        hero.style.setProperty(
            "--hero-backdrop",
            `url("${backdrop}")`
        );

        hero.classList.add("hero-tmdb");
    }

    const kicker = hero.querySelector(".eyebrow");

    if (kicker) {
        kicker.innerHTML = `
            <span class="eyebrow-dot"></span>
            Trending in MovieVerse
            <span class="eyebrow-line"></span>
        `;
    }

    const heading = hero.querySelector("h1");

    if (heading) {
        heading.innerHTML = `
            Discover<br>
            <em>${escapeHTML(title)}</em>
        `;
    }

    const copy = hero.querySelector(".hero-copy");

    if (copy) {
        copy.textContent =
            item.overview ||
            "A story worth discovering is waiting in your universe.";
    }

    const meta = hero.querySelector(".hero-meta");

    if (meta) {
        meta.innerHTML = `
            <span>${escapeHTML(type)}</span>
            ${year ? "<i></i>" : ""}
            ${year ? `<span>${escapeHTML(year)}</span>` : ""}
            <i></i>
            <span>
                ${
                    Number.isFinite(item.vote_average)
                        ? `★ ${item.vote_average.toFixed(1)}`
                        : "Trending now"
                }
            </span>
        `;
    }

    const frameMain = hero.querySelector(".frame-main");

    if (frameMain) {
        frameMain.innerHTML = `
            <span class="frame-kicker">MV / TRENDING</span>

            ${
                poster
                    ? `
                        <img
                            src="${poster}"
                            alt="${escapeHTML(title)}"
                            loading="eager"
                        >
                    `
                    : ""
            }

            <strong>
                ${escapeHTML(title)}
            </strong>

            <small>
                ${escapeHTML(type)}
                ${year ? ` • ${escapeHTML(year)}` : ""}
            </small>
        `;
    }

    const frameSide = hero.querySelector(".frame-side");

    if (frameSide) {
        frameSide.innerHTML = `
            <span>${escapeHTML(title)}</span>
            <small>Trending now</small>
        `;
    }

    const heroButton = hero.querySelector(
        ".hero-actions .button-primary"
    );

    if (heroButton) {
        heroButton.innerHTML = `
            Explore this title
            <span>↗</span>
        `;

        heroButton.onclick = (event) => {
            event.preventDefault();

            openDetails(
                item.id,
                item.media_type === "tv" ? "tv" : "movie"
            );
        };
    }
}

async function loadHero() {
    try {
        const response = await getTrending();

        const results = Array.isArray(response?.results)
            ? response.results.filter(
                  (item) =>
                      item.backdrop_path &&
                      item.id &&
                      (
                          item.media_type === "movie" ||
                          item.media_type === "tv"
                      )
              )
            : [];

        if (!results.length) {
            return;
        }

        updateHero(results[0]);
    } catch (error) {
        console.warn(
            "MovieVerse hero could not load TMDB content:",
            error
        );
    }
}

export function setupHero() {
    loadHero();
    // Refresh the trending feature periodically so it reflects current TMDB trends.
    window.setInterval(loadHero, 30 * 60 * 1000);
}