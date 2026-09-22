import { STORAGE_KEYS, readStorage, removeStorage } from "./storage.js";
import { defaultOnboarding, getSession, setSession, setupAuth } from "./auth.js";
import { startOnboarding, setupOnboarding } from "./onboarding.js";
import { renderRails, setupHomeInteractions } from "./ui.js";
import { setupProfiles, showProfiles, getProfiles } from "./profiles.js";

const shell = (id, hidden) => { document.getElementById(id).hidden = hidden; };
export function enterHome() { shell("auth-shell", true); shell("onboarding-shell", true); shell("personalization-shell", true); shell("profile-shell", true); shell("app-shell", false); renderRails(); setupHomeInteractions(); }
export function logout() { removeSession(); shell("app-shell", true); shell("onboarding-shell", true); shell("personalization-shell", true); shell("auth-shell", false); document.querySelectorAll("[data-auth-form], .forgot-view").forEach((element) => element.classList.remove("active")); document.querySelector('[data-auth-form="signin"]')?.classList.add("active"); }
function removeSession() { localStorage.removeItem(STORAGE_KEYS.session); }
document.addEventListener("DOMContentLoaded", () => { setupAuth({ enterHome: showProfiles, startOnboarding }); setupProfiles({ logout }); setupOnboarding({ showProfiles, logout }); window.addEventListener("movieverse:profile-selected", () => enterHome()); const session = getSession(); const stored = readStorage(STORAGE_KEYS.onboarding, defaultOnboarding()); const { moods, viewingStyle, ...onboarding } = stored; if (moods || viewingStyle) localStorage.setItem(STORAGE_KEYS.onboarding, JSON.stringify(onboarding)); if (session?.isAuthenticated) { if (session.isGuest || onboarding.onboardingCompleted) showProfiles(); else startOnboarding(onboarding); } else { shell("auth-shell", false); document.querySelector('[data-auth-form="signin"]')?.classList.add("active"); } });
