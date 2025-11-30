document.getElementById("btnSearch").addEventListener("click", searchGoSearch);
document.getElementById("search").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchGoSearch();
});
document.getElementById("search").addEventListener("input", getSuggestions);

let recognition;
if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
}

document.getElementById("btnMic").addEventListener("click", () => {
    if (!recognition) alert("Voice search not supported in this browser.");
    recognition.start();
});

if (recognition) {
    recognition.onresult = (event) => {
        document.getElementById("search").value = event.results[0][0].transcript;
        searchGoSearch();
    };
}

function searchGoSearch() {
    let query = document.getElementById("search").value.trim();
    let resultsDiv = document.getElementById("results");
    let loading = document.getElementById("loading");
    let suggestions = document.getElementById("suggestions");

    if (!query) {
        resultsDiv.innerHTML = "<p class='error'>Please enter a search query.</p>";
        return;
    }

    resultsDiv.innerHTML = "";
    suggestions.innerHTML = "";
    loading.classList.remove("hidden");

    let apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => displayResults(data))
        .catch(() => resultsDiv.innerHTML = "<p class='error'>⚠ Failed to fetch results. Try again later.</p>")
        .finally(() => loading.classList.add("hidden"));
}

function displayResults(data) {
    let resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (data.AbstractText) {
        addResult(data.Heading, data.AbstractText, data.AbstractURL, data.Image);
        return;
    }

    if (data.RelatedTopics.length > 0) {
        data.RelatedTopics.forEach(item => {
            if (item.Text && item.FirstURL) {
                addResult(null, item.Text, item.FirstURL, item.Icon?.URL);
            }
        });
        return;
    }

    resultsDiv.innerHTML = "<p>No results found.</p>";
}

function addResult(title, text, url, icon) {
    let resultsDiv = document.getElementById("results");

    const result = document.createElement("div");
    result.classList.add("result");

    result.innerHTML = `
        ${icon ? `<img src="${icon}" alt="" class="icon">` : ""}
        ${title ? `<h2>${sanitize(title)}</h2>` : ""}
        <p>${sanitize(text)}</p>
        <a href="${url}" target="_blank">${url}</a>
    `;

    resultsDiv.appendChild(result);
}

// Auto suggestions
function getSuggestions() {
    let query = document.getElementById("search").value.trim();
    let suggestions = document.getElementById("suggestions");

    if (query.length < 2) {
        suggestions.innerHTML = "";
        return;
    }

    let apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            suggestions.innerHTML = "";
            if (data.RelatedTopics.length > 0) {
                data.RelatedTopics.slice(0, 6).forEach(item => {
                    if (item.Text) {
                        let li = document.createElement("li");
                        li.textContent = item.Text;
                        li.onclick = () => {
                            document.getElementById("search").value = item.Text;
                            suggestions.innerHTML = "";
                            searchGoSearch();
                        };
                        suggestions.appendChild(li);
                    }
                });
            }
        });
}

// Dark/Light theme toggle
const themeButton = document.getElementById("themeToggle");
themeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeButton.textContent = document.body.classList.contains("dark") ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// Prevent malicious injection
function sanitize(str) {
    return str.replace(/[&<>"']/g, c => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[c]));
}


