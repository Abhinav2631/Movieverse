const TIER_ORDER = {
    FREE: 1,
    SUPER: 2,
    MAX: 3
};

const escapeHTML = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

export function getAccessTierFromRating(
    rating
) {
    const value = Number(rating) || 0;

    if (value >= 8.5) {
        return "MAX";
    }

    if (value >= 7.5) {
        return "SUPER";
    }

    return "FREE";
}

export function getAccessTier(item) {
    return getAccessTierFromRating(
        item?.vote_average
    );
}

function getTierElement() {
    return (
        document.querySelector(
            ".details-access .tier"
        ) || null
    );
}

function getCurrentDetailsTier() {
    const tierElement =
        getTierElement();

    return (
        tierElement?.textContent
            ?.trim()
            .toUpperCase() ||
        "FREE"
    );
}

function getTitleFromContext(
    element
) {
    const card =
        element.closest(
            ".movie-card"
        );

    if (card) {
        return (
            card.querySelector(
                ".movie-title"
            )?.textContent
                ?.trim() ||
            "this title"
        );
    }

    return (
        document
            .getElementById(
                "details-title"
            )
            ?.textContent
            ?.trim() ||
        "this title"
    );
}

let upgradeModal = null;

function createUpgradeModal() {
    if (upgradeModal) {
        return upgradeModal;
    }

    upgradeModal =
        document.createElement(
            "div"
        );

    upgradeModal.id =
        "movieverse-upgrade-modal";

    upgradeModal.className =
        "upgrade-modal";

    upgradeModal.hidden = true;

    upgradeModal.innerHTML = `
        <div class="upgrade-backdrop"></div>

        <section
            class="upgrade-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
        >
            <button
                type="button"
                class="upgrade-close"
                aria-label="Close upgrade dialog"
            >
                ×
            </button>

            <div class="upgrade-orbit">
                <span>✦</span>
            </div>

            <p class="kicker">
                MovieVerse access
            </p>

            <h2 id="upgrade-title">
                Go deeper into<br>
                <em>your universe.</em>
            </h2>

            <p class="upgrade-copy"></p>

            <div class="upgrade-tier-grid">
                <div class="upgrade-tier-card">
                    <span class="tier tier-free">
                        FREE
                    </span>

                    <strong>
                        Start exploring
                    </strong>

                    <small>
                        Selected discovery access
                    </small>
                </div>

                <div class="upgrade-tier-card featured">
                    <span class="tier tier-super">
                        SUPER
                    </span>

                    <strong>
                        More to discover
                    </strong>

                    <small>
                        Expanded MovieVerse access
                    </small>
                </div>

                <div class="upgrade-tier-card">
                    <span class="tier tier-max">
                        MAX
                    </span>

                    <strong>
                        Full orbit
                    </strong>

                    <small>
                        Premium MovieVerse access
                    </small>
                </div>
            </div>

            <div class="upgrade-actions">
                <button
                    type="button"
                    class="button button-primary"
                    data-upgrade-demo
                >
                    Explore upgrade options
                    <span>↗</span>
                </button>

                <button
                    type="button"
                    class="button button-quiet"
                    data-upgrade-close
                >
                    Continue browsing
                </button>
            </div>

            <p class="upgrade-note">
                Demo only — no payment or subscription
                is processed by MovieVerse.
            </p>
        </section>
    `;

    document.body.appendChild(
        upgradeModal
    );

    const close = () =>
        closeUpgradeModal();

    upgradeModal
        .querySelector(
            ".upgrade-close"
        )
        ?.addEventListener(
            "click",
            close
        );

    upgradeModal
        .querySelector(
            ".upgrade-backdrop"
        )
        ?.addEventListener(
            "click",
            close
        );

    upgradeModal
        .querySelector(
            "[data-upgrade-close]"
        )
        ?.addEventListener(
            "click",
            close
        );

    upgradeModal
        .querySelector(
            "[data-upgrade-demo]"
        )
        ?.addEventListener(
            "click",
            () => {
                const copy =
                    upgradeModal.querySelector(
                        ".upgrade-copy"
                    );

                if (copy) {
                    copy.textContent =
                        "This MovieVerse build is a front-end demo. Premium access is represented visually and no real payment is connected.";
                }
            }
        );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                !upgradeModal.hidden
            ) {
                closeUpgradeModal();
            }
        }
    );

    return upgradeModal;
}

export function openUpgradeModal(
    tier = "SUPER",
    title = "this title"
) {
    const modal =
        createUpgradeModal();

    const safeTier =
        TIER_ORDER[tier]
            ? tier
            : "SUPER";

    const copy =
        modal.querySelector(
            ".upgrade-copy"
        );

    if (copy) {
        copy.innerHTML = `
            <strong>
                ${escapeHTML(title)}
            </strong>
            is part of MovieVerse
            <span class="inline-tier inline-tier-${safeTier.toLowerCase()}">
                ${safeTier}
            </span>
            access in this demo.
            Unlocking premium viewing is represented
            here as a front-end experience only.
        `;
    }

    modal.hidden = false;

    document.body.classList.add(
        "upgrade-open"
    );
}

export function closeUpgradeModal() {
    if (!upgradeModal) {
        return;
    }

    upgradeModal.hidden = true;

    document.body.classList.remove(
        "upgrade-open"
    );
}

function getDetailsTier() {
    return getCurrentDetailsTier();
}

function handlePremiumClick(
    event,
    element
) {
    const tier =
        element.closest(
            ".details-access"
        )
            ? getDetailsTier()
            : element
                  .closest(
                      ".movie-card"
                  )
                  ?.querySelector(
                      ".tier"
                  )
                  ?.textContent
                  ?.trim()
                  .toUpperCase();

    const normalizedTier =
        tier || "FREE";

    if (
        normalizedTier !== "FREE"
    ) {
        event.preventDefault();
        event.stopPropagation();

        openUpgradeModal(
            normalizedTier,
            getTitleFromContext(
                element
            )
        );

        return true;
    }

    return false;
}

function setupProviderGuard() {
    document.addEventListener(
        "click",
        (event) => {
            const link =
                event.target.closest(
                    ".provider-link"
                );

            if (!link) {
                return;
            }

            handlePremiumClick(
                event,
                link
            );
        }
    );
}

function setupTrailerGuard() {
    document.addEventListener(
        "click",
        (event) => {
            const trailer =
                event.target.closest(
                    "[data-trailer-key]"
                );

            if (!trailer) {
                return;
            }

            handlePremiumClick(
                event,
                trailer
            );
        }
    );
}

function setupTierButtons() {
    document.addEventListener(
        "click",
        (event) => {
            const tier =
                event.target.closest(
                    ".movie-card .tier, .details-access .tier"
                );

            if (!tier) {
                return;
            }

            const value =
                tier.textContent
                    .trim()
                    .toUpperCase();

            if (
                value === "FREE"
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            openUpgradeModal(
                value,
                getTitleFromContext(
                    tier
                )
            );
        }
    );
}

function setupProviderAttribution() {
    const decorate =
        () => {
            const groups =
                document.querySelector(
                    ".details-modal .provider-groups"
                );

            if (
                !groups ||
                groups.parentElement.querySelector(
                    ".justwatch-attribution"
                )
            ) {
                return;
            }

            const note =
                document.createElement(
                    "p"
                );

            note.className =
                "justwatch-attribution";

            note.textContent =
                "Streaming availability data is provided through TMDB's JustWatch partnership.";

            groups.insertAdjacentElement(
                "afterend",
                note
            );
        };

    const observer =
        new MutationObserver(
            decorate
        );

    observer.observe(
        document.body,
        {
            subtree: true,
            childList: true
        }
    );

    decorate();
}

export function setupAccess() {
    createUpgradeModal();
    setupTierButtons();
    setupProviderGuard();
    setupTrailerGuard();
    setupProviderAttribution();
}