import { getProfiles, saveProfiles } from "./profiles.js";
import {
    getMovieDetails,
    getTvDetails,
    getPersonDetails
} from "./tmdb.js";
import { openFeatures } from "./features.js";

const escapeHTML = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const preferenceSteps = [
    {
        key: "domains",
        title: "What belongs in your universe?",
        description: "Choose the entertainment worlds this profile wants to explore.",
        minimum: 1,
        options: ["Movies", "TV Shows", "Web Series", "Anime", "Sports", "Music & Performance", "Dance", "Comedy", "Reality & Talent", "Documentaries", "Gaming / Esports", "Family & Kids", "Educational / Informative"]
    },
    {
        key: "languages",
        title: "Which languages feel like home?",
        description: "Choose the languages you enjoy watching, including dubbed content.",
        minimum: 1,
        options: ["English", "Hindi", "Telugu", "Tamil", "Malayalam", "Kannada", "Japanese", "Korean", "Spanish", "French", "German", "Chinese", "Other"]
    },
    {
        key: "genres",
        title: "What kind of stories do you love?",
        description: "Select the genres you tend to choose first.",
        minimum: 1,
        options: ["Action", "Adventure", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Rom-Com", "Science Fiction", "Thriller", "Psychological Thriller", "Heist", "Martial Arts", "Superhero", "Animation", "Documentary", "Sports", "Musical", "History", "War", "Survival", "Time Travel"]
    },
    {
        key: "ottPlatforms",
        title: "Where do you usually watch?",
        description: "Pick the streaming services you have or prefer. This step is optional.",
        minimum: 0,
        options: ["Netflix", "Prime Video", "JioHotstar", "Sony LIV", "ZEE5", "Aha", "Apple TV+", "Crunchyroll", "Sun NXT", "Lionsgate Play", "Hoichoi", "ManoramaMAX", "YouTube", "Other"]
    },
    {
        key: "moods",
        title: "What do you want to feel?",
        description: "Choose the moods that usually match your watch sessions. This step is optional.",
        minimum: 0,
        options: ["Happy", "Thoughtful", "Excited", "Romantic", "Relaxed", "Scared", "Inspired", "Emotional", "Mind-blown", "Motivated"]
    },
    {
        key: "viewingStyles",
        title: "How do you like to watch?",
        description: "Fine-tune the kinds of picks MovieVerse should surface. This step is optional.",
        minimum: 0,
        options: ["Short films", "Under 90 minutes", "Binge-worthy series", "Plot twists", "Critically acclaimed", "Hidden gems", "New releases", "Family viewing", "Subtitles welcome", "Dubbed preferred"]
    }
];

let preferenceModal = null;
let preferenceState = null;
let preferenceStep = 0;
let hoveredCard = null;
let hoverTimer = null;
let personHoverTimer = null;
let hoverPopover = null;
const detailCache = new Map();
const personCache = new Map();

function buildPreferenceModal() {
    if (preferenceModal) return preferenceModal;
    preferenceModal = document.createElement("div");
    preferenceModal.className = "mv-profile-pref-modal";
    preferenceModal.hidden = true;
    preferenceModal.innerHTML = `
        <section class="mv-profile-pref-dialog" role="dialog" aria-modal="true" aria-labelledby="mv-pref-title">
            <div class="mv-profile-pref-top">
                <p class="kicker">Personalize this profile</p>
                <button type="button" class="mv-feature-close" data-pref-close aria-label="Close preferences">×</button>
            </div>
            <div class="mv-profile-pref-progress" aria-hidden="true"><i data-pref-progress></i></div>
            <p class="mv-profile-pref-step" data-pref-step-label></p>
            <h2 id="mv-pref-title"></h2>
            <p class="mv-profile-pref-copy" data-pref-description></p>
            <div class="mv-profile-pref-options" data-pref-options></div>
            <div class="mv-profile-pref-actions">
                <button class="button button-quiet" type="button" data-pref-back>← Back</button>
                <span class="mv-profile-pref-note" data-pref-note></span>
                <button class="button button-primary" type="button" data-pref-next>Next →</button>
            </div>
        </section>`;
    document.body.appendChild(preferenceModal);
    preferenceModal.querySelector("[data-pref-close]").addEventListener("click", closePreferenceWizard);
    preferenceModal.addEventListener("click", (event) => {
        if (event.target === preferenceModal) closePreferenceWizard();
    });
    preferenceModal.querySelector("[data-pref-back]").addEventListener("click", () => {
        if (preferenceStep > 0) {
            preferenceStep -= 1;
            renderPreferenceStep();
        } else {
            closePreferenceWizard();
        }
    });
    preferenceModal.querySelector("[data-pref-next]").addEventListener("click", () => {
        const step = preferenceSteps[preferenceStep];
        const selected = preferenceState[step.key] || [];
        if (selected.length < step.minimum) {
            preferenceModal.querySelector("[data-pref-note]").textContent =
                `Choose at least ${step.minimum} option${step.minimum === 1 ? "" : "s"} to continue.`;
            return;
        }
        if (preferenceStep < preferenceSteps.length - 1) {
            preferenceStep += 1;
            renderPreferenceStep();
        } else {
            savePreferenceWizard();
        }
    });
    return preferenceModal;
}

function renderPreferenceStep() {
    const step = preferenceSteps[preferenceStep];
    const count = preferenceSteps.length;
    preferenceModal.querySelector("[data-pref-step-label]").textContent =
        `QUESTION ${String(preferenceStep + 1).padStart(2, "0")} OF ${String(count).padStart(2, "0")}`;
    preferenceModal.querySelector("[data-pref-progress]").style.width =
        `${((preferenceStep + 1) / count) * 100}%`;
    preferenceModal.querySelector("#mv-pref-title").textContent = step.title;
    preferenceModal.querySelector("[data-pref-description]").textContent = step.description;
    preferenceModal.querySelector("[data-pref-note]").textContent =
        step.minimum ? `Choose at least ${step.minimum}` : "Optional — you can continue";
    preferenceModal.querySelector("[data-pref-back]").textContent =
        preferenceStep === 0 ? "Cancel" : "← Back";
    preferenceModal.querySelector("[data-pref-next]").textContent =
        preferenceStep === count - 1 ? "Save profile preferences ✓" : "Next →";

    const options = preferenceModal.querySelector("[data-pref-options]");
    options.innerHTML = step.options.map((option) => {
        const selected = (preferenceState[step.key] || []).includes(option);
        return `<button type="button" class="mv-profile-pref-option" data-pref-option="${escapeHTML(option)}" aria-pressed="${selected}">${escapeHTML(option)}</button>`;
    }).join("");

    options.querySelectorAll("[data-pref-option]").forEach((button) => {
        button.addEventListener("click", () => {
            const option = button.dataset.prefOption;
            const values = preferenceState[step.key] || [];
            preferenceState[step.key] = values.includes(option)
                ? values.filter((value) => value !== option)
                : [...values, option];
            button.setAttribute("aria-pressed", String(preferenceState[step.key].includes(option)));
            preferenceModal.querySelector("[data-pref-note]").textContent =
                `${preferenceState[step.key].length} selected`;
        });
    });
}

function openPreferenceWizard(profile) {
    buildPreferenceModal();
    preferenceState = {
        profileId: profile.id,
        domains: [],
        languages: [],
        genres: [],
        ottPlatforms: [],
        moods: [],
        viewingStyles: []
    };
    preferenceStep = 0;
    renderPreferenceStep();
    preferenceModal.hidden = false;
    document.body.style.overflow = "hidden";
}

function closePreferenceWizard() {
    if (!preferenceModal) return;
    preferenceModal.hidden = true;
    document.body.style.overflow = "";
    preferenceState = null;
}

function savePreferenceWizard() {
    if (!preferenceState) return;
    const { profileId, ...preferences } = preferenceState;
    const profiles = getProfiles();
    const updated = profiles.map((profile) => profile.id === profileId
        ? { ...profile, preferences: { ...(profile.preferences || {}), ...preferences, onboardingCompleted: true, preferencesUpdatedAt: new Date().toISOString() } }
        : profile);
    saveProfiles(updated);
    closePreferenceWizard();
    showToast("Profile preferences saved. MovieVerse will use them to personalize discovery.");
}

function showToast(message) {
    document.querySelector(".mv-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "mv-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2800);
}

function ensureLogoutButton() {
    const actions = document.querySelector(".header-actions");
    const profileChip = actions?.querySelector(".profile-chip");
    if (!actions || !profileChip || actions.querySelector("[data-mv-logout]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mv-logout-button";
    button.dataset.mvLogout = "";
    button.textContent = "Log out";
    button.addEventListener("click", () => {
        if (typeof window.movieverseLogout === "function") {
            window.movieverseLogout();
        } else {
            localStorage.removeItem("movieverse.demo.session");
            window.location.reload();
        }
    });
    profileChip.insertAdjacentElement("afterend", button);
}

function ensureFeatureSearch() {
    const content = document.querySelector(".mv-feature-content");
    if (!content || content.querySelector(":scope > .mv-feature-search")) return;
    const wrapper = document.createElement("label");
    wrapper.className = "mv-feature-search";
    wrapper.innerHTML = '<span aria-hidden="true">⌕</span><input type="search" data-feature-search placeholder="Search within this section..." aria-label="Search within this discovery section"><span class="mv-feature-search-count" aria-live="polite"></span>';
    content.prepend(wrapper);
    const input = wrapper.querySelector("input");
    const count = wrapper.querySelector(".mv-feature-search-count");
    input.addEventListener("input", () => {
        const query = input.value.trim().toLocaleLowerCase();
        const candidates = [...content.querySelectorAll(
            "[data-domain], [data-genre-id], [data-language], [data-provider-id], .mv-chip, .mv-result-card, .mv-person-card"
        )].filter((item) => !item.closest(".mv-feature-search"));
        let visible = 0;
        candidates.forEach((item) => {
            const match = !query || item.textContent.toLocaleLowerCase().includes(query);
            item.hidden = !match;
            if (match) visible += 1;
        });
        count.textContent = query ? `${visible} match${visible === 1 ? "" : "es"}` : "";
    });
}

function setupFeatureSearch() {
    const content = document.querySelector(".mv-feature-content");
    if (!content) return;
    ensureFeatureSearch();
    const observer = new MutationObserver(() => ensureFeatureSearch());
    observer.observe(content, { childList: true });
}

function ensureHoverPopover() {
    if (hoverPopover) return hoverPopover;
    hoverPopover = document.createElement("aside");
    hoverPopover.className = "mv-hover-popover";
    hoverPopover.hidden = true;
    hoverPopover.setAttribute("aria-live", "polite");
    hoverPopover.addEventListener("mouseenter", () => {
        window.clearTimeout(hoverTimer);
        window.clearTimeout(personHoverTimer);
    });
    hoverPopover.addEventListener("mouseleave", () => {
        hoverPopover.hidden = true;
        hoveredCard = null;
    });
    document.body.appendChild(hoverPopover);
    return hoverPopover;
}

function positionPopover(anchor) {
    const popover = ensureHoverPopover();
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 24);
    const topCandidate = rect.bottom + 10;
    const top = topCandidate + 230 > window.innerHeight
        ? Math.max(12, rect.top - 245)
        : Math.min(window.innerHeight - 245, topCandidate);
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left));
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
}

async function showTitleHover(card) {
    const id = card.dataset.tmdbId || card.dataset.resultId || card.dataset.similarId;
    if (!id) return;
    const type = card.dataset.mediaType || card.dataset.resultType || card.dataset.similarType || "movie";
    const key = `${type}:${id}`;
    const popover = ensureHoverPopover();
    hoveredCard = card;
    positionPopover(card);
    popover.innerHTML = '<p class="mv-hover-kicker">Loading title details…</p>';
    popover.hidden = false;
    try {
        if (!detailCache.has(key)) {
            const item = type === "tv" ? await getTvDetails(id) : await getMovieDetails(id);
            detailCache.set(key, item);
        }
        if (hoveredCard !== card) return;
        const item = detailCache.get(key);
        const title = item.title || item.name || card.getAttribute("aria-label") || "Untitled";
        const year = (item.release_date || item.first_air_date || "").slice(0, 4);
        const rating = Number.isFinite(item.vote_average) && item.vote_average > 0 ? item.vote_average.toFixed(1) : "—";
        const genres = (item.genres || []).map((genre) => genre.name).slice(0, 4).join(" · ");
        const overview = item.overview || "A synopsis is not available for this title yet.";
        const movieMinutes = Number(item.runtime) || 0;
        const episodeMinutes = Array.isArray(item.episode_run_time)
            ? Number(item.episode_run_time.find((minutes) => Number(minutes) > 0)) || 0
            : 0;
        const formatMinutes = (minutes) => {
            if (!minutes) return "";
            const hours = Math.floor(minutes / 60);
            const remainder = minutes % 60;
            return hours
                ? (remainder ? `${hours}h ${remainder}m` : `${hours}h`)
                : `${remainder} min`;
        };
        const runtime = type === "tv"
            ? (episodeMinutes ? `${formatMinutes(episodeMinutes)} per episode` : "Episode runtime TBA")
            : (movieMinutes ? `${formatMinutes(movieMinutes)} (${movieMinutes} min)` : "Runtime TBA");
        const seasons = type === "tv"
            ? (Number.isFinite(item.number_of_seasons) ? `${item.number_of_seasons} season${item.number_of_seasons === 1 ? "" : "s"}` : "Seasons TBA")
            : "";
        const episodes = type === "tv"
            ? (Number.isFinite(item.number_of_episodes) ? `${item.number_of_episodes.toLocaleString()} episode${item.number_of_episodes === 1 ? "" : "s"}` : "Episodes TBA")
            : "";
        const extraFacts = [runtime, seasons, episodes].filter(Boolean).join(" · ");
        popover.innerHTML = `
            <p class="mv-hover-kicker">${type === "tv" ? "Series preview" : "Movie preview"}</p>
            <h3>${escapeHTML(title)}</h3>
            <div class="mv-hover-meta">${escapeHTML(year || "Release date TBA")} · ★ ${rating} TMDB</div>
            <div class="mv-hover-tags">${escapeHTML(extraFacts)}</div>
            <p>${escapeHTML(overview.slice(0, 420))}${overview.length > 420 ? "…" : ""}</p>
            ${genres ? `<div class="mv-hover-tags">${escapeHTML(genres)}</div>` : ""}
        `;
        positionPopover(card);
    } catch {
        if (hoveredCard === card) popover.innerHTML = '<p class="mv-hover-kicker">Title details</p><p>Open this title to view the full details.</p>';
    }
}

async function showPersonHover(card) {
    const id = card.dataset.personId;
    if (!id) return;
    hoveredCard = card;
    const popover = ensureHoverPopover();
    positionPopover(card);
    popover.innerHTML = '<p class="mv-hover-kicker">Loading cast information…</p>';
    popover.hidden = false;
    try {
        if (!personCache.has(id)) personCache.set(id, await getPersonDetails(id));
        if (hoveredCard !== card) return;
        const person = personCache.get(id);
        const name = person.name || card.dataset.personName || "Cast member";
        const department = person.known_for_department || "Entertainment";
        const born = person.birthday ? `Born ${person.birthday}` : "";
        const place = person.place_of_birth || "";
        const bio = person.biography || "A longer biography is not available in TMDB for this person.";
        const character = card.dataset.personCharacter;
        popover.innerHTML = `
            <p class="mv-hover-kicker">Cast & crew</p>
            <h3>${escapeHTML(name)}</h3>
            <div class="mv-hover-meta">${escapeHTML(department)}${character ? ` · ${escapeHTML(character)}` : ""}</div>
            <p>${escapeHTML(bio.slice(0, 380))}${bio.length > 380 ? "…" : ""}</p>
            ${born || place ? `<div class="mv-hover-tags">${escapeHTML([born, place].filter(Boolean).join(" · "))}</div>` : ""}
            <div class="mv-hover-tags">Click the card to search Google for more details.</div>
        `;
        positionPopover(card);
    } catch {
        if (hoveredCard === card) popover.innerHTML = '<p class="mv-hover-kicker">Cast & crew</p><p>Click to search Google for more information.</p>';
    }
}

function setupHoverDetails() {
    document.addEventListener("mouseover", (event) => {
        const person = event.target.closest?.(".details-cast-card[data-person-id], .details-person[data-person-id]");
        if (person && !person.contains(event.relatedTarget)) {
            window.clearTimeout(hoverTimer);
            window.clearTimeout(personHoverTimer);
            personHoverTimer = window.setTimeout(() => showPersonHover(person), 260);
            return;
        }
        const card = event.target.closest?.(".movie-card[data-tmdb-id], .mv-result-card[data-result-id], .details-similar-card[data-similar-id]");
        if (!card || card.contains(event.relatedTarget)) return;
        window.clearTimeout(hoverTimer);
        window.clearTimeout(personHoverTimer);
        hoverTimer = window.setTimeout(() => showTitleHover(card), 320);
    });
    document.addEventListener("mouseout", (event) => {
        const target = event.target.closest?.(".details-cast-card[data-person-id], .details-person[data-person-id], .movie-card[data-tmdb-id], .mv-result-card[data-result-id], .details-similar-card[data-similar-id]");
        if (!target || target.contains(event.relatedTarget)) return;
        if (event.relatedTarget === hoverPopover) return;
        if (hoveredCard === target) hoveredCard = null;
        window.clearTimeout(hoverTimer);
        window.clearTimeout(personHoverTimer);
        if (hoverPopover) hoverPopover.hidden = true;
    });
    document.addEventListener("click", (event) => {
        const person = event.target.closest?.(".details-cast-card[data-person-name], .details-person[data-person-name]");
        if (person) {
            event.preventDefault();
            const query = [person.dataset.personName, person.dataset.personCharacter].filter(Boolean).join(" ");
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
        }
    });
    window.addEventListener("scroll", () => {
        if (hoverPopover && !hoverPopover.hidden && hoveredCard?.isConnected) positionPopover(hoveredCard);
        else if (hoverPopover) hoverPopover.hidden = true;
    }, { passive: true });
    window.addEventListener("resize", () => {
        if (hoverPopover && !hoverPopover.hidden && hoveredCard?.isConnected) positionPopover(hoveredCard);
    });
}

function setupMoodLinks() {
    document.querySelectorAll(".mood-list button").forEach((button) => {
        if (button.dataset.mvMoodReady) return;
        button.dataset.mvMoodReady = "true";
        button.addEventListener("click", () => {
            const mood = button.textContent.replace(/[✦◌↗♡☾✺]/g, "").trim();
            const moodMap = { Happy: "Happy", Thoughtful: "Thoughtful", Excited: "Excited", Romantic: "Romantic", Relaxed: "Relaxed", Scared: "Scary" };
            openFeatures("moods");
            window.setTimeout(() => {
                const target = [...document.querySelectorAll("[data-mood]")].find((item) => item.dataset.mood === (moodMap[mood] || mood));
                target?.click();
            }, 100);
        });
    });
}

function setupEnhancements() {
    ensureLogoutButton();
    setupFeatureSearch();
    setupHoverDetails();
    setupMoodLinks();
    document.addEventListener("movieverse:new-profile-created", (event) => {
        if (event.detail?.id) openPreferenceWizard(event.detail);
    });
    window.addEventListener("movieverse:profile-selected", () => {
        ensureLogoutButton();
    });
}

document.addEventListener("DOMContentLoaded", setupEnhancements);
