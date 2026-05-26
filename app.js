async function getWeather(){
    const response = await fetch("https://api.openweathermap.org/data/2.5/weather?q=Berlin&units=metric&appid=8493b0abb29d2e9505ec48c951c7b5cc");
  const data = await response.json();
  console.log(data);

document.getElementById("city-name").textContent= data.name + ", " + data.sys.country;
document.getElementById("weather-state").textContent= data.weather[0].description;
document.getElementById("max-temp").textContent= data.main.temp_max +"°";
document.getElementById("min-temp").textContent= data.main.temp_min+"°";
//document.getElementById("weather-icon").textContent= data.weather[0].icon;
document.getElementById("humidity-value").textContent= data.main.humidity +"%";

}

getWeather();

const forecast = [ 
    {day: "Mon", icon:"sunny", high: 23, low: 11 },
    {day: "Tue", icon:"partly-cloudy", high: 18, low: 12},
    {day: "Wed", icon:"rainy", high: 18, low: 12},
    {day: "Thu", icon:"snowy", high: 18, low: 12},
    {day: "Fri", icon:"stromy", high: 18, low: 12},
    {day: "Sat", icon:"windy", high: 18, low: 12},
    {day: "Sun", icon:"cloudy", high: 18, low: 12}
];

