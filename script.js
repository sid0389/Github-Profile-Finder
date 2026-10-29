
/* =========================
   1. Theme toggle
========================= */

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.getElementById("theme-label");

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    const isDark = theme === "dark";

    if (themeIcon) {
        themeIcon.textContent = isDark ? "☀" : "☾";
    }

    if (themeLabel) {
        themeLabel.textContent = isDark ? "Light" : "Dark";
    }

    if (themeToggle) {
        themeToggle.setAttribute(
            "aria-label",
            `Switch to ${isDark ? "light" : "dark"} mode`
        );
    }
}

let savedTheme = "dark";

try {
    const storedTheme = localStorage.getItem("github-finder-theme");

    if (storedTheme === "light" || storedTheme === "dark") {
        savedTheme = storedTheme;
    }
} catch {
    // Use dark mode if browser storage is unavailable.
}

applyTheme(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.dataset.theme || "dark";

        const newTheme = currentTheme === "dark" ? "light" : "dark";

        applyTheme(newTheme);

        try {
            localStorage.setItem("github-finder-theme", newTheme);
        } catch {
            // Theme switching still works for this session.
        }
    });
}


/* =========================
   2. HTML elements
========================= */

const searchForm = document.getElementById("search-form");
const usernameInput = document.getElementById("username-input");
const searchButton = document.getElementById("search-button");

const statusMessage = document.getElementById("status");
const profileCard = document.getElementById("profile-card");

const avatar = document.getElementById("avatar");
const nameElement = document.getElementById("name");
const usernameElement = document.getElementById("username");
const bioElement = document.getElementById("bio");

const reposElement = document.getElementById("repos");
const followersElement = document.getElementById("followers");
const followingElement = document.getElementById("following");

const locationElement = document.getElementById("location");
const companyElement = document.getElementById("company");
const websiteElement = document.getElementById("website");
const createdAtElement = document.getElementById("created-at");

const profileLink = document.getElementById("profile-link");

// Repository elements
const repositoriesSection =
    document.getElementById("repositories-section");

const repoCount = document.getElementById("repo-count");
const repoStatus = document.getElementById("repo-status");
const repoList = document.getElementById("repo-list");
const allReposLink = document.getElementById("all-repos-link");


/* =========================
   3. Helper functions
========================= */

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status";

    if (type) {
        statusMessage.classList.add(type);
    }

    statusMessage.hidden = false;
}

function hideStatus() {
    statusMessage.hidden = true;
    statusMessage.textContent = "";
    statusMessage.className = "status";
}

function displayValue(value) {
    return value && String(value).trim()
        ? String(value).trim()
        : "Not specified";
}

function formatNumber(number) {
    return new Intl.NumberFormat("en-US").format(number ?? 0);
}

function formatDate(dateString) {
    if (!dateString) {
        return "Not available";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function displayWebsite(blog) {
    websiteElement.replaceChildren();

    if (!blog || !blog.trim()) {
        websiteElement.textContent = "Not specified";
        return;
    }

    let url;

    try {
        const value = blog.trim();

        url = new URL(
            /^https?:\/\//i.test(value) ? value : `https://${value}`
        );

        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("Invalid website URL");
        }
    } catch {
        websiteElement.textContent = "Invalid website URL";
        return;
    }

    const link = document.createElement("a");
    link.href = url.href;
    link.textContent = blog.trim();
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    websiteElement.appendChild(link);
}


/* =========================
   4. Repository functions
========================= */

function showRepoStatus(message, type = "") {
    repoStatus.textContent = message;
    repoStatus.className = "repo-status";

    if (type) {
        repoStatus.classList.add(type);
    }

    repoStatus.hidden = false;
}

function hideRepoStatus() {
    repoStatus.hidden = true;
    repoStatus.textContent = "";
    repoStatus.className = "repo-status";
}

// Build one repository card using safe DOM methods.
function createRepositoryCard(repo) {
    const card = document.createElement("article");
    card.className = "repo-item";

    // Repository name and visibility
    const titleRow = document.createElement("div");
    titleRow.className = "repo-title-row";

    const nameLink = document.createElement("a");
    nameLink.className = "repo-name";
    nameLink.href = repo.html_url;
    nameLink.target = "_blank";
    nameLink.rel = "noopener noreferrer";
    nameLink.textContent = repo.name;

    const visibility = document.createElement("span");
    visibility.className = "repo-visibility";
    visibility.textContent = repo.fork ? "Fork" : "Public";

    titleRow.append(nameLink, visibility);

    // Repository description
    const description = document.createElement("p");
    description.className = "repo-description";

    if (repo.description) {
        description.textContent = repo.description;
    } else {
        description.textContent = "No description provided.";
        description.classList.add("empty");
    }

    // Repository metadata
    const meta = document.createElement("div");
    meta.className = "repo-meta";

    // Programming language
    if (repo.language) {
        const language = document.createElement("span");
        language.className = "repo-language";

        const dot = document.createElement("span");
        dot.className = "language-dot";
        dot.setAttribute("aria-hidden", "true");

        const languageName = document.createElement("span");
        languageName.textContent = repo.language;

        language.append(dot, languageName);
        meta.appendChild(language);
    }

    // Stars
    const stars = document.createElement("span");
    stars.className = "repo-meta-item";
    stars.textContent = `★ ${formatNumber(repo.stargazers_count)} stars`;

    // Forks
    const forks = document.createElement("span");
    forks.className = "repo-meta-item";
    forks.textContent = `⑂ ${formatNumber(repo.forks_count)} forks`;

    // Last updated
    const updated = document.createElement("span");
    updated.className = "repo-meta-item";
    updated.textContent = `Updated ${formatDate(repo.updated_at)}`;

    meta.append(stars, forks, updated);
    card.append(titleRow, description, meta);

    return card;
}

async function loadRepositories(username) {
    repositoriesSection.hidden = false;
    repoList.replaceChildren();
    repoCount.textContent = "Loading...";
    allReposLink.hidden = true;

    showRepoStatus("Loading repositories...");

    try {
        const response = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=6&type=owner`,
            {
                headers: {
                    Accept: "application/vnd.github+json"
                }
            }
        );

        if (response.status === 403 || response.status === 429) {
            throw new Error(
                "GitHub API rate limit reached. Please try again later."
            );
        }

        if (!response.ok) {
            throw new Error(
                `Unable to load repositories (HTTP ${response.status}).`
            );
        }

        const repositories = await response.json();

        hideRepoStatus();

        repoCount.textContent =
            `${repositories.length} ${repositories.length === 1 ? "repository" : "repositories"}`;

        if (repositories.length === 0) {
            showRepoStatus("This user has no public repositories to display.");
            return;
        }

        const fragment = document.createDocumentFragment();

        repositories.forEach((repo) => {
            fragment.appendChild(createRepositoryCard(repo));
        });

        repoList.appendChild(fragment);

        allReposLink.href = `https://github.com/${encodeURIComponent(username)}?tab=repositories`;
        allReposLink.hidden = false;

    } catch (error) {
        console.error("Repository loading failed:", error);

        repoCount.textContent = "Unavailable";

        showRepoStatus(
            error instanceof TypeError
                ? "Unable to connect to GitHub. Check your internet connection."
                : error.message || "Could not load repositories.",
            "error"
        );
    }
}


/* =========================
   5. Search GitHub profile
========================= */

async function searchGitHubUser(username) {
    hideStatus();
    profileCard.hidden = true;

    repositoriesSection.hidden = true;
    repoList.replaceChildren();
    hideRepoStatus();

    searchButton.disabled = true;
    searchButton.textContent = "Searching...";

    showStatus("Fetching GitHub profile...", "loading");

    try {
        const response = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}`,
            {
                headers: {
                    Accept: "application/vnd.github+json"
                }
            }
        );

        if (response.status === 404) {
            throw new Error(
                `No GitHub user found with the username "${username}".`
            );
        }

        if (response.status === 403 || response.status === 429) {
            throw new Error(
                "GitHub API rate limit reached. Please wait and try again."
            );
        }

        if (!response.ok) {
            throw new Error(
                `GitHub API error (${response.status}). Please try again later.`
            );
        }

        const user = await response.json();

        // Fill in profile information.
        avatar.src = user.avatar_url;
        avatar.alt = `Avatar of ${user.login}`;

        nameElement.textContent = displayValue(user.name);
        usernameElement.textContent = `@${user.login}`;
        bioElement.textContent = displayValue(user.bio);

        reposElement.textContent = formatNumber(user.public_repos);
        followersElement.textContent = formatNumber(user.followers);
        followingElement.textContent = formatNumber(user.following);

        locationElement.textContent = displayValue(user.location);
        companyElement.textContent = displayValue(user.company);

        displayWebsite(user.blog);

        createdAtElement.textContent = formatDate(user.created_at);
        profileLink.href = user.html_url;

        hideStatus();
        profileCard.hidden = false;

        // Load repositories for the same user.
        await loadRepositories(user.login);

    } catch (error) {
        console.error("GitHub profile search failed:", error);

        profileCard.hidden = true;
        repositoriesSection.hidden = true;

        showStatus(
            error instanceof TypeError
                ? "Unable to connect to GitHub. Check your internet connection and try again."
                : error.message || "Something went wrong. Please try again.",
            "error"
        );
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Search";
    }
}


/* =========================
   6. Search form
========================= */

if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();

        if (!username) {
            profileCard.hidden = true;
            repositoriesSection.hidden = true;

            showStatus("Please enter a GitHub username.", "error");
            usernameInput.focus();
            return;
        }

        searchGitHubUser(username);
    });
}


/* =========================
   7. Example usernames
========================= */

document.querySelectorAll(".example-username").forEach((button) => {
    button.addEventListener("click", () => {
        usernameInput.value = button.dataset.username;
        searchForm.requestSubmit();
    });
});
