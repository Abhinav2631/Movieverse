export const onboardingSteps = [
    {
        title: "What are you into?",
        description: "Explore the entertainment universe and choose the worlds you want MovieVerse to keep close.",
        key: "domains",
        minimum: 3,
        hint: "Choose at least 3",
        atmosphere: "domains",
        options: ["Movies", "TV Shows", "Web Series", "Anime", "Sports", "Music & Performance", "Dance", "Comedy", "Reality & Talent", "Documentaries", "Gaming / Esports", "Family & Kids", "Educational / Informative"]
    },
    {
        title: "What do you like to watch?",
        description: "Explore the world through languages and choose the voices that make a story feel like yours.",
        key: "languages",
        minimum: 1,
        hint: "Choose at least 1",
        atmosphere: "languages",
        options: ["English", "Hindi", "Telugu", "Tamil", "Malayalam", "Kannada", "Korean", "Japanese", "Spanish", "French", "German", "Italian", "Chinese"]
    },
    {
        title: "Pick your favorites",
        description: "Choose your storytelling universe and build a constellation of genres you never get tired of.",
        key: "genres",
        minimum: 3,
        hint: "Choose at least 3",
        atmosphere: "genres",
        options: ["Action", "Adventure", "Comedy", "Drama", "Horror", "Romance", "Rom-Com", "Science Fiction", "Fantasy", "Thriller", "Mystery", "Crime", "Animation", "Documentary", "Family", "History", "War", "Western", "Music", "Sports Drama", "Action-Comedy", "Action Thriller", "Psychological Thriller", "Supernatural Horror", "Dark Comedy", "Romantic Drama", "Sci-Fi Thriller", "Fantasy Adventure", "Crime Thriller", "Mystery Crime", "Heist", "Survival", "Disaster", "Martial Arts", "Spy", "Coming-of-Age", "Biographical", "Musical", "Zombie", "Vampire", "Paranormal", "Dystopian", "Time Travel", "Multiverse"]
    },
    {
        title: "Where do you watch?",
        description: "Choose the platforms you use or want to explore. MovieVerse will use these preferences later to personalize discovery.",
        key: "ottPlatforms",
        minimum: 0,
        hint: "Optional · choose any",
        atmosphere: "ott",
        options: ["Netflix", "Prime Video", "JioHotstar", "Sony LIV", "ZEE5", "Apple TV+", "Crunchyroll", "Aha", "Sun NXT", "Lionsgate Play", "Hoichoi", "ManoramaMAX", "Other / More Platforms"]
    }
];

export const defaultOnboarding = () => ({ domains: [], languages: [], genres: [], ottPlatforms: [], onboardingCompleted: false });
export const nativeLanguageNames = { Hindi: "हिन्दी", Telugu: "తెలుగు", Tamil: "தமிழ்", Malayalam: "മലയാളം", Kannada: "ಕನ್ನಡ", Korean: "한국어", Japanese: "日本語", Spanish: "Español", French: "Français", German: "Deutsch", Italian: "Italiano", Chinese: "中文" };
