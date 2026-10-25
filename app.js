const newCity = document.getElementById("new-city");
const suggestionsBox = document.getElementById("city-suggestions");
let hourlyChart = null;
let pinnedIndex = null;
let liveHourIndex = null;
let selectedIndex = 0;
let dailyData = null;
let chartData = null;
let latestWeatherRequest = 0;
let latestSearch = 0;
let currentActualTemp = null;
let currentHumidity = null;
let currentWindKmh = null;
let currentHourGlobal = null;
 const weatherIcons = {
      0: "icons/sunny.svg",
      1: "icons/sunny.svg",
      2: "icons/partly-cloudy.svg",
      3: "icons/cloudy.svg",
      45: "icons/cloudy.svg",
      48: "icons/cloudy.svg",
      51: "icons/rainy.svg", 
      53: "icons/rainy.svg", 
      55: "icons/rainy.svg",
      56: "icons/rainy.svg",
      57: "icons/rainy.svg",
      61: "icons/rainy.svg",
      63: "icons/rainy.svg",
      65: "icons/rainy.svg",
      66: "icons/rainy.svg",
      67: "icons/rainy.svg",
      71: "icons/snowy.svg",
      73: "icons/snowy.svg",
      75: "icons/snowy.svg",
      77: "icons/snowy.svg",
      80: "icons/rainy.svg", 
      81: "icons/rainy.svg", 
      82: "icons/rainy.svg",
      85: "icons/snowy.svg", 
      86: "icons/snowy.svg",
      95: "icons/stormy.svg",
      96: "icons/stormy.svg",
      99: "icons/stormy.svg"
  };

const weatherDescriptions = {
    0: "sunny", 1: "sunny", 2: "partly cloudy", 3: "cloudy", 45: "cloudy", 48: "cloudy",
    51: "rainy", 53: "rainy", 55: "rainy", 56: "rainy", 57: "rainy",
    61: "rainy", 63: "rainy", 65: "rainy", 66: "rainy", 67: "rainy",
    71: "snowy", 73: "snowy", 75: "snowy", 77: "snowy",
    80: "rainy", 81: "rainy", 82: "rainy",
    85: "snowy", 86: "snowy",
    95: "stormy", 96: "stormy", 99: "stormy"
};

function getIcon(code) {
    return weatherIcons[code] || "icons/cloudy.svg";
}

function getDescription(code) {
    return weatherDescriptions[code] || "unknown";
}

const weatherThemes = {
    3: "theme-cloudy", 45: "theme-cloudy", 48: "theme-cloudy",
    51: "theme-rainy", 53: "theme-rainy", 55: "theme-rainy", 56: "theme-rainy", 57: "theme-rainy",
    61: "theme-rainy", 63: "theme-rainy", 65: "theme-rainy", 66: "theme-rainy", 67: "theme-rainy",
    80: "theme-rainy", 81: "theme-rainy", 82: "theme-rainy",
    71: "theme-snowy", 73: "theme-snowy", 75: "theme-snowy", 77: "theme-snowy",
    85: "theme-snowy", 86: "theme-snowy",
    95: "theme-stormy", 96: "theme-stormy", 99: "theme-stormy",
    2: "theme-partly-cloudy"
};

function setWeatherTheme(weathercode) {
    document.body.classList.remove("theme-rainy", "theme-cloudy", "theme-snowy", "theme-stormy", "theme-partly-cloudy");
    const theme = weatherThemes[weathercode];
    if (theme) {
        document.body.classList.add(theme);
    }
}

function renderDayCard(index) {
    selectedIndex = index;
    setWeatherTheme(dailyData.weathercode[index]);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const date = new Date(dailyData.time[index]);
    const weekday = dayNames[date.getUTCDay()];
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const formattedDate = day + "." + month + "." + year;

    document.getElementById("date").textContent = index === 0 ? "today, " + formattedDate : weekday.slice(0, 3) + ", " + formattedDate;
    document.getElementById("week-day").textContent = weekday;
    const description = getDescription(dailyData.weathercode[index]);
    document.getElementById("weather-state").textContent = description;
    const weatherIconEl = document.getElementById("weather-icon");
    weatherIconEl.src = getIcon(dailyData.weathercode[index]);
    weatherIconEl.alt = description;
    document.getElementById("max-temp").textContent = Math.round(dailyData.temperature_2m_max[index]) + "°";
    document.getElementById("min-temp").textContent = Math.round(dailyData.temperature_2m_min[index]) + "°";
    document.getElementById("uv-index-value").textContent = Math.round(dailyData.uv_index_max[index]);

    const currentTempEl = document.getElementById("current-temp");
    document.getElementById("max-temp").classList.toggle("headline", index !== 0);
    if (index === 0) {
        currentTempEl.style.display = "";
        currentTempEl.textContent = Math.round(currentActualTemp) + "°C";
        document.getElementById("humidity-value").textContent = currentHumidity + "%";
        document.getElementById("wind-value").textContent = currentWindKmh + " km/h";
    } else {
        currentTempEl.style.display = "none";
        document.getElementById("humidity-value").textContent = "–";
        document.getElementById("wind-value").textContent = "–";
    }

    document.querySelectorAll(".forecast-card").forEach((card, i) => {
        card.classList.toggle("selected", i === index);
    });

    const dayHours = chartData.time.slice(index * 24, index * 24 + 24);
    const dayTemps = chartData.temperature_2m.slice(index * 24, index * 24 + 24);
    renderChart({ time: dayHours, temperature_2m: dayTemps }, index === 0 ? currentHourGlobal : null);
}

function onCitySelected(city) {
    suggestions.hide();
    newCity.value = "";
    getWeather(city.lat, city.lon, cityLabel(city));
}

const suggestions = createSuggestionsList(suggestionsBox, onCitySelected);

async function searchCity(query) {
    if (!query) return;
    const searchId = ++latestSearch;
    try {
        const unique = await geocodeCity(query);
        if (searchId !== latestSearch) return;
        suggestions.show(unique);
    } catch (error) {
        showToast("Something went wrong");
    }
}

async function getForecast(lat, lon) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min,uv_index_max,weathercode&timezone=auto`);
        if (!response.ok) throw new Error(`Forecast failed: ${response.status}`);
        const data = await response.json();
        return {daily: data.daily, chart: data.hourly, current: data.current};
    } catch (error) {
        showToast("Something went wrong");
    }
}

function renderForecast(daily) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const cards= document.querySelectorAll(".forecast-card");

    daily.time.forEach((time, i) => {
        if (!cards[i]) return;
        const date = new Date(time);
        const dayName = dayNames[date.getUTCDay()];
        const code = daily.weathercode[i];

        const day = document.createElement("span");
        day.className = "fc-day";
        day.textContent = dayName.slice(0, 3);

        const icon = document.createElement("img");
        icon.src = getIcon(code);
        icon.alt = getDescription(code);

        const high = document.createElement("span");
        high.className = "fc-high";
        high.textContent = Math.round(daily.temperature_2m_max[i]) + "°";

        const low = document.createElement("span");
        low.className = "fc-low";
        low.textContent = Math.round(daily.temperature_2m_min[i]) + "°";

        const temps = document.createElement("span");
        temps.className = "fc-temps";
        temps.append(high, low);

        cards[i].replaceChildren(day, icon, temps);
    });
}

async function getWeather(lat, lon, label) {
    const requestId = ++latestWeatherRequest;
    document.body.classList.add("loading");
    try {
        const forecast = await getForecast(lat, lon);
        if (!forecast || requestId !== latestWeatherRequest) return;
        const {daily, chart, current} = forecast;

        newCity.value = "";
        document.getElementById("city-name").textContent = label;

        sessionStorage.setItem("lat", lat);
        sessionStorage.setItem("lon", lon);
        sessionStorage.setItem("name", label);

        dailyData = daily;
        chartData = chart;
        currentActualTemp = current.temperature_2m;
        currentHumidity = current.relative_humidity_2m;
        currentWindKmh = Math.round(current.wind_speed_10m);
        currentHourGlobal = Number(current.time.slice(11, 13));

        renderForecast(daily);
        renderDayCard(0);
    } catch (error) {
        showToast("Something went wrong");
    } finally {
        if (requestId === latestWeatherRequest) {
            document.body.classList.remove("loading");
        }
    }
}

function positionTooltip(chart, index, live) {
    const tooltipEl = document.getElementById("chart-tooltip");
    const meta = chart.getDatasetMeta(0);
    const bar = meta.data[index];
    if (!bar) return;

    document.getElementById("chart-tooltip-time").textContent = live ? "now" : chart.data.labels[index];
    document.getElementById("chart-tooltip-temp").textContent = live
        ? Math.round(currentActualTemp) + "°"
        : Math.round(chart.data.datasets[0].data[index]) + "°";

    const gap = 10;
    tooltipEl.style.left = chart.canvas.offsetLeft + bar.x + "px";
    tooltipEl.style.top = chart.canvas.offsetTop + bar.y - gap + "px";
    tooltipEl.classList.add("show");
}

// what the tooltip shows when nothing is hovered: the pinned bar, else "now" (today only)
function showDefaultTooltip() {
    if (!hourlyChart) return;
    if (pinnedIndex !== null) {
        positionTooltip(hourlyChart, pinnedIndex);
    } else if (liveHourIndex !== null) {
        positionTooltip(hourlyChart, liveHourIndex, true);
    } else {
        document.getElementById("chart-tooltip").classList.remove("show");
    }
}

function handleChartMouseMove(e) {
    if (!hourlyChart) return;
    const points = hourlyChart.getElementsAtEventForMode(e, "nearest", { intersect: false, axis: "x" }, false);
    if (points.length > 0) {
        positionTooltip(hourlyChart, points[0].index);
    } else {
        showDefaultTooltip();
    }
}

function handleChartMouseLeave() {
    showDefaultTooltip();
}

document.getElementById("temp-chart").addEventListener("mousemove", handleChartMouseMove);
document.getElementById("temp-chart").addEventListener("mouseleave", handleChartMouseLeave);

function getThemeColor(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function renderChart(chart, currentHour){
    const labels = chart.time.slice(0, 24);
    const time = labels.map(word => word.slice(11));
    const temps = chart.temperature_2m.slice(0, 24);
    let tempChart = document.getElementById("temp-chart");
    let c = tempChart.getContext("2d");
    const barColor = getThemeColor("--bar-color");
    const barColorActive = getThemeColor("--bar-color-active");
    let colors = temps.map((_, i) => i === currentHour ? barColorActive : barColor);
    pinnedIndex = null;
    liveHourIndex = currentHour;
    let firstDraw = true;
    const minTemp = Math.round(Math.min(...temps));
    const maxTemp = Math.round(Math.max(...temps));
    tempChart.setAttribute("role", "img");
    tempChart.setAttribute("aria-label", `Hourly temperatures for ${labels[0].slice(0, 10)}, from ${minTemp}° to ${maxTemp}°`);
    document.getElementById("chart-tooltip").classList.remove("show");
    if(hourlyChart){
        hourlyChart.destroy();
    }
    hourlyChart = new Chart(c, {
      type: "bar",
      data: {
          labels: time,
          datasets: [{
            label: "Temperature (°C)",
            data: temps,
            backgroundColor: colors,
            borderRadius: 8,
            barPercentage: 0.5,
            hoverBackgroundColor: getThemeColor("--bar-color-hover")
          }]
      },
      options: {
        animation: {
            // show the "now" tooltip once the bars have finished growing, so it sits at the right height
            onComplete: function() {
                if (firstDraw) {
                    firstDraw = false;
                    showDefaultTooltip();
                }
            }
        },
        scales: {
        y: {
            border:{
                dash: function(context){
                    return context.tick.value === 0 ? [] : [8, 10];
                }
            },
            ticks: {
                font: {
                    family: "Geist Mono"
                },
                callback: function(value){
                    return value +"°";
                 },
                 stepSize: 5
            }
        },
        x: {
            ticks: {
                callback: function(_, index) {
                return index % 6 === 0 ? time[index] : null;
                },
                font: {
                    family: "Geist Mono"
                }
            },
            grid: {
                display: false
            }
        },
        },
        plugins: {
            legend: {
                display: false

            },
            tooltip: {
                enabled: false
  }
        },
        onClick: function(_, elements) {
            if (elements.length > 0) {
                const index = elements[0].index;
                pinnedIndex = pinnedIndex === index ? null : index;
                colors = temps.map((_, i) => i === (pinnedIndex ?? currentHour) ? barColorActive : barColor);
                hourlyChart.data.datasets[0].backgroundColor = colors;
                hourlyChart.update();
                if (pinnedIndex !== null) {
                    positionTooltip(hourlyChart, pinnedIndex);
                } else {
                    document.getElementById("chart-tooltip").classList.remove("show");
                }
            }
        }
      }
  });
}

const debouncedSearch = debounce(searchCity, 300);
setupCityInput(newCity, suggestions, onCitySelected, debouncedSearch);

newCity.addEventListener("input", function() {
    if (newCity.value.trim() == ""){
        debouncedSearch.cancel();
        suggestions.hide();
    }
    else{
        debouncedSearch(newCity.value.trim());
    }
});

document.addEventListener("click", function(e) {
    if (!e.target.closest(".search-wrapper")) {
        suggestions.hide();
    }
});

document.querySelector(".forecast-sidebar").addEventListener("click", function(e) {
    const card = e.target.closest(".forecast-card");
    if (!card || !dailyData) return;
    const cards = Array.from(document.querySelectorAll(".forecast-card"));
    const index = cards.indexOf(card);
    renderDayCard(index);
});

document.querySelector(".forecast-sidebar").addEventListener("keydown", function(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".forecast-card");
    if (!card || !dailyData) return;
    e.preventDefault();
    const cards = Array.from(document.querySelectorAll(".forecast-card"));
    renderDayCard(cards.indexOf(card));
});

const savedLat = sessionStorage.getItem("lat");
const savedLon = sessionStorage.getItem("lon");
if (savedLat && savedLon) {
    getWeather(savedLat, savedLon, sessionStorage.getItem("name") || "Berlin, DE");
} else {
    getWeather(52.5244, 13.4105, "Berlin, DE");
}