import {
    getTrending,
    getBackdropUrl,
    getPosterUrl
} from "./tmdb.js";

import { openDetails } from "./details.js";

const MAX_SLIDES = 20;
const AUTOPLAY_MS = 6500;

const escapeHTML = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

let slides = [];
let activeIndex = 0;
let rotationTimer = null;
let rotationPaused = false;
let heroElement = null;
let controlsElement = null;
let lastSlideKey = "";

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

function ensureCarouselControls() {
    if (!heroElement) return null;
    if (controlsElement?.isConnected) return controlsElement;

    controlsElement = document.createElement("div");
    controlsElement.className = "hero-carousel-controls";
    controlsElement.setAttribute("role", "group");
    controlsElement.setAttribute("aria-label", "Trending titles carousel");
    controlsElement.innerHTML = `
        <div class="hero-carousel-status" aria-live="polite" aria-atomic="true">
            <span class="hero-carousel-kicker">TRENDING NOW</span>
            <strong data-hero-count>01 <span>/ 20</span></strong>
            <span class="hero-carousel-title" data-hero-current-title>Loading today's trends…</span>
        </div>
        <div class="hero-carousel-buttons">
            <button type="button" class="hero-carousel-arrow" data-hero-prev aria-label="Show previous trending title" title="Previous title">←</button>
            <button type="button" class="hero-carousel-arrow" data-hero-next aria-label="Show next trending title" title="Next title">→</button>
        </div>
    `;
    heroElement.appendChild(controlsElement);

    controlsElement.querySelector("[data-hero-prev]")?.addEventListener("click", () => {
        showSlide(activeIndex - 1, true);
    });
    controlsElement.querySelector("[data-hero-next]")?.addEventListener("click", () => {
        showSlide(activeIndex + 1, true);
    });

    heroElement.addEventListener("mouseenter", pauseRotation);
    heroElement.addEventListener("mouseleave", resumeRotation);
    heroElement.addEventListener("focusin", pauseRotation);
    heroElement.addEventListener("focusout", (event) => {
        if (!heroElement.contains(event.relatedTarget)) resumeRotation();
    });

    return controlsElement;
}

function pauseRotation() {
    rotationPaused = true;
    window.clearInterval(rotationTimer);
    rotationTimer = null;
}

function resumeRotation() {
    rotationPaused = false;
    startRotation();
}

function startRotation() {
    window.clearInterval(rotationTimer);
    rotationTimer = null;
    if (slides.length < 2 || rotationPaused) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    rotationTimer = window.setInterval(() => {
        showSlide(activeIndex + 1, false);
    }, AUTOPLAY_MS);
}

function updateHero(item) {
    const hero = heroElement;
    if (!hero || !item) return;

    const title = getTitle(item);
    const year = getYear(item);
    const type = getMediaType(item);
    const backdrop = getBackdropUrl(item.backdrop_path, "original");
    const poster = getPosterUrl(item.poster_path, "w500");
    const slideKey = `${item.media_type || "movie"}:${item.id}`;

    hero.dataset.activeTrendingId = String(item.id || "");
    hero.dataset.activeTrendingType = item.media_type === "tv" ? "tv" : "movie";

    if (backdrop) {
        hero.style.setProperty("--hero-backdrop", `url("${backdrop}")`);
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
        heading.innerHTML = `Discover<br><em>${escapeHTML(title)}</em>`;
        heading.setAttribute("aria-label", `Discover ${title}`);
    }

    const copy = hero.querySelector(".hero-copy");
    if (copy) {
        copy.textContent = item.overview ||
            "A story worth discovering is waiting in your universe.";
    }

    const meta = hero.querySelector(".hero-meta");
    if (meta) {
        meta.innerHTML = `
            <span>${escapeHTML(type)}</span>
            ${year ? "<i></i>" : ""}
            ${year ? `<span>${escapeHTML(year)}</span>` : ""}
            <i></i>
            <span>${Number.isFinite(item.vote_average) ? `★ ${item.vote_average.toFixed(1)} TMDB` : "Trending now"}</span>
        `;
    }

    const frameMain = hero.querySelector(".frame-main");
    if (frameMain) {
        frameMain.innerHTML = `
            <span class="frame-kicker">MV / TRENDING</span>
            ${poster ? `<img src="${poster}" alt="${escapeHTML(title)} poster" loading="eager">` : ""}
            <strong>${escapeHTML(title)}</strong>
            <small>${escapeHTML(type)}${year ? ` • ${escapeHTML(year)}` : ""}</small>
        `;
        frameMain.setAttribute("role", "button");
        frameMain.setAttribute("tabindex", "0");
        frameMain.setAttribute("aria-label", `View details for ${title}`);
        frameMain.onclick = () => openDetails(item.id, item.media_type === "tv" ? "tv" : "movie");
        frameMain.onkeydown = (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openDetails(item.id, item.media_type === "tv" ? "tv" : "movie");
            }
        };
    }

    const frameSide = hero.querySelector(".frame-side");
    if (frameSide) {
        frameSide.innerHTML = `
            <span>${escapeHTML(title)}</span>
            <small>Trending now</small>
        `;
    }

    const caption = hero.querySelector(".art-caption");
    if (caption) {
        caption.innerHTML = `
            <span class="pulse"></span>
            <span>Live trending · ${String(activeIndex + 1).padStart(2, "0")} of ${String(slides.length).padStart(2, "0")}</span>
        `;
    }

    const heroButton = hero.querySelector(".hero-actions .button-primary");
    if (heroButton) {
        heroButton.innerHTML = 'Explore this title <span>↗</span>';
        heroButton.href = "#";
        heroButton.onclick = (event) => {
            event.preventDefault();
            openDetails(item.id, item.media_type === "tv" ? "tv" : "movie");
        };
    }

    const controls = ensureCarouselControls();
    if (controls) {
        const count = controls.querySelector("[data-hero-count]");
        const currentTitle = controls.querySelector("[data-hero-current-title]");
        if (count) count.innerHTML = `${String(activeIndex + 1).padStart(2, "0")} <span>/ ${String(slides.length).padStart(2, "0")}</span>`;
        if (currentTitle) currentTitle.textContent = title;
        controls.querySelectorAll(".hero-carousel-arrow").forEach((button) => {
            button.disabled = slides.length < 2;
        });
    }

    if (slideKey !== lastSlideKey) {
        hero.classList.remove("hero-slide-enter");
        // Re-trigger a small transition for the new trending title.
        void hero.offsetWidth;
        hero.classList.add("hero-slide-enter");
        lastSlideKey = slideKey;
    }
}

function showSlide(index, resetAutoplay = true) {
    if (!slides.length) return;
    activeIndex = ((index % slides.length) + slides.length) % slides.length;
    updateHero(slides[activeIndex]);
    if (resetAutoplay) startRotation();
}

async function loadHero() {
    try {
        // Two TMDB pages provide up to 40 candidates; use 20 unique movie/TV titles.
        const responses = await Promise.all([
            getTrending(1),
            getTrending(2)
        ]);

        const unique = new Map();
        responses.forEach((response) => {
            (Array.isArray(response?.results) ? response.results : []).forEach((item) => {
                if (!item?.id || !["movie", "tv"].includes(item.media_type)) return;
                const key = `${item.media_type}:${item.id}`;
                if (!unique.has(key)) unique.set(key, item);
            });
        });

        const results = [...unique.values()]
            .filter((item) => item.backdrop_path || item.poster_path)
            .slice(0, MAX_SLIDES);

        if (!results.length) {
            const status = ensureCarouselControls()?.querySelector(".hero-carousel-title");
            if (status) status.textContent = "Live trending is unavailable. Check your TMDB configuration.";
            return;
        }

        const currentKey = heroElement?.dataset.activeTrendingId
            ? `${heroElement.dataset.activeTrendingType}:${heroElement.dataset.activeTrendingId}`
            : null;
        slides = results;

        const existingIndex = currentKey
            ? slides.findIndex((item) => `${item.media_type}:${item.id}` === currentKey)
            : -1;

        activeIndex = existingIndex >= 0 ? existingIndex : 0;
        updateHero(slides[activeIndex]);
        startRotation();
    } catch (error) {
        console.warn("MovieVerse hero could not load TMDB trending titles:", error);
        const status = ensureCarouselControls()?.querySelector(".hero-carousel-title");
        if (status) status.textContent = "Unable to load live trending titles. Check your TMDB connection.";
    }
}

export function setupHero() {
    heroElement = document.querySelector(".hero");
    if (!heroElement || heroElement.dataset.carouselReady === "true") return;
    heroElement.dataset.carouselReady = "true";
    ensureCarouselControls();
    loadHero();

    // Refresh the candidates every 30 minutes without resetting the user's current title if still present.
    window.setInterval(loadHero, 30 * 60 * 1000);
}
