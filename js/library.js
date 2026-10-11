import {
    getProfileData,
    updateProfileData,
    removeFromProfileList,
    isInProfileList
} from "./storage.js";

const MAX_HISTORY_ITEMS = 50;
const MAX_RECENT_ITEMS = 30;
const MAX_LIST_ITEMS = 100;

function notifyLibraryUpdate() {
    window.dispatchEvent(
        new CustomEvent(
            "movieverse:library-updated"
        )
    );
}

function normalizeItem(item) {
    if (
        !item ||
        item.id === undefined ||
        item.id === null
    ) {
        return null;
    }

    return {
        id: String(item.id),

        mediaType:
            item.mediaType ||
            item.media_type ||
            "movie",

        title:
            item.title ||
            item.name ||
            "Untitled",

        posterPath:
            item.posterPath ||
            item.poster_path ||
            null,

        backdropPath:
            item.backdropPath ||
            item.backdrop_path ||
            null,

        overview: item.overview || "",

        voteAverage:
            Number.isFinite(
                item.voteAverage
            )
                ? item.voteAverage
                : Number.isFinite(
                      item.vote_average
                  )
                    ? item.vote_average
                    : null,

        releaseDate:
            item.releaseDate ||
            item.release_date ||
            item.first_air_date ||
            "",

        savedAt:
            item.savedAt ||
            Date.now()
    };
}

function limitedList(list, max) {
    return list.slice(0, max);
}

export function getMyList() {
    return getProfileData().myList;
}

export function getWishlist() {
    return getProfileData().wishlist;
}

export function getHistory() {
    return getProfileData().history;
}

export function getRecentlyViewed() {
    return getProfileData().recentlyViewed;
}

export function getContinueWatching() {
    return getProfileData()
        .continueWatching;
}

export function isInMyList(itemId) {
    return isInProfileList(
        "myList",
        itemId
    );
}

export function isInWishlist(itemId) {
    return isInProfileList(
        "wishlist",
        itemId
    );
}

export function isWatched(itemId) {
    return isInProfileList(
        "history",
        itemId
    );
}

export function addToMyList(item) {
    const normalized =
        normalizeItem(item);

    if (!normalized) {
        return null;
    }

    const profile =
        getProfileData();

    const exists =
        profile.myList.some(
            (entry) =>
                String(entry.id) ===
                normalized.id
        );

    if (exists) {
        return profile;
    }

    const updated =
        updateProfileData({
            myList: limitedList(
                [
                    normalized,
                    ...profile.myList
                ],
                MAX_LIST_ITEMS
            )
        });

    notifyLibraryUpdate();

    return updated;
}

export function removeFromMyList(itemId) {
    const result =
        removeFromProfileList(
            "myList",
            itemId
        );

    notifyLibraryUpdate();

    return result;
}

export function toggleMyList(item) {
    const normalized =
        normalizeItem(item);

    if (!normalized) {
        return {
            active: false,
            profile: null
        };
    }

    if (
        isInMyList(
            normalized.id
        )
    ) {
        return {
            active: false,
            profile:
                removeFromMyList(
                    normalized.id
                )
        };
    }

    return {
        active: true,
        profile:
            addToMyList(
                normalized
            )
    };
}

export function addToWishlist(item) {
    const normalized =
        normalizeItem(item);

    if (!normalized) {
        return null;
    }

    const profile =
        getProfileData();

    const exists =
        profile.wishlist.some(
            (entry) =>
                String(entry.id) ===
                normalized.id
        );

    if (exists) {
        return profile;
    }

    const updated =
        updateProfileData({
            wishlist: limitedList(
                [
                    normalized,
                    ...profile.wishlist
                ],
                MAX_LIST_ITEMS
            )
        });

    notifyLibraryUpdate();

    return updated;
}

export function removeFromWishlist(itemId) {
    const result =
        removeFromProfileList(
            "wishlist",
            itemId
        );

    notifyLibraryUpdate();

    return result;
}

export function toggleWishlist(item) {
    const normalized =
        normalizeItem(item);

    if (!normalized) {
        return {
            active: false,
            profile: null
        };
    }

    if (
        isInWishlist(
            normalized.id
        )
    ) {
        return {
            active: false,
            profile:
                removeFromWishlist(
                    normalized.id
                )
        };
    }

    return {
        active: true,
        profile:
            addToWishlist(
                normalized
            )
    };
}

export function markWatched(item) {
    const normalized =
        normalizeItem(item);

    if (!normalized) {
        return null;
    }

    const profile =
        getProfileData();

    const filteredHistory =
        profile.history.filter(
            (entry) =>
                String(entry.id) !==
                normalized.id
        );

    const filteredRecent =
        profile.recentlyViewed.filter(
            (entry) =>
                String(entry.id) !==
                normalized.id
        );

    const updated =
        updateProfileData({
            history: limitedList(
                [
                    normalized,
                    ...filteredHistory
                ],
                MAX_HISTORY_ITEMS
            ),

            recentlyViewed:
                limitedList(
                    [
                        normalized,
                        ...filteredRecent
                    ],
                    MAX_RECENT_ITEMS
                )
        });

    notifyLibraryUpdate();

    return updated;
}

export function unmarkWatched(itemId) {
    const result =
        removeFromProfileList(
            "history",
            itemId
        );

    notifyLibraryUpdate();

    return result;
}

export function addRecentlyViewed(item) {
    const normalized =
        normalizeItem(item);

    if (!normalized) {
        return null;
    }

    const profile =
        getProfileData();

    const nextRecent =
        profile.recentlyViewed.filter(
            (entry) =>
                String(entry.id) !==
                normalized.id
        );

    const updated =
        updateProfileData({
            recentlyViewed:
                limitedList(
                    [
                        normalized,
                        ...nextRecent
                    ],
                    MAX_RECENT_ITEMS
                )
        });

    notifyLibraryUpdate();

    return updated;
}

export function setContinueWatching(
    item,
    progress = 0
) {
    const normalized =
        normalizeItem(item);

    if (!normalized) {
        return null;
    }

    const safeProgress = Math.max(
        0,
        Math.min(
            100,
            Number(progress) || 0
        )
    );

    const profile =
        getProfileData();

    const next =
        profile.continueWatching.filter(
            (entry) =>
                String(entry.id) !==
                normalized.id
        );

    const updated =
        updateProfileData({
            continueWatching:
                limitedList(
                    [
                        {
                            ...normalized,
                            progress:
                                safeProgress,
                            updatedAt:
                                Date.now()
                        },
                        ...next
                    ],
                    MAX_LIST_ITEMS
                )
        });

    notifyLibraryUpdate();

    return updated;
}

export function removeContinueWatching(
    itemId
) {
    const result =
        removeFromProfileList(
            "continueWatching",
            itemId
        );

    notifyLibraryUpdate();

    return result;
}

export function clearHistory() {
    const result =
        updateProfileData({
            history: []
        });

    notifyLibraryUpdate();

    return result;
}

export function clearRecentlyViewed() {
    const result =
        updateProfileData({
            recentlyViewed: []
        });

    notifyLibraryUpdate();

    return result;
}