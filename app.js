const API_KEY = "8493b0abb29d2e9505ec48c951c7b5cc";
const newCity = document.getElementById("new-city");
const suggestionsBox = document.getElementById("city-suggestions");
let pendingCityName = null;
let debounceTimer = null;
let drawChart = null
let colors = null;
let pinnedIndex = null;
let selectedIndex = 0;
let dailyData = null;
let chartData = null;
let timezoneOffset = null;
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
      61: "icons/rainy.svg", 
      63: "icons/rainy.svg", 
      65: "icons/rainy.svg",
      71: "icons/snowy.svg", 
      73: "icons/snowy.svg", 
      75: "icons/snowy.svg",
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
    51: "rainy", 53: "rainy", 55: "rainy",
    61: "rainy", 63: "rainy", 65: "rainy",
    71: "snowy", 73: "snowy", 75: "snowy",
    80: "rainy", 81: "rainy", 82: "rainy",
    85: "snowy", 86: "snowy",
    95: "stormy", 96: "stormy", 99: "stormy"
};

const weatherThemes = {
    3: "theme-cloudy", 45: "theme-cloudy", 48: "theme-cloudy",
    51: "theme-rainy", 53: "theme-rainy", 55: "theme-rainy",
    61: "theme-rainy", 63: "theme-rainy", 65: "theme-rainy",
    80: "theme-rainy", 81: "theme-rainy", 82: "theme-rainy",
    71: "theme-snowy", 73: "theme-snowy", 75: "theme-snowy",
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
    document.getElementById("weather-state").textContent = weatherDescriptions[dailyData.weathercode[index]];
    document.getElementById("weather-icon").src = weatherIcons[dailyData.weathercode[index]];
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
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min,uv_index_max,weathercode&timezone=auto`);
        const data = await response.json();
        return {daily:data.daily, chart:data.hourly}; 
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
        cards[i].innerHTML = `<span class="fc-day">${dayName.slice(0, 3)}</span><img src="${weatherIcons[daily.weathercode[i]]}" alt=""><span class="fc-temps"><span class="fc-high">${Math.round(daily.temperature_2m_max[i])}°</span><span class="fc-low">${Math.round(daily.temperature_2m_min[i])}°</span></span>`;
    });
}

async function getWeather(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        const {daily,chart} = await getForecast(lat, lon);

        if (data.cod != 200) {
            showToast("City not found");
            return;
        }

        newCity.value = "";
        if(pendingCityName){
        document.getElementById("city-name").textContent = pendingCityName;
        }
        else{
        document.getElementById("city-name").textContent = data.name + ", " + data.sys.country;
        }
        pendingCityName = null;

        sessionStorage.setItem("lat", lat);
        sessionStorage.setItem("lon", lon);

        dailyData = daily;
        chartData = chart;
        timezoneOffset = data.timezone;
        currentActualTemp = data.main.temp;
        currentHumidity = data.main.humidity;
        currentWindKmh = Math.round(data.wind.speed * 3.6);
        currentHourGlobal = new Date((Date.now() / 1000 + data.timezone) * 1000).getUTCHours();

        renderForecast(daily);
        renderDayCard(0);
    } catch (error) {
        showToast("Something went wrong");
}
}

function positionTooltip(chart, index) {
    const tooltipEl = document.getElementById("chart-tooltip");
    const meta = chart.getDatasetMeta(0);
    const bar = meta.data[index];
    if (!bar) return;

    document.getElementById("chart-tooltip-time").textContent = chart.data.labels[index];
    document.getElementById("chart-tooltip-temp").textContent = Math.round(chart.data.datasets[0].data[index]) + "°";

    const gap = 10;
    tooltipEl.style.left = chart.canvas.offsetLeft + bar.x + "px";
    tooltipEl.style.top = chart.canvas.offsetTop + bar.y - gap + "px";
    tooltipEl.classList.add("show");
}

function handleChartMouseMove(e) {
    if (!drawChart) return;
    const points = drawChart.getElementsAtEventForMode(e, "nearest", { intersect: false, axis: "x" }, false);
    if (points.length > 0) {
        positionTooltip(drawChart, points[0].index);
    } else if (pinnedIndex !== null) {
        positionTooltip(drawChart, pinnedIndex);
    } else {
        document.getElementById("chart-tooltip").classList.remove("show");
    }
}

function handleChartMouseLeave() {
    if (!drawChart) return;
    if (pinnedIndex !== null) {
        positionTooltip(drawChart, pinnedIndex);
    } else {
        document.getElementById("chart-tooltip").classList.remove("show");
    }
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
    colors = temps.map((_, i) => i === currentHour ? barColorActive : barColor);
    pinnedIndex = null;
    document.getElementById("chart-tooltip").classList.remove("show");
    if(drawChart){
        drawChart.destroy();
    }
    drawChart = new Chart(c, {
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
                callback: function(value, index) {
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
        onClick: function(event, elements) {
            if (elements.length > 0) {
                const index = elements[0].index;
                pinnedIndex = pinnedIndex === index ? null : index;
                colors = temps.map((_, i) => i === (pinnedIndex ?? currentHour) ? barColorActive : barColor);
                drawChart.data.datasets[0].backgroundColor = colors;
                drawChart.update();
                if (pinnedIndex !== null) {
                    positionTooltip(drawChart, pinnedIndex);
                } else {
                    document.getElementById("chart-tooltip").classList.remove("show");
                }
            }
        }
      }
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

document.querySelector(".forecast-sidebar").addEventListener("click", function(e) {
    const card = e.target.closest(".forecast-card");
    if (!card || !dailyData) return;
    const cards = Array.from(document.querySelectorAll(".forecast-card"));
    const index = cards.indexOf(card);
    renderDayCard(index);
});

let selectedLat = sessionStorage.getItem("lat");
let selectedLon = sessionStorage.getItem("lon");
if (selectedLat && selectedLon) {
    getWeather(selectedLat, selectedLon);
} else {
    getWeather(52.5244, 13.4105);
}