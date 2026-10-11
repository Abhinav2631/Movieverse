import {
    getMyList,
    getWishlist,
    getHistory,
    getRecentlyViewed,
    getContinueWatching
} from "./library.js";

import { getPosterUrl } from "./tmdb.js";

import { openDetails } from "./details.js";

const escapeHTML = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

function getItemTitle(item) {
    return item?.title || item?.name || "Untitled";
}

function getItemYear(item) {
    const date =
        item?.releaseDate ||
        item?.release_date ||
        item?.first_air_date ||
        "";

    return date ? String(date).slice(0, 4) : "";
}

function getItemType(item) {
    return item?.mediaType === "tv"
        ? "Series"
        : "Movie";
}

function createLibraryCard(item, mode = "standard") {
    const title = getItemTitle(item);

    const posterPath =
        item?.posterPath ||
        item?.poster_path ||
        null;

    const poster = getPosterUrl(
        posterPath,
        "w342"
    );

    const year = getItemYear(item);
    const type = getItemType(item);

    const progress = Math.max(
        0,
        Math.min(
            100,
            Number(item?.progress) || 0
        )
    );

    return `
        <article
            class="library-card"
            tabindex="0"
            data-library-id="${escapeHTML(
                item.id
            )}"
            data-library-type="${escapeHTML(
                item.mediaType || "movie"
            )}"
        >
            <div class="library-card-poster">
                ${
                    poster
                        ? `
                            <img
                                src="${poster}"
                                alt="${escapeHTML(title)}"
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="library-poster-fallback">
                                ${escapeHTML(title)}
                            </div>
                        `
                }

                ${
                    mode === "continue" &&
                    progress > 0
                        ? `
                            <div class="library-progress">
                                <i style="width:${progress}%"></i>
                            </div>
                        `
                        : ""
                }

                ${
                    mode === "continue"
                        ? `
                            <span class="library-continue-badge">
                                ${
                                    progress > 0
                                        ? `${progress}%`
                                        : "Continue"
                                }
                            </span>
                        `
                        : ""
                }
            </div>

            <div class="library-card-copy">
                <h3>
                    ${escapeHTML(title)}
                </h3>

                <p>
                    ${escapeHTML(type)}
                    ${
                        year
                            ? ` • ${escapeHTML(year)}`
                            : ""
                    }
                </p>
            </div>
        </article>
    `;
}

function createEmptyShelf(
    title,
    description,
    icon
) {
    return `
        <div class="library-empty">
            <span>${icon}</span>

            <div>
                <strong>
                    ${escapeHTML(title)}
                </strong>

                <p>
                    ${escapeHTML(description)}
                </p>
            </div>
        </div>
    `;
}

function createLibrarySection({
    id,
    kicker,
    title,
    items,
    mode = "standard",
    emptyTitle,
    emptyDescription,
    icon
}) {
    const section =
        document.createElement("section");

    section.className =
        "content-section section-reveal library-section";

    section.id = id;

    section.innerHTML = `
        <div class="section-heading">
            <div>
                <p class="kicker">
                    ${escapeHTML(kicker)}
                </p>

                <h2>
                    ${title}
                </h2>
            </div>
        </div>

        ${
            items.length
                ? `
                    <div class="library-rail">
                        ${items
                            .map((item) =>
                                createLibraryCard(
                                    item,
                                    mode
                                )
                            )
                            .join("")}
                    </div>
                `
                : createEmptyShelf(
                      emptyTitle,
                      emptyDescription,
                      icon
                  )
        }
    `;

    return section;
}

function insertAfter(
    newElement,
    referenceElement
) {
    if (!referenceElement?.parentNode) {
        return;
    }

    referenceElement.parentNode.insertBefore(
        newElement,
        referenceElement.nextSibling
    );
}

function renderLibrarySections() {
    const contentWrap =
        document.querySelector(
            ".content-wrap"
        );

    if (!contentWrap) {
        return;
    }

    document
        .querySelectorAll(
            ".library-section"
        )
        .forEach((section) => {
            section.remove();
        });

    const recommendations =
        contentWrap.querySelector(
            '[data-rail="recommendations"]'
        )?.closest(
            ".content-section"
        );

    const continueWatching =
        getContinueWatching().slice(
            0,
            10
        );

    const recentlyViewed =
        getRecentlyViewed().slice(
            0,
            10
        );

    const myList =
        getMyList().slice(
            0,
            10
        );

    const wishlist =
        getWishlist().slice(
            0,
            10
        );

    const history =
        getHistory().slice(
            0,
            10
        );

    const sections = [
        {
            id: "continue-watching",
            kicker:
                "Pick up where you left off",
            title:
                "Continue <em>watching.</em>",
            items: continueWatching,
            mode: "continue",
            emptyTitle:
                "Your watch queue is quiet.",
            emptyDescription:
                "Open a title and start building your Continue Watching shelf.",
            icon: "▶"
        },
        {
            id: "recently-viewed",
            kicker:
                "Your recent orbit",
            title:
                "Recently <em>viewed.</em>",
            items: recentlyViewed,
            mode: "standard",
            emptyTitle:
                "Nothing viewed yet.",
            emptyDescription:
                "Titles you open will appear here automatically.",
            icon: "◌"
        },
        {
            id: "my-list",
            kicker:
                "Saved for later",
            title:
                "My <em>List.</em>",
            items: myList,
            mode: "standard",
            emptyTitle:
                "Your list is waiting.",
            emptyDescription:
                "Use + My List on any title you want to keep close.",
            icon: "+"
        },
        {
            id: "wishlist",
            kicker:
                "Your maybe-later shelf",
            title:
                "Your <em>Wishlist.</em>",
            items: wishlist,
            mode: "standard",
            emptyTitle:
                "Your wishlist is empty.",
            emptyDescription:
                "Save titles you might want to explore another time.",
            icon: "♡"
        },
        {
            id: "watch-history",
            kicker:
                "Your viewing trail",
            title:
                "What you've <em>watched.</em>",
            items: history,
            mode: "standard",
            emptyTitle:
                "Your history starts here.",
            emptyDescription:
                "Mark a title as watched and MovieVerse will keep track.",
            icon: "✓"
        }
    ];

    let anchor =
        recommendations ||
        contentWrap.lastElementChild;

    sections.forEach(
        (config, index) => {
            const section =
                createLibrarySection(
                    config
                );

            if (
                index === 0 &&
                recommendations
            ) {
                insertAfter(
                    section,
                    recommendations
                );
            } else if (
                index > 0
            ) {
                const previous =
                    document.getElementById(
                        sections[
                            index - 1
                        ].id
                    );

                if (previous) {
                    insertAfter(
                        section,
                        previous
                    );
                } else {
                    insertAfter(
                        section,
                        anchor
                    );
                }
            } else {
                insertAfter(
                    section,
                    anchor
                );
            }

            anchor = section;
        }
    );

    bindLibraryCards();
    setupRevealAnimations();
}

function setupRevealAnimations() {
    const sections =
        document.querySelectorAll(
            ".library-section.section-reveal"
        );

    if (
        "IntersectionObserver" in
        window
    ) {
        const observer =
            new IntersectionObserver(
                (entries) => {
                    entries.forEach(
                        (entry) => {
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
                    );
                },
                {
                    threshold: 0.1
                }
            );

        sections.forEach(
            (section) =>
                observer.observe(section)
        );
    } else {
        sections.forEach(
            (section) =>
                section.classList.add(
                    "is-visible"
                )
        );
    }
}

function bindLibraryCards() {
    document
        .querySelectorAll(
            ".library-card[data-library-id]"
        )
        .forEach((card) => {
            const open = () => {
                openDetails(
                    card.dataset
                        .libraryId,

                    card.dataset
                        .libraryType ||
                        "movie"
                );
            };

            card.addEventListener(
                "click",
                open
            );

            card.addEventListener(
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

export function setupLibraryUI() {
    renderLibrarySections();

    window.addEventListener(
        "movieverse:library-updated",
        renderLibrarySections
    );

    window.addEventListener(
        "movieverse:profile-selected",
        renderLibrarySections
    );
}

export function refreshLibraryUI() {
    renderLibrarySections();
}