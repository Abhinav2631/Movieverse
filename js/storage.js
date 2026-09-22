export const STORAGE_KEYS = Object.freeze({
    account: "movieverse.demo.account",
    session: "movieverse.demo.session",
    onboarding: "movieverse.demo.onboarding"
});

export function readStorage(key, fallback = null) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
        return fallback;
    }
}

export function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key) {
    localStorage.removeItem(key);
}
