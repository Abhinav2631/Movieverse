import {
    STORAGE_KEYS,
    readStorage
} from "./storage.js";

import {
    defaultOnboarding,
    getSession,
    setupAuth
} from "./auth.js";

import {
    startOnboarding,
    setupOnboarding
} from "./onboarding.js";

import {
    renderRails,
    setupHomeInteractions
} from "./ui.js";

import {
    setupProfiles,
    showProfiles
} from "./profiles.js";

import {
    setupDetails
} from "./details.js";

import {
    setupSearch
} from "./search.js";

import {
    setupHero
} from "./hero.js";

import {
    setupLibraryUI
} from "./library-ui.js";

import {
    setupFeatures
} from "./features.js";

import {
    setupPersonalization
} from "./personalization.js";

import {
    setupAccess
} from "./access.js";

import {
    setupNavigation
} from "./navigation.js";

const shell = (
    id,
    hidden
) => {
    const element =
        document.getElementById(
            id
        );

    if (element) {
        element.hidden =
            hidden;
    }
};

let heroReady = false;
let libraryReady = false;
let personalizationReady =
    false;

export function enterHome() {
    shell(
        "auth-shell",
        true
    );

    shell(
        "onboarding-shell",
        true
    );

    shell(
        "personalization-shell",
        true
    );

    shell(
        "profile-shell",
        true
    );

    shell(
        "app-shell",
        false
    );

    renderRails();
    setupHomeInteractions();

    if (!heroReady) {
        setupHero();
        heroReady =
            true;
    }

    if (!libraryReady) {
        setupLibraryUI();
        libraryReady =
            true;
    }

    if (!personalizationReady) {
        setupPersonalization();
        personalizationReady =
            true;
    }
}

export function logout() {
    localStorage.removeItem(
        STORAGE_KEYS.session
    );

    shell(
        "app-shell",
        true
    );

    shell(
        "onboarding-shell",
        true
    );

    shell(
        "personalization-shell",
        true
    );

    shell(
        "profile-shell",
        true
    );

    shell(
        "auth-shell",
        false
    );

    document
        .querySelectorAll(
            "[data-auth-form], .forgot-view"
        )
        .forEach(
            (element) =>
                element.classList.remove(
                    "active"
                )
        );

    document
        .querySelector(
            '[data-auth-form="signin"]'
        )
        ?.classList.add(
            "active"
        );
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        setupAuth({
            enterHome:
                showProfiles,
            startOnboarding
        });

        setupProfiles({
            logout
        });

        /*
         * Remove the profile chip's
         * logout behavior before
         * onboarding attaches its
         * own logout listeners.
         */
        setupNavigation({
            showProfiles
        });

        setupOnboarding({
            showProfiles,
            logout
        });

        setupDetails();
        setupSearch();
        setupFeatures();
        setupAccess();

        window.addEventListener(
            "movieverse:profile-selected",
            () => {
                enterHome();
            }
        );

        const session =
            getSession();

        const stored =
            readStorage(
                STORAGE_KEYS.onboarding,
                defaultOnboarding()
            );

        const {
            moods,
            viewingStyle,
            ...onboarding
        } = stored;

        if (
            moods ||
            viewingStyle
        ) {
            localStorage.setItem(
                STORAGE_KEYS.onboarding,
                JSON.stringify(
                    onboarding
                )
            );
        }

        if (
            session?.isAuthenticated
        ) {
            if (
                session.isGuest ||
                onboarding.onboardingCompleted
            ) {
                showProfiles();
            } else {
                startOnboarding(
                    onboarding
                );
            }
        } else {
            shell(
                "auth-shell",
                false
            );

            document
                .querySelector(
                    '[data-auth-form="signin"]'
                )
                ?.classList.add(
                    "active"
                );
        }
    }
);