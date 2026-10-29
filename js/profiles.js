import {
    STORAGE_KEYS,
    readStorage,
    writeStorage,
    getStoredProfiles,
    saveStoredProfiles,
    getSession
} from "./storage.js";

import { defaultOnboarding } from "./auth.js";

const MAX_PROFILES = 10;

const AVATARS = [
    "cosmic-01",
    "cosmic-02",
    "geo-01",
    "geo-02",
    "orbit-01",
    "orbit-02",
    "gradient-01",
    "gradient-02"
];

const escapeHTML = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const profileDefaults = (profile = {}) => ({
    id:
        profile.id ||
        `profile-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

    name: profile.name || "",

    type:
        profile.type || "standard",

    avatar:
        profile.avatar || AVATARS[0],

    customImage:
        profile.customImage || null,

    pin:
        profile.pin || null,

    preferences: {
        domains: [],
        languages: [],
        genres: [],
        ottPlatforms: [],
        ...(profile.preferences || {})
    },

    myList: Array.isArray(profile.myList)
        ? profile.myList
        : [],

    wishlist: Array.isArray(
        profile.wishlist
    )
        ? profile.wishlist
        : [],

    history: Array.isArray(profile.history)
        ? profile.history
        : [],

    recentlyViewed: Array.isArray(
        profile.recentlyViewed
    )
        ? profile.recentlyViewed
        : [],

    continueWatching: Array.isArray(
        profile.continueWatching
    )
        ? profile.continueWatching
        : [],

    notifications: Array.isArray(
        profile.notifications
    )
        ? profile.notifications
        : [],

    settings:
        profile.settings &&
        typeof profile.settings === "object"
            ? profile.settings
            : {},

    ...profile
});

export const getProfiles = () =>
    getStoredProfiles().map(
        profileDefaults
    );

export const saveProfiles = (profiles) =>
    saveStoredProfiles(
        profiles.slice(
            0,
            MAX_PROFILES
        )
    );

export const getActiveProfileId = () =>
    getSession()?.currentProfileId ||
    null;

export const getActiveProfile = () =>
    getProfiles().find(
        (profile) =>
            profile.id ===
            getActiveProfileId()
    ) || null;

export const profileAvatars =
    AVATARS;

export const maxProfiles =
    MAX_PROFILES;

function getOnboardingPreferences() {
    const saved =
        readStorage(
            STORAGE_KEYS.onboarding,
            defaultOnboarding()
        );

    return {
        domains: Array.isArray(
            saved.domains
        )
            ? [...saved.domains]
            : [],

        languages: Array.isArray(
            saved.languages
        )
            ? [...saved.languages]
            : [],

        genres: Array.isArray(
            saved.genres
        )
            ? [...saved.genres]
            : [],

        ottPlatforms: Array.isArray(
            saved.ottPlatforms
        )
            ? [...saved.ottPlatforms]
            : []
    };
}

function createInitialProfile(
    session
) {
    return profileDefaults({
        id: "main-profile",

        name: session?.isGuest
            ? "Guest Explorer"
            : "Main Profile",

        type: "standard",

        avatar: "cosmic-01",

        preferences:
            getOnboardingPreferences()
    });
}

function updateHeader(profile) {
    const chip =
        document.querySelector(
            ".profile-chip"
        );

    if (!chip || !profile) {
        return;
    }

    const avatar =
        chip.querySelector(
            ".avatar"
        );

    const label =
        chip.querySelector(
            ".profile-label"
        );

    if (label) {
        label.textContent =
            profile.name;
    }

    if (avatar) {
        if (profile.customImage) {
            avatar.style.backgroundImage =
                `url("${profile.customImage}")`;

            avatar.textContent = "";
            avatar.style.backgroundSize =
                "cover";
            avatar.style.backgroundPosition =
                "center";
        } else {
            avatar.style.backgroundImage =
                "";

            avatar.textContent =
                profile.name
                    .slice(0, 2)
                    .toUpperCase();
        }
    }
}

function profileCard(
    profile,
    onSelect,
    onEdit,
    onDelete
) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "profile-card";

    const initials =
        profile.name
            .slice(0, 2)
            .toUpperCase();

    card.innerHTML = `
        <button
            class="profile-select"
            type="button"
        >
            <span
                class="profile-avatar avatar-${profile.avatar}"
                ${
                    profile.customImage
                        ? `style="background-image:url('${profile.customImage}')"`
                        : ""
                }
            >
                ${
                    profile.customImage
                        ? ""
                        : escapeHTML(
                              initials
                          )
                }
            </span>

            <strong>
                ${escapeHTML(
                    profile.name
                )}
            </strong>

            <small>
                ${
                    profile.type ===
                    "kids"
                        ? "Kids profile"
                        : "Standard profile"
                }

                ${
                    profile.pin
                        ? " • 🔒 PIN"
                        : ""
                }
            </small>
        </button>

        <div class="profile-card-actions">
            <button
                type="button"
                data-edit
            >
                Edit
            </button>

            <button
                type="button"
                data-delete
            >
                Delete
            </button>
        </div>
    `;

    card.querySelector(
        ".profile-select"
    )?.addEventListener(
        "click",
        () => onSelect(profile)
    );

    card.querySelector(
        "[data-edit]"
    )?.addEventListener(
        "click",
        () => onEdit(profile)
    );

    card.querySelector(
        "[data-delete]"
    )?.addEventListener(
        "click",
        () => onDelete(profile)
    );

    return card;
}

function openPinPrompt(
    profile,
    success
) {
    let modal =
        document.getElementById(
            "movieverse-pin-modal"
        );

    if (!modal) {
        modal =
            document.createElement(
                "div"
            );

        modal.id =
            "movieverse-pin-modal";

        modal.className =
            "profile-pin-modal";

        modal.innerHTML = `
            <div
                class="profile-pin-backdrop"
            ></div>

            <form
                class="profile-pin-dialog"
            >
                <p class="kicker">
                    Profile locked
                </p>

                <h2>
                    Enter your
                    <em>PIN.</em>
                </h2>

                <p>
                    This is a local demo profile
                    lock for MovieVerse.
                </p>

                <input
                    type="password"
                    inputmode="numeric"
                    maxlength="4"
                    pattern="[0-9]{4}"
                    autocomplete="off"
                    placeholder="••••"
                    required
                >

                <span
                    class="profile-pin-error"
                ></span>

                <div>
                    <button
                        type="button"
                        class="button button-quiet"
                        data-pin-cancel
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="button button-primary"
                    >
                        Unlock
                    </button>
                </div>
            </form>
        `;

        document.body.appendChild(
            modal
        );

        modal
            .querySelector(
                "[data-pin-cancel]"
            )
            ?.addEventListener(
                "click",
                () =>
                    (modal.hidden =
                        true)
            );

        modal
            .querySelector(
                ".profile-pin-backdrop"
            )
            ?.addEventListener(
                "click",
                () =>
                    (modal.hidden =
                        true)
            );
    }

    const form =
        modal.querySelector(
            ".profile-pin-dialog"
        );

    const input =
        form.querySelector(
            "input"
        );

    const error =
        form.querySelector(
            ".profile-pin-error"
        );

    input.value = "";
    error.textContent = "";
    modal.hidden = false;

    form.onsubmit = (event) => {
        event.preventDefault();

        if (
            input.value !==
            profile.pin
        ) {
            error.textContent =
                "Incorrect PIN.";

            input.select();

            return;
        }

        modal.hidden = true;
        success();
    };

    window.setTimeout(
        () => input.focus(),
        50
    );
}

function setActiveProfile(
    profile
) {
    const activate = () => {
        const session =
            readStorage(
                STORAGE_KEYS.session,
                {}
            );

        writeStorage(
            STORAGE_KEYS.session,
            {
                ...session,
                currentProfileId:
                    profile.id
            }
        );

        updateHeader(
            profile
        );

        closeProfileShell();

        window.dispatchEvent(
            new CustomEvent(
                "movieverse:profile-selected",
                {
                    detail: profile
                }
            )
        );
    };

    if (profile.pin) {
        openPinPrompt(
            profile,
            activate
        );
    } else {
        activate();
    }
}

function openProfileShell() {
    document.getElementById(
        "profile-shell"
    ).hidden = false;

    document.getElementById(
        "auth-shell"
    ).hidden = true;

    document.getElementById(
        "onboarding-shell"
    ).hidden = true;

    document.getElementById(
        "personalization-shell"
    ).hidden = true;

    document.getElementById(
        "app-shell"
    ).hidden = true;
}

function closeProfileShell() {
    document.getElementById(
        "profile-shell"
    ).hidden = true;
}

function renderProfiles() {
    const grid =
        document.getElementById(
            "profile-grid"
        );

    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    const profiles =
        getProfiles();

    profiles.forEach(
        (profile) => {
            grid.appendChild(
                profileCard(
                    profile,
                    setActiveProfile,
                    openEditor,
                    deleteProfile
                )
            );
        }
    );

    const add =
        document.createElement(
            "button"
        );

    add.className =
        "profile-add";

    add.type = "button";

    add.disabled =
        profiles.length >=
        MAX_PROFILES;

    add.innerHTML = `
        <span>+</span>

        <strong>
            ${
                profiles.length >=
                MAX_PROFILES
                    ? "Profile limit reached"
                    : "Add profile"
            }
        </strong>

        <small>
            ${profiles.length}
            / ${MAX_PROFILES}
            profiles
        </small>
    `;

    add.addEventListener(
        "click",
        () => openEditor()
    );

    grid.appendChild(add);

    const count =
        document.getElementById(
            "profile-count"
        );

    if (count) {
        count.textContent =
            `${profiles.length} / ${MAX_PROFILES} PROFILES`;
    }
}

function injectImageControls(
    form
) {
    if (
        form.querySelector(
            ".profile-image-controls"
        )
    ) {
        return;
    }

    const picker =
        form.querySelector(
            ".avatar-picker"
        );

    if (!picker) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "profile-image-controls";

    wrapper.innerHTML = `
        <label>
            Custom profile picture
            <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                data-profile-image
            >
        </label>

        <button
            type="button"
            class="text-button"
            data-clear-profile-image
        >
            Remove custom image
        </button>

        <div
            class="profile-image-preview"
            data-profile-image-preview
        ></div>
    `;

    picker.insertAdjacentElement(
        "afterend",
        wrapper
    );

    const input =
        wrapper.querySelector(
            "[data-profile-image]"
        );

    const preview =
        wrapper.querySelector(
            "[data-profile-image-preview]"
        );

    input.addEventListener(
        "change",
        () => {
            const file =
                input.files?.[0];

            if (!file) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload = () => {
                preview.style.backgroundImage =
                    `url("${reader.result}")`;

                preview.classList.add(
                    "visible"
                );

                form.dataset.pendingImage =
                    reader.result;
            };

            reader.readAsDataURL(
                file
            );
        }
    );

    wrapper
        .querySelector(
            "[data-clear-profile-image]"
        )
        ?.addEventListener(
            "click",
            () => {
                form.dataset.pendingImage =
                    "";

                input.value = "";

                preview.style.backgroundImage =
                    "";

                preview.classList.remove(
                    "visible"
                );

                form.dataset.removeImage =
                    "true";
            }
        );
}

function openEditor(
    profile = null
) {
    const form =
        document.getElementById(
            "profile-form"
        );

    if (!form) {
        return;
    }

    form.reset();

    form.dataset.id =
        profile?.id || "";

    form.dataset.pendingImage =
        "";

    form.dataset.removeImage =
        "false";

    form.name.value =
        profile?.name || "";

    form.type.value =
        profile?.type ||
        "standard";

    form.pin.value =
        profile?.pin || "";

    document
        .querySelectorAll(
            "[data-avatar]"
        )
        .forEach((button) => {
            button.classList.toggle(
                "selected",
                button.dataset
                    .avatar ===
                    (
                        profile?.avatar ||
                        AVATARS[0]
                    )
            );
        });

    injectImageControls(
        form
    );

    const preview =
        form.querySelector(
            "[data-profile-image-preview]"
        );

    if (
        preview &&
        profile?.customImage
    ) {
        preview.style.backgroundImage =
            `url("${profile.customImage}")`;

        preview.classList.add(
            "visible"
        );
    } else if (preview) {
        preview.style.backgroundImage =
            "";

        preview.classList.remove(
            "visible"
        );
    }

    const error =
        form.querySelector(
            "[data-error]"
        );

    if (error) {
        error.textContent = "";
    }

    document.getElementById(
        "profile-editor"
    ).hidden = false;
}

function closeEditor() {
    document.getElementById(
        "profile-editor"
    ).hidden = true;
}

function deleteProfile(
    profile
) {
    if (
        !window.confirm(
            `Delete ${profile.name}?`
        )
    ) {
        return;
    }

    const profiles =
        getProfiles().filter(
            (item) =>
                item.id !==
                profile.id
        );

    saveProfiles(
        profiles
    );

    const session =
        readStorage(
            STORAGE_KEYS.session,
            {}
        );

    if (
        session.currentProfileId ===
        profile.id
    ) {
        writeStorage(
            STORAGE_KEYS.session,
            {
                ...session,
                currentProfileId:
                    profiles[0]?.id ||
                    null
            }
        );
    }

    renderProfiles();
}

function setupEditor() {
    document
        .querySelectorAll(
            "[data-avatar]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    document
                        .querySelectorAll(
                            "[data-avatar]"
                        )
                        .forEach(
                            (item) =>
                                item.classList.remove(
                                    "selected"
                                )
                        );

                    button.classList.add(
                        "selected"
                    );
                }
            );
        });

    document
        .getElementById(
            "profile-cancel"
        )
        ?.addEventListener(
            "click",
            closeEditor
        );

    document
        .getElementById(
            "profile-form"
        )
        ?.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                const form =
                    event.currentTarget;

                const name =
                    form.name.value.trim();

                const error =
                    form.querySelector(
                        "[data-error]"
                    );

                if (
                    !name ||
                    name.length > 28
                ) {
                    error.textContent =
                        "Enter a profile name up to 28 characters.";

                    return;
                }

                if (
                    form.pin.value &&
                    !/^\d{4}$/.test(
                        form.pin.value
                    )
                ) {
                    error.textContent =
                        "PIN must contain exactly 4 digits.";

                    return;
                }

                const profiles =
                    getProfiles();

                const duplicate =
                    profiles.some(
                        (profile) =>
                            profile.name
                                .toLowerCase() ===
                                name.toLowerCase() &&
                            profile.id !==
                                form.dataset.id
                    );

                if (duplicate) {
                    error.textContent =
                        "That profile name is already in use.";

                    return;
                }

                const selectedAvatar =
                    document.querySelector(
                        "[data-avatar].selected"
                    )?.dataset.avatar ||
                    AVATARS[0];

                const existing =
                    profiles.find(
                        (profile) =>
                            profile.id ===
                            form.dataset.id
                    );

                let customImage =
                    existing?.customImage ||
                    null;

                if (
                    form.dataset
                        .removeImage ===
                    "true"
                ) {
                    customImage = null;
                }

                if (
                    form.dataset
                        .pendingImage
                ) {
                    customImage =
                        form.dataset
                            .pendingImage;
                }

                const next =
                    profileDefaults({
                        ...(existing || {}),
                        id:
                            form.dataset.id ||
                            undefined,
                        name,
                        type:
                            form.type.value,
                        pin:
                            form.pin.value ||
                            null,
                        avatar:
                            selectedAvatar,
                        customImage
                    });

                const updated =
                    form.dataset.id
                        ? profiles.map(
                              (profile) =>
                                  profile.id ===
                                  form.dataset.id
                                      ? next
                                      : profile
                          )
                        : [
                              ...profiles,
                              next
                          ];

                saveProfiles(
                    updated
                );

                closeEditor();
                renderProfiles();

                if (!existing) {
                    window.dispatchEvent(
                        new CustomEvent(
                            "movieverse:new-profile-created",
                            { detail: next }
                        )
                    );
                }

                const active =
                    getActiveProfile();

                if (
                    active &&
                    active.id ===
                        next.id
                ) {
                    updateHeader(
                        next
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            "movieverse:profile-selected",
                            {
                                detail:
                                    next
                            }
                        )
                    );
                }
            }
        );
}

export function setupProfiles({
    logout
}) {
    document
        .getElementById(
            "profile-exit"
        )
        ?.addEventListener(
            "click",
            logout
        );

    setupEditor();
}

export function showProfiles() {
    let profiles =
        getProfiles();

    const session =
        getSession();

    if (
        !profiles.length &&
        !session.currentProfileId
    ) {
        const initial =
            createInitialProfile(
                session
            );

        saveProfiles([
            initial
        ]);

        writeStorage(
            STORAGE_KEYS.session,
            {
                ...session,
                currentProfileId:
                    initial.id
            }
        );

        profiles = [
            initial
        ];
    }

    openProfileShell();
    renderProfiles();
}