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

Use a safe local config file instead of committing credentials. Keep the token in `config/config.js`, which is ignored by git.

## Docker

```bash
docker build -t movieverse .
docker run --rm -p 80:80 movieverse
```

## Notes

- The app intentionally avoids adding a backend or framework.
- Demo credentials are included for convenience: `demo@movieverse.local` / `movieverse`.
- Any API keys or credentials should never be committed or exposed in logs.
