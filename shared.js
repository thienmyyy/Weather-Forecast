function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

function cityLabel(city) {
    return city.admin1
        ? `${city.name}, ${city.admin1}, ${city.country_code}`
        : `${city.name}, ${city.country_code}`;
}

async function geocodeCity(query) {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en`);
    if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
    const data = await response.json();
    // no matches: the API omits "results". Keep only towns/cities (PPL*), not glaciers, islands or countries
    const places = (data.results || [])
        .filter(c => c.feature_code && c.feature_code.startsWith("PPL"))
        .map(c => ({ name: c.name, admin1: c.admin1, country_code: c.country_code, lat: c.latitude, lon: c.longitude }));
    return places
        .filter((c, i) => places.findIndex(p => p.name === c.name && p.country_code === c.country_code && p.admin1 === c.admin1) === i)
        .slice(0, 5);
}

function createSuggestionsList(box, onSelect) {
    let cities = [];
    let activeIndex = -1;

    function setActive(index) {
        activeIndex = index;
        box.querySelectorAll(".suggestion-item").forEach((el, i) => {
            el.classList.toggle("active", i === index);
            el.setAttribute("aria-selected", i === index);
        });
    }

    function show(list) {
        cities = list;
        activeIndex = -1;
        box.innerHTML = "";
        box.setAttribute("role", "listbox");
        if (list.length === 0) {
            const empty = document.createElement("div");
            empty.className = "suggestion-empty";
            empty.textContent = "No cities found";
            box.appendChild(empty);
        }
        list.forEach(city => {
            const item = document.createElement("div");
            item.className = "suggestion-item";
            item.textContent = cityLabel(city);
            item.setAttribute("role", "option");
            item.tabIndex = 0;
            item.addEventListener("click", () => onSelect(city));
            item.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(city);
                }
            });
            box.appendChild(item);
        });
        box.style.display = "block";
        if (list.length) setActive(0);
    }

    function move(delta) {
        if (cities.length === 0) return;
        setActive((activeIndex + delta + cities.length) % cities.length);
    }

    function getActive() {
        return cities[activeIndex] || null;
    }

    function hide() {
        box.style.display = "none";
        box.innerHTML = "";
        cities = [];
        activeIndex = -1;
    }

    return { show, hide, move, getActive };
}

async function findFirstCity(query) {
    const results = await geocodeCity(query);
    return results[0] || null;
}

// Wires ↑ ↓ Enter Esc on a city input. onSubmit(city) receives the highlighted
// suggestion, or the best match for whatever is typed.
function setupCityInput(input, list, onSubmit, debouncedSearch) {
    input.addEventListener("keydown", async (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            list.move(1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            list.move(-1);
        } else if (e.key === "Escape") {
            list.hide();
        } else if (e.key === "Enter") {
            e.preventDefault();
            const query = input.value.trim();
            if (!query) return;
            if (debouncedSearch) debouncedSearch.cancel();
            try {
                const city = list.getActive() || await findFirstCity(query);
                if (!city) {
                    showToast("City not found");
                    return;
                }
                onSubmit(city);
            } catch (error) {
                showToast("Something went wrong");
            }
        }
    });
}

function debounce(fn, delay) {
    let timer = null;
    function debounced(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    }
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
}
