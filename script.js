const API_KEY = "8493b0abb29d2e9505ec48c951c7b5cc";
const searchBtn = document.getElementById("search-btn");
const suggestionsBox = document.getElementById("city-suggestions");
const cityInput = document.getElementById("city");
let debounceTimer = null;
let selectedLat = null;
let selectedLon = null;

searchBtn.addEventListener("click", function(){
    if(!selectedLat){
        alert("Please select a city from the list");
    }
    else{
        sessionStorage.setItem("lat", selectedLat);
        sessionStorage.setItem("lon", selectedLon)
        window.location.href = "index.html";
    }
});

cityInput.addEventListener("input", function(){
    clearTimeout(debounceTimer);
    selectedLat = null;
    selectedLon = null;
    if (cityInput.value.trim() == ""){
        hideSuggestions();
    }
    else{
    debounceTimer = setTimeout(() => (searchCity(cityInput.value.trim())), 300);
    }
});

async function searchCity(query){
   if (!query) return;
   if(query.length < 3) return;
    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
        const results = await response.json();

        if (results.length === 0) {
            return;
        }
        else{
        const unique = results.filter((city, index) => {
            return results.findIndex(c => c.name === city.name && c.country === city.country) === index;
               });
        showSuggestions(unique);
    }
}
     catch (error) {
        alert("Something went wrong");
    }
}

function showSuggestions(cities){
    suggestionsBox.innerHTML = "";
    cities.forEach(city => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        if (city.state) {
            item.textContent = city.name + ", " + city.state + ", " + city.country;
        } else {
            item.textContent = city.name + ", " + city.country;
        }
        item.addEventListener("click", function(){
            selectedLat = city.lat;
            selectedLon = city.lon;
            cityInput.value = item.textContent;
            
            hideSuggestions();
        });
        suggestionsBox.appendChild(item);
    });
    suggestionsBox.style.display = "block";
}

function hideSuggestions(){
    suggestionsBox.style.display = "none";
    suggestionsBox.innerHTML = "";
}
