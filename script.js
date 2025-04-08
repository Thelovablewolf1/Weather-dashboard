document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('search-btn');
    const locationBtn = document.getElementById('location-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const celsiusBtn = document.getElementById('celsius');
    const fahrenheitBtn = document.getElementById('fahrenheit');
    
    // Weather display elements
    const cityName = document.getElementById('city-name');
    const currentDate = document.getElementById('current-date');
    const currentTemp = document.getElementById('current-temp');
    const weatherIcon = document.getElementById('weather-icon');
    const weatherDesc = document.getElementById('weather-description');
    const windSpeed = document.getElementById('wind-speed');
    const humidity = document.getElementById('humidity');
    const pressure = document.getElementById('pressure');
    const forecastContainer = document.getElementById('forecast');
    
    // API Key - Replace with your actual OpenWeatherMap API key
    const apiKey = '0bde6bd415d04694922131412250804'; // Get one from https://openweathermap.org/api
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';
    
    // Event Listeners
    searchBtn.addEventListener('click', () => fetchWeather(locationInput.value));
    locationBtn.addEventListener('click', getLocationWeather);
    themeToggle.addEventListener('change', toggleTheme);
    celsiusBtn.addEventListener('click', () => toggleUnit('celsius'));
    fahrenheitBtn.addEventListener('click', () => toggleUnit('fahrenheit'));
    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchWeather(locationInput.value);
    });
    
    // Initial load - default location (London)
    fetchWeather('London');
    
    // Functions
    function toggleTheme() {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
    
    function toggleUnit(unit) {
        if (unit === 'celsius' && !celsiusBtn.classList.contains('active')) {
            celsiusBtn.classList.add('active');
            fahrenheitBtn.classList.remove('active');
            // Convert temperatures to Celsius
            updateTemperatures('metric');
        } else if (unit === 'fahrenheit' && !fahrenheitBtn.classList.contains('active')) {
            fahrenheitBtn.classList.add('active');
            celsiusBtn.classList.remove('active');
            // Convert temperatures to Fahrenheit
            updateTemperatures('imperial');
        }
    }
    
    function updateTemperatures(unit) {
        // This would be more efficient if we stored the original data
        // For simplicity, we'll re-fetch with the new unit
        if (cityName.textContent !== '--') {
            fetchWeather(cityName.textContent, unit === 'imperial');
        }
    }
    
    function getLocationWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    fetchWeatherByCoords(lat, lon);
                },
                (error) => {
                    alert('Unable to retrieve your location. Please enable location services or search manually.');
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser. Please search manually.');
        }
    }
    
    function fetchWeather(location, useFahrenheit = false) {
        if (!location) return;
        
        const unit = useFahrenheit ? 'imperial' : 'metric';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${unit}&appid=${apiKey}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('City not found');
                return response.json();
            })
            .then(data => {
                displayCurrentWeather(data, unit);
                // Fetch forecast data
                return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=${unit}&appid=${apiKey}`);
            })
            .then(response => {
                if (!response.ok) throw new Error('Forecast not available');
                return response.json();
            })
            .then(data => displayForecast(data, unit))
            .catch(error => {
                console.error('Error fetching weather data:', error);
                alert('Error fetching weather data. Please check the city name and try again.');
            });
    }
    
    function fetchWeatherByCoords(lat, lon, useFahrenheit = false) {
        const unit = useFahrenheit ? 'imperial' : 'metric';
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Location not found');
                return response.json();
            })
            .then(data => {
                displayCurrentWeather(data, unit);
                // Fetch forecast data
                return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`);
            })
            .then(response => {
                if (!response.ok) throw new Error('Forecast not available');
                return response.json();
            })
            .then(data => displayForecast(data, unit))
            .catch(error => {
                console.error('Error fetching weather data:', error);
                alert('Error fetching weather data for your location.');
            });
    }
    
    function displayCurrentWeather(data, unit) {
        cityName.textContent = `${data.name}, ${data.sys.country}`;
        
        const now = new Date();
        currentDate.textContent = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        currentTemp.textContent = Math.round(data.main.temp);
        weatherDesc.textContent = data.weather[0].description;
        
        // Set weather icon
        const iconClass = getWeatherIcon(data.weather[0].id, data.weather[0].icon);
        weatherIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
        
        // Set other details
        windSpeed.textContent = unit === 'imperial' ? 
            `${Math.round(data.wind.speed)} mph` : 
            `${Math.round(data.wind.speed * 3.6)} km/h`;
        
        humidity.textContent = `${data.main.humidity}%`;
        pressure.textContent = `${data.main.pressure} hPa`;
    }
    
    function displayForecast(data, unit) {
        forecastContainer.innerHTML = '';
        
        // Group forecast by day
        const dailyForecast = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    temp_max: item.main.temp_max,
                    temp_min: item.main.temp_min,
                    weather: item.weather[0],
                    date: date
                };
            } else {
                if (item.main.temp_max > dailyForecast[day].temp_max) {
                    dailyForecast[day].temp_max = item.main.temp_max;
                }
                if (item.main.temp_min < dailyForecast[day].temp_min) {
                    dailyForecast[day].temp_min = item.main.temp_min;
                }
            }
        });
        
        // Display next 5 days (skip today)
        const days = Object.keys(dailyForecast);
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        
        for (let i = 1; i <= 5 && i < days.length; i++) {
            const day = days[i];
            if (day === today) continue; // Skip today
            
            const forecast = dailyForecast[day];
            const iconClass = getWeatherIcon(forecast.weather.id, forecast.weather.icon);
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-day">${day}</div>
                <div class="forecast-icon"><i class="fas ${iconClass}"></i></div>
                <div class="forecast-temp">
                    <span class="temp-max">${Math.round(forecast.temp_max)}°</span>
                    <span class="temp-min">${Math.round(forecast.temp_min)}°</span>
                </div>
            `;
            
            forecastContainer.appendChild(forecastItem);
        }
    }
    
    function getWeatherIcon(weatherId, iconCode) {
        // Map OpenWeatherMap weather codes to Font Awesome icons
        if (weatherId >= 200 && weatherId < 300) {
            return 'fa-bolt'; // Thunderstorm
        } else if (weatherId >= 300 && weatherId < 400) {
            return 'fa-cloud-rain'; // Drizzle
        } else if (weatherId >= 500 && weatherId < 600) {
            return iconCode.includes('d') ? 'fa-cloud-sun-rain' : 'fa-cloud-moon-rain'; // Rain
        } else if (weatherId >= 600 && weatherId < 700) {
            return 'fa-snowflake'; // Snow
        } else if (weatherId >= 700 && weatherId < 800) {
            return 'fa-smog'; // Atmosphere (fog, haze, etc.)
        } else if (weatherId === 800) {
            return iconCode.includes('d') ? 'fa-sun' : 'fa-moon'; // Clear
        } else if (weatherId > 800) {
            return iconCode.includes('d') ? 'fa-cloud-sun' : 'fa-cloud-moon'; // Clouds
        }
        return 'fa-question'; // Default
    }
});