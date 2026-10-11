export const STORAGE_KEYS = Object.freeze({
    account: "movieverse.demo.account",
    session: "movieverse.demo.session",
    onboarding: "movieverse.demo.onboarding",
    profiles: "movieverse.demo.profiles"
});

const PROFILE_DATA_DEFAULTS = Object.freeze({
    myList: [],
    wishlist: [],
    history: [],
    recentlyViewed: [],
    continueWatching: [],
    notifications: [],
    settings: {}
});

function getCurrentSession() {
    try {
        const raw = localStorage.getItem(
            STORAGE_KEYS.session
        );

        return raw
            ? JSON.parse(raw)
            : {};
    } catch {
        return {};
    }
}

function getAccountScopedProfilesKey() {
    const session = getCurrentSession();

    const accountId =
        session?.accountId ||
        "guest-account";

    return `${STORAGE_KEYS.profiles}.${encodeURIComponent(
        accountId
    )}`;
}

export function readStorage(
    key,
    fallback = null
) {
    try {
        const raw =
            localStorage.getItem(key);

        if (raw === null) {
            return fallback;
        }

        const parsed =
            JSON.parse(raw);

        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

export function writeStorage(
    key,
    value
) {
    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}

export function removeStorage(
    key
) {
    localStorage.removeItem(key);
}

export function getSession() {
    return readStorage(
        STORAGE_KEYS.session,
        {}
    );
}

export function getActiveProfileId() {
    return (
        getSession()?.currentProfileId ||
        null
    );
}

export function getStoredProfiles() {
    const scopedKey =
        getAccountScopedProfilesKey();

    const scopedProfiles =
        readStorage(
            scopedKey,
            null
        );

    if (Array.isArray(scopedProfiles)) {
        return scopedProfiles;
    }

    /*
     * One-time migration for profiles
     * created by the earlier version of
     * MovieVerse before account scoping.
     */
    const legacyProfiles =
        readStorage(
            STORAGE_KEYS.profiles,
            null
        );

    const session =
        getCurrentSession();

    if (
        Array.isArray(legacyProfiles) &&
        legacyProfiles.length &&
        session?.accountId
    ) {
        writeStorage(
            scopedKey,
            legacyProfiles
        );

        removeStorage(
            STORAGE_KEYS.profiles
        );

        return legacyProfiles;
    }

    return [];
}

export function saveStoredProfiles(
    profiles
) {
    writeStorage(
        getAccountScopedProfilesKey(),
        profiles
    );
}

export function getStoredProfile(
    profileId = getActiveProfileId()
) {
    if (!profileId) {
        return null;
    }

    return (
        getStoredProfiles().find(
            (profile) =>
                profile.id ===
                profileId
        ) || null
    );
}

export function getProfileData(
    profileId = getActiveProfileId()
) {
    const profile =
        getStoredProfile(
            profileId
        );

    if (!profile) {
        return {
            ...PROFILE_DATA_DEFAULTS
        };
    }

    return {
        ...PROFILE_DATA_DEFAULTS,
        ...profile,

        myList: Array.isArray(
            profile.myList
        )
            ? profile.myList
            : [],

        wishlist: Array.isArray(
            profile.wishlist
        )
            ? profile.wishlist
            : [],

        history: Array.isArray(
            profile.history
        )
            ? profile.history
            : [],

        recentlyViewed: Array.isArray(
            profile.recentlyViewed
        )
            ? profile.recentlyViewed
            : [],

        continueWatching:
            Array.isArray(
                profile.continueWatching
            )
                ? profile.continueWatching
                : [],

        notifications:
            Array.isArray(
                profile.notifications
            )
                ? profile.notifications
                : [],

        settings:
            profile.settings &&
            typeof profile.settings ===
                "object"
                ? profile.settings
                : {}
    };
}

export function updateProfileData(
    updates,
    profileId = getActiveProfileId()
) {
    if (!profileId) {
        return null;
    }

    const profiles =
        getStoredProfiles();

    const profileIndex =
        profiles.findIndex(
            (profile) =>
                profile.id ===
                profileId
        );

    if (profileIndex === -1) {
        return null;
    }

    const current =
        profiles[profileIndex];

    const next = {
        ...current,
        ...updates
    };

    profiles[profileIndex] =
        next;

    saveStoredProfiles(
        profiles
    );

    return next;
}

export function updateProfileList(
    listName,
    item,
    profileId = getActiveProfileId()
) {
    if (
        !profileId ||
        !item
    ) {
        return null;
    }

    const allowedLists = [
        "myList",
        "wishlist",
        "history",
        "recentlyViewed",
        "continueWatching",
        "notifications"
    ];

    if (
        !allowedLists.includes(
            listName
        )
    ) {
        return null;
    }

    const profile =
        getProfileData(
            profileId
        );

    const currentList =
        Array.isArray(
            profile[listName]
        )
            ? profile[listName]
            : [];

    const itemId =
        String(item.id);

    const exists =
        currentList.some(
            (entry) =>
                String(entry.id) ===
                itemId
        );

    const nextList = exists
        ? currentList.map(
              (entry) =>
                  String(entry.id) ===
                  itemId
                      ? {
                            ...entry,
                            ...item
                        }
                      : entry
          )
        : [
              item,
              ...currentList
          ];

    return updateProfileData(
        {
            [listName]:
                nextList
        },
        profileId
    );
}

export function removeFromProfileList(
    listName,
    itemId,
    profileId = getActiveProfileId()
) {
    if (
        !profileId ||
        !itemId
    ) {
        return null;
    }

    const allowedLists = [
        "myList",
        "wishlist",
        "history",
        "recentlyViewed",
        "continueWatching",
        "notifications"
    ];

    if (
        !allowedLists.includes(
            listName
        )
    ) {
        return null;
    }

    const profile =
        getProfileData(
            profileId
        );

    const nextList =
        profile[listName].filter(
            (item) =>
                String(item.id) !==
                String(itemId)
        );

    return updateProfileData(
        {
            [listName]:
                nextList
        },
        profileId
    );
}

export function isInProfileList(
    listName,
    itemId,
    profileId = getActiveProfileId()
) {
    if (
        !profileId ||
        !itemId
    ) {
        return false;
    }

    const profile =
        getProfileData(
            profileId
        );

    const list =
        Array.isArray(
            profile[listName]
        )
            ? profile[listName]
            : [];

    return list.some(
        (item) =>
            String(item.id) ===
            String(itemId)
    );
}