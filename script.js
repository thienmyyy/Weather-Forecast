const searchBtn = document.getElementById("search-btn");
const suggestionsBox = document.getElementById("city-suggestions");
const cityInput = document.getElementById("city");
let selectedCity = null;
let latestSearch = 0;

function goToCity(city) {
    sessionStorage.setItem("lat", city.lat);
    sessionStorage.setItem("lon", city.lon);
    window.location.href = "index.html";
}

function onCitySelected(city) {
    selectedCity = city;
    cityInput.value = cityLabel(city);
    suggestions.hide();
}

const suggestions = createSuggestionsList(suggestionsBox, onCitySelected);

searchBtn.addEventListener("click", async function () {
    const query = cityInput.value.trim();
    if (!query) {
        showToast("Please type a city name");
        return;
    }
    debouncedSearch.cancel();
    try {
        const city = selectedCity || await findFirstCity(query);
        if (!city) {
            showToast("City not found");
            return;
        }
        goToCity(city);
    } catch (error) {
        showToast("Something went wrong");
    }
});

async function searchCity(query) {
    if (!query || query.length < 3) return;
    const searchId = ++latestSearch;
    try {
        const unique = await geocodeCity(query);
        if (searchId !== latestSearch) return;
        suggestions.show(unique);
    } catch (error) {
        showToast("Something went wrong");
    }
}

const debouncedSearch = debounce(searchCity, 300);

// runs before setupCityInput's handler: a city already chosen wins over a new lookup
cityInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && selectedCity) {
        e.stopImmediatePropagation();
        goToCity(selectedCity);
    }
});
setupCityInput(cityInput, suggestions, goToCity, debouncedSearch);

cityInput.addEventListener("input", function () {
    selectedCity = null;
    if (cityInput.value.trim() === "") {
        debouncedSearch.cancel();
        suggestions.hide();
    } else {
        debouncedSearch(cityInput.value.trim());
    }
});
