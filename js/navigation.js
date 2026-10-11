import {
    openFeatures
} from "./features.js";

function scrollToSection(
    id
) {
    const element =
        document.getElementById(
            id
        );

    if (!element) {
        return;
    }

    element.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function showToast(
    message
) {
    const existing =
        document.querySelector(
            ".mv-toast"
        );

    existing?.remove();

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        "mv-toast";

    toast.textContent =
        message;

    document.body.appendChild(
        toast
    );

    window.setTimeout(
        () => toast.remove(),
        2600
    );
}

function setupProfileChip(
    showProfiles
) {
    const chip =
        document.querySelector(
            ".profile-chip"
        );

    if (!chip) {
        return;
    }

    chip.removeAttribute(
        "data-logout"
    );

    chip.setAttribute(
        "title",
        "Switch profile"
    );

    chip.setAttribute(
        "aria-label",
        "Switch MovieVerse profile"
    );

    chip.addEventListener(
        "click",
        () => {
            showProfiles();
        }
    );
}

function setupMainNav() {
    document
        .querySelectorAll(
            ".main-nav a"
        )
        .forEach(
            (link) => {
                link.addEventListener(
                    "click",
                    (event) => {
                        const href =
                            link.getAttribute(
                                "href"
                            );

                        if (
                            href ===
                            "#home"
                        ) {
                            event.preventDefault();

                            scrollToSection(
                                "home"
                            );
                            return;
                        }

                        if (
                            href ===
                            "#popular-movies"
                        ) {
                            event.preventDefault();

                            scrollToSection(
                                "popular-movies"
                            );
                            return;
                        }

                        if (
                            href ===
                            "#popular-series"
                        ) {
                            event.preventDefault();

                            scrollToSection(
                                "popular-series"
                            );
                            return;
                        }

                        if (
                            href ===
                            "#explore"
                        ) {
                            event.preventDefault();

                            openFeatures(
                                "domains"
                            );
                            return;
                        }

                        if (
                            href ===
                            "#genres"
                        ) {
                            event.preventDefault();

                            openFeatures(
                                "genres"
                            );
                        }
                    }
                );
            }
        );
}

function setupSectionLinks() {
    document
        .querySelectorAll(
            ".section-link"
        )
        .forEach(
            (link) => {
                link.addEventListener(
                    "click",
                    (event) => {
                        event.preventDefault();

                        const text =
                            link.textContent
                                .trim()
                                .toLowerCase();

                        if (
                            text.includes(
                                "browse movies"
                            )
                        ) {
                            openFeatures(
                                "domains"
                            );

                            return;
                        }

                        if (
                            text.includes(
                                "browse series"
                            )
                        ) {
                            openFeatures(
                                "domains"
                            );

                            return;
                        }

                        if (
                            text.includes(
                                "genre"
                            ) ||
                            text.includes(
                                "rankings"
                            )
                        ) {
                            openFeatures(
                                "genres"
                            );

                            return;
                        }

                        if (
                            text.includes(
                                "full orbit"
                            ) ||
                            text.includes(
                                "explore all"
                            ) ||
                            text.includes(
                                "collections"
                            )
                        ) {
                            openFeatures(
                                "domains"
                            );

                            return;
                        }

                        if (
                            text.includes(
                                "set a reminder"
                            )
                        ) {
                            localStorage.setItem(
                                "movieverse.demo.reminders",
                                JSON.stringify({
                                    enabled: true,
                                    savedAt:
                                        new Date().toISOString()
                                })
                            );

                            showToast(
                                "MovieVerse reminder preference saved for this demo."
                            );

                            return;
                        }

                        if (
                            text.includes(
                                "what's new"
                            )
                        ) {
                            scrollToSection(
                                "trending"
                            );

                            return;
                        }

                        if (
                            text.includes(
                                "view your collection"
                            )
                        ) {
                            scrollToSection(
                                "my-list"
                            );

                            return;
                        }

                        if (
                            text.includes(
                                "refresh picks"
                            )
                        ) {
                            window.dispatchEvent(
                                new CustomEvent(
                                    "movieverse:refresh-recommendations"
                                )
                            );

                            showToast(
                                "Your discovery signal has been refreshed."
                            );
                        }
                    }
                );
            }
        );
}

function createCreditsModal() {
    if (
        document.getElementById(
            "tmdb-credits-modal"
        )
    ) {
        return document.getElementById(
            "tmdb-credits-modal"
        );
    }

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "tmdb-credits-modal";

    modal.className =
        "tmdb-credits-modal";

    modal.hidden = true;

    modal.innerHTML = `
        <div class="tmdb-credits-backdrop"></div>

        <section
            class="tmdb-credits-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tmdb-credits-title"
        >
            <button
                type="button"
                class="details-close"
                data-credits-close
                aria-label="Close credits"
            >
                ×
            </button>

            <p class="kicker">
                MovieVerse credits
            </p>

            <h2 id="tmdb-credits-title">
                Data behind<br>
                <em>the universe.</em>
            </h2>

            <div class="tmdb-credits-brand">
                TMDB
            </div>

            <p>
                This product uses the TMDB API but is
                not endorsed or certified by TMDB.
            </p>

            <p>
                MovieVerse uses TMDB movie, TV, people,
                image and discovery data for this
                non-commercial entertainment concept.
            </p>

            <p>
                Streaming availability information is
                supplied through TMDB's JustWatch
                partnership and is displayed only when
                provider information is available.
            </p>

            <div class="tmdb-credits-links">
                <a
                    href="https://www.themoviedb.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Visit TMDB ↗
                </a>

                <a
                    href="https://developer.themoviedb.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    TMDB Developer Docs ↗
                </a>

                <a
                    href="https://www.justwatch.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    JustWatch ↗
                </a>
            </div>
        </section>
    `;

    document.body.appendChild(
        modal
    );

    const close =
        () => {
            modal.hidden =
                true;
        };

    modal
        .querySelector(
            "[data-credits-close]"
        )
        ?.addEventListener(
            "click",
            close
        );

    modal
        .querySelector(
            ".tmdb-credits-backdrop"
        )
        ?.addEventListener(
            "click",
            close
        );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                !modal.hidden
            ) {
                close();
            }
        }
    );

    return modal;
}

function setupCredits() {
    const footerLinks =
        document.querySelector(
            ".footer-links"
        );

    if (
        !footerLinks ||
        footerLinks.querySelector(
            ".footer-credit-button"
        )
    ) {
        return;
    }

    const button =
        document.createElement(
            "button"
        );

    button.type = "button";

    button.className =
        "footer-credit-button";

    button.textContent =
        "TMDB credits";

    button.addEventListener(
        "click",
        () => {
            const modal =
                createCreditsModal();

            modal.hidden = false;
        }
    );

    footerLinks.appendChild(
        button
    );
}

export function setupNavigation({
    showProfiles
}) {
    setupProfileChip(
        showProfiles
    );

    setupMainNav();
    setupSectionLinks();
    setupCredits();
}