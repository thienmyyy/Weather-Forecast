const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city");
const suggestionsBox = document.getElementById("city-suggestions");

searchBtn.addEventListener("click", function(){
    let city = cityInput.value.trim();
    if(!city) alert("Type in a city");
    else{
    sessionStorage.setItem("city", city);
    window.location.href = "index.html";
    }
});

