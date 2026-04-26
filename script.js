const API_KEY = "eca79db4515da30b5e5bf052c45ddd9f";   // ← Your key

let currentLat = 28.6139;  // Default: Delhi
let currentLon = 77.2090;

async function getWeather(lat, lon) {
    try {
        // 1. Current Weather
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const currentRes = await fetch(currentUrl);
        const currentData = await currentRes.json();

        // 2. 5-day / 3-hour Forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();

        if (currentData.cod !== 200) throw new Error("City not found");

        updateCurrentWeather(currentData);
        updateHourlyForecast(forecastData);
        updateDailyForecast(forecastData);
        updateBackground(currentData.weather[0].id);

    } catch (err) {
        console.error(err);
        alert("Failed to fetch weather data. Please check API key or internet.");
    }
}

function updateCurrentWeather(data) {
    const weather = data.weather[0];

    document.getElementById("city-name").textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById("temperature").textContent = Math.round(data.main.temp) + "°C";
    document.getElementById("description").textContent = weather.description;
    document.getElementById("feels-like").textContent = Math.round(data.main.feels_like) + "°C";
    document.getElementById("humidity").textContent = data.main.humidity + "%";
    document.getElementById("wind").textContent = Math.round(data.wind.speed * 3.6) + " km/h";

    document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;
}

function updateHourlyForecast(data) {
    const container = document.getElementById("hourly-forecast");
    container.innerHTML = "";

    // Take next 12 entries (every 3 hours)
    for (let i = 0; i < 12; i++) {
        const item = data.list[i];
        const time = new Date(item.dt * 1000);
        const hour = time.getHours().toString().padStart(2, '0');

        const div = document.createElement("div");
        div.className = `hour-card min-w-[110px] bg-white/10 rounded-2xl p-4 text-center`;
        div.innerHTML = `
            <p class="text-xs opacity-70">${hour}:00</p>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" 
                 class="mx-auto my-3 w-14 h-14">
            <p class="text-xl font-semibold">${Math.round(item.main.temp)}°C</p>
        `;
        container.appendChild(div);
    }
}

function updateDailyForecast(data) {
    const container = document.getElementById("daily-forecast");
    container.innerHTML = "";

    const dailyMap = new Map();

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyMap.has(date)) {
            dailyMap.set(date, {
                temp_max: item.main.temp_max || item.main.temp,
                temp_min: item.main.temp_min || item.main.temp,
                icon: item.weather[0].icon,
                description: item.weather[0].description
            });
        } else {
            const existing = dailyMap.get(date);
            existing.temp_max = Math.max(existing.temp_max, item.main.temp_max || item.main.temp);
            existing.temp_min = Math.min(existing.temp_min, item.main.temp_min || item.main.temp);
        }
    });

    const dailyArray = Array.from(dailyMap).slice(0, 7);

    dailyArray.forEach(([dateStr, day]) => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const div = document.createElement("div");
        div.className = `forecast-card bg-white/10 rounded-2xl p-5 text-center`;
        div.innerHTML = `
            <p class="font-medium">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" 
                 class="mx-auto my-4 w-16 h-16">
            <div class="flex justify-between text-sm">
                <span class="font-semibold">${Math.round(day.temp_max)}°</span>
                <span class="opacity-70">${Math.round(day.temp_min)}°</span>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateBackground(weatherId) {
    const body = document.getElementById("body");
    body.classList.remove("sunny", "cloudy", "rainy", "clear");

    if ([800, 801].includes(weatherId)) body.classList.add("sunny");
    else if ([802, 803, 804].includes(weatherId)) body.classList.add("cloudy");
    else if (weatherId >= 500 && weatherId < 600) body.classList.add("rainy");
    else body.classList.add("clear");
}

// Search by city name
async function searchCity() {
    const city = document.getElementById("city-input").value.trim();
    if (!city) return;

    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;
        const res = await fetch(geoUrl);
        const geoData = await res.json();

        if (geoData && geoData.length > 0) {
            currentLat = geoData[0].lat;
            currentLon = geoData[0].lon;
            document.getElementById("city-name").textContent = `${geoData[0].name}, ${geoData[0].country}`;
            getWeather(currentLat, currentLon);
        } else {
            alert("City not found. Try another name.");
        }
    } catch (e) {
        alert("Error searching city.");
    }
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                currentLat = pos.coords.latitude;
                currentLon = pos.coords.longitude;
                getWeather(currentLat, currentLon);
            },
            () => alert("Location permission denied. Using default location.")
        );
    }
}

// Initialize on page load
window.onload = () => {
    getWeather(currentLat, currentLon);
};