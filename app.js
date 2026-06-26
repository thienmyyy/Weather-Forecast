const API_KEY = "8493b0abb29d2e9505ec48c951c7b5cc";
const newCity = document.getElementById("new-city");
const suggestionsBox = document.getElementById("city-suggestions");
let pendingCityName = null;
let debounceTimer = null;

const forecast = [
  {day: "Mon", icon:"sunny", high: 23, low: 11 },
  {day: "Tue", icon:"partly-cloudy", high: 18, low: 12},
  {day: "Wed", icon:"rainy", high: 18, low: 12},
  {day: "Thu", icon:"snowy", high: 18, low: 12},
  {day: "Fri", icon:"stromy", high: 18, low: 12},
  {day: "Sat", icon:"windy", high: 18, low: 12},
  {day: "Sun", icon:"cloudy", high: 18, low: 12}
];

function formatLocalDate(dt, offset) {
    const date = new Date((offset + dt) * 1000);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    document.getElementById("date").textContent = "today, " + day + "." + month + "." + year;
}

function getWeekday(dt, offset) {
    const date = new Date((offset + dt) * 1000);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    document.getElementById("week-day").textContent = days[date.getUTCDay()];
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

function showSuggestions(cities) {
    suggestionsBox.innerHTML = "";
    cities.forEach(city => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        if (city.state) {
            item.textContent = city.name + ", " + city.state + ", " + city.country;
        } else {
            item.textContent = city.name + ", " + city.country;
        }
        item.addEventListener("click", () => {
            hideSuggestions();
            newCity.value = "";
            pendingCityName = city.name + ", " + city.country;
            selectedLat = city.lat;
            selectedLon = city.lon;
            getWeather(selectedLat, selectedLon);
        });
        suggestionsBox.appendChild(item);
    });
    suggestionsBox.style.display = "block";
}

function hideSuggestions() {
    suggestionsBox.style.display = "none";
    suggestionsBox.innerHTML = "";
}

async function searchCity(query) {
    if (!query) return;
    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
        const results = await response.json();

        if (results.length === 0) {
            return;
        }

        const unique = results.filter((city, index) => {
            return results.findIndex(c => c.name === city.name && c.country === city.country) === index;
        });

        if (unique.length === 1) {
            getWeather(unique[0].lat, unique[0].lon);
            return;
        }

        showSuggestions(unique);
    } catch (error) {
        showToast("Something went wrong");
    }
}

async function getForecast(lat, lon) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
        const data = await response.json();
        return data.daily;
    } catch (error) {
        showToast("Something went wrong");
    }
}

async function getWeather(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        const data = await response.json();

        if (data.cod != 200) {
            showToast("City not found");
            return;
        }

        newCity.value = "";
        formatLocalDate(data.dt, data.timezone);
        getWeekday(data.dt, data.timezone);
        if(pendingCityName){
        document.getElementById("city-name").textContent = pendingCityName;
        } 
        else{
        document.getElementById("city-name").textContent = data.name + ", " + data.sys.country;
        }
        pendingCityName = null;
        document.getElementById("weather-state").textContent = data.weather[0].description;
        document.getElementById("current-temp").textContent = data.main.temp + " °C";
        document.getElementById("max-temp").textContent = data.main.temp_max + " °";
        document.getElementById("min-temp").textContent = data.main.temp_min + " °";
        document.getElementById("humidity-value").textContent = data.main.humidity + "%";
        document.getElementById("wind-value").textContent = Math.round(data.wind.speed * 3.6) + " km/h";

        const daily = await getForecast(lat, lon);
        renderForecast(daily);
    } catch (error) {
        showToast("Something went wrong");

}
}

function renderForecast (daily){
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const cards = document.querySelectorAll(".forecast-card");

    daily.time.forEach((time, i) => {
    if (!cards[i]) return;
    const date = new Date(time);
    const dayName = dayNames[date.getUTCDay()];
    cards[i].textContent = dayName;
    }); 

}

newCity.addEventListener("input", function(e) {
    clearTimeout(debounceTimer);
    if (newCity.value.trim() == ""){
        selectedLat = null;
        selectedLon = null;
        hideSuggestions();
    }
    else{
    debounceTimer = setTimeout(() => (searchCity(newCity.value.trim())), 300);
    }
});

document.addEventListener("click", function(e) {
    if (!e.target.closest(".search-wrapper")) {
        hideSuggestions();
    }
});

let selectedLat = sessionStorage.getItem("lat");
let selectedLon = sessionStorage.getItem("lon");
if (selectedLat && selectedLon) {
    sessionStorage.removeItem("lat");
    sessionStorage.removeItem("lon");
    getWeather(selectedLat, selectedLon);
} else {
    getWeather(52.5244, 13.4105);
}