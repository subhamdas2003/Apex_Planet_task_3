// =========================
// Theme Toggle
// =========================
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

function applyTheme(theme) {
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  } else {
    root.removeAttribute("data-theme");
    themeToggle.textContent = "🌙";
  }
}

const savedTheme =
  localStorage.getItem("theme") ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("theme", next);
});

// =========================
// Background Change (Picsum for guaranteed refresh)
// =========================
const bgBtn = document.getElementById("bgBtn");
const body = document.body;

async function changeBackground() {
  try {
    const randomNum = Math.floor(Math.random() * 100000); // ensures unique image
    const imgUrl = `https://picsum.photos/1920/1080?random=${randomNum}`;

    // Fade out
    body.style.transition = "opacity 0.3s ease";
    body.style.opacity = "0.5";

    // Preload new image before showing
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => {
      body.style.backgroundImage = `url(${imgUrl})`;
      body.style.opacity = "1"; // Fade back in
    };
  } catch (e) {
    console.error("Error changing background:", e);
  }
}

bgBtn.addEventListener("click", changeBackground);
changeBackground(); // Load one initially

// =========================
// Weather (Open-Meteo)
// =========================
const getWeatherBtn = document.getElementById("getWeatherBtn");
const useGeoBtn = document.getElementById("useGeoBtn");
const cityInput = document.getElementById("cityInput");
const weatherLoading = document.getElementById("weatherLoading");
const weatherResult = document.getElementById("weatherResult");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const windEl = document.getElementById("wind");
const timeEl = document.getElementById("wtime");
const locEl = document.getElementById("wloc");
const iconEl = document.getElementById("weatherIcon");

async function fetchWeather(lat, lon, placeName = "") {
  weatherLoading.textContent = "Fetching weather...";
  weatherLoading.classList.remove("hidden");
  weatherResult.classList.add("hidden");

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    const data = await res.json();
    const w = data.current_weather;

    tempEl.textContent = `${Math.round(w.temperature)}°C`;
    descEl.textContent = `Code ${w.weathercode}`;
    windEl.textContent = `${w.windspeed} km/h`;
    timeEl.textContent = w.time.replace("T", " ");
    locEl.textContent = placeName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

    const codeIcons = {
      0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
      45: "🌫️", 48: "🌫️", 51: "🌦️", 61: "🌧️",
      71: "❄️", 95: "⛈️"
    };
    iconEl.textContent = codeIcons[w.weathercode] || "🌡️";

    weatherLoading.classList.add("hidden");
    weatherResult.classList.remove("hidden");
  } catch (err) {
    weatherLoading.textContent = "Unable to fetch weather.";
    console.error(err);
  }
}

async function fetchCoordsByCity(city) {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const loc = data.results[0];
      fetchWeather(loc.latitude, loc.longitude, `${loc.name}, ${loc.country}`);
    } else {
      weatherLoading.textContent = "City not found.";
    }
  } catch (e) {
    weatherLoading.textContent = "Error fetching location.";
  }
}

getWeatherBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchCoordsByCity(city);
  } else {
    alert("Please enter a city name or use My Location.");
  }
});

useGeoBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude, "Your Location");
      },
      () => {
        weatherLoading.textContent = "Location permission denied.";
      }
    );
  } else {
    weatherLoading.textContent = "Geolocation not supported.";
  }
});

// =========================
// Jokes + Text-to-Speech
// =========================
const jokeBtn = document.getElementById("jokeBtn");
const stopJokeBtn = document.getElementById("stopJokeBtn");
const jokeText = document.getElementById("jokeText");

async function tellJoke() {
  jokeText.textContent = "Loading joke...";
  try {
    const res = await fetch(`https://v2.jokeapi.dev/joke/Any?type=single,twopart`);
    const joke = await res.json();
    let fullJoke = "";

    if (joke.type === "single") {
      fullJoke = joke.joke;
    } else {
      fullJoke = `${joke.setup} ... ${joke.delivery}`;
    }

    jokeText.textContent = fullJoke;
    speak(fullJoke);
  } catch (err) {
    jokeText.textContent = "Could not fetch a joke.";
    console.error(err);
  }
}

function speak(text) {
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
}

jokeBtn.addEventListener("click", tellJoke);
stopJokeBtn.addEventListener("click", stopSpeaking);
