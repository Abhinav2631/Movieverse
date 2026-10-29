# MovieVerse

MovieVerse is a front-end entertainment discovery demo built with HTML, CSS, and vanilla JavaScript. It includes sign-in, sign-up, guest access, profile management, onboarding, and a cinematic discovery UI inspired by streaming platforms.

## What works in this project

- Demo authentication using localStorage for browser-only sessions
- Onboarding flow with entertainment domains, languages, genres, OTT preferences, and mood selection
- Profile creation, editing, deletion, and up to 10 total profiles
- Home-page discovery rails, search, details, trailers, watch-provider labels, and library-style browsing
- Responsive layout designed for desktop and narrow mobile widths
- Docker/Nginx-ready static serving

## Important limitation

This project is not a production authentication system and does not include a backend API or real user management. The data is intentionally stored in browser localStorage for demo purposes only.

TMDB-backed content is optional and requires a valid read token. If no token is configured, MovieVerse will still load in a demo mode that avoids fatal runtime errors and keeps the UI available.

## Project structure

```text
MovieVerse/
├── config/
│   ├── config.example.js
│   └── config.js            # local file, ignored by git when populated with secrets
├── css/
├── js/
├── index.html
├── script.js
├── style.css
├── Dockerfile
├── .gitignore
├── README.md
└── LICENSE                  # if present in your fork
```

## Local run instructions

Because it is a static app, there is no build step:

1. Copy the example config file if you want live TMDB content:
   ```bash
   cp config/config.example.js config/config.js
   ```
2. Edit `config/config.js` and set a valid TMDB read token.
3. Serve the directory locally:
   ```bash
   python -m http.server 8000
   ```
   or open `index.html` directly in a browser.
4. Visit `http://localhost:8000` in your browser.

## TMDB configuration

A valid TMDB read token is required only for live content and metadata requests. If the token is empty or invalid, the app will warn in the console and continue with an empty demo response rather than crashing.

Use a safe local config file instead of committing credentials. Keep the token in `config/config.js`, which is ignored by git. For the India catalog, set `tmdbRegion: "IN"` in your existing local `config/config.js`. Pulling the feature branch will not overwrite that ignored local file, so verify the region value manually.

## Docker

```bash
docker build -t movieverse .
docker run --rm -p 80:80 movieverse
```

## Notes

- The app intentionally avoids adding a backend or framework.
- Demo credentials are included for convenience: `demo@movieverse.local` / `movieverse`.
- Any API keys or credentials should never be committed or exposed in logs.

## Live data, freshness, and external links

MovieVerse is a static front-end. When a valid TMDB read token is configured, the app requests live catalog metadata from TMDB rather than bundling a permanent copy of titles.

- The Home rails request trending, popular movies, popular series, top-rated, now-playing, and upcoming data when Home is entered.
- The home rails refresh every 30 minutes while the app is visible, or when a user returns to the tab after at least 30 minutes.
- The hero rotates through up to 20 unique titles from three pages of TMDB's daily-trending endpoint every 6.5 seconds. It refreshes its candidate list every 30 minutes. The motion is a carousel; it is not a real-time event/news feed.
- Opening a title fetches current title metadata and regional watch-provider data from TMDB. Provider availability is region-sensitive and can change.
- The watch-provider API, supported by TMDB's JustWatch partnership, does **not** provide provider-specific playback deep links. Recognized providers open a title-filled search on the official streaming service. For providers without a reliable service search URL, MovieVerse opens the title's provider-availability page instead, where a supported service link may be available. A search result is not a guarantee that the title is included in a subscription.
- The “Set a reminder” control only saves a preference in this browser and displays a notice. It does not send notifications because the project has no backend or notification service.
- Demo authentication, profiles, personal shelves, and preferences are stored in this browser's `localStorage`; they do not sync across browsers or devices.

### Security and backend scope

This project intentionally has no backend. Its sign-in flow is for demonstration only, not production authentication. A TMDB token used by a static front-end is visible to a determined visitor through browser source/network tools; `config/config.js` being ignored by Git prevents accidental repository commits, but does not make the token secret at runtime. Do not use this architecture for private credentials or real user data. Hiding a token securely would require a server-side proxy/backend, which is outside this project's current scope.

