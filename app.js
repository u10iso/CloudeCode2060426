class AlarmApp {
    constructor() {
        this.alarms = [];
        this.intervals = [];
        this.alarmSound = document.getElementById('alarmSound');
        this.timeInput = document.getElementById('alarmTime');
        this.setBtn = document.getElementById('setBtn');
        this.alarmsList = document.getElementById('alarmsList');

        this.setBtn.addEventListener('click', () => this.addAlarm());
        this.timeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addAlarm();
        });

        this.loadAlarms();
        this.startTimeCheck();
    }

    addAlarm() {
        const time = this.timeInput.value;
        if (!time) {
            alert('Please select a time');
            return;
        }

        const alarm = {
            id: Date.now(),
            time: time,
            enabled: true
        };

        this.alarms.push(alarm);
        this.saveAlarms();
        this.render();
        this.timeInput.value = '';
    }

    deleteAlarm(id) {
        this.alarms = this.alarms.filter(alarm => alarm.id !== id);
        this.saveAlarms();
        this.render();
    }

    startTimeCheck() {
        setInterval(() => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            this.alarms.forEach(alarm => {
                if (alarm.enabled && alarm.time === currentTime) {
                    this.triggerAlarm(alarm.id);
                }
            });
        }, 1000);
    }

    triggerAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (!alarm) return;

        alarm.enabled = false;
        this.saveAlarms();
        this.render();

        this.playSound();
        this.showNotification();
    }

    playSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
    }

    showNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Alarm', {
                body: 'Your alarm is ringing'
            });
        }
    }

    saveAlarms() {
        localStorage.setItem('alarms', JSON.stringify(this.alarms));
    }

    loadAlarms() {
        const saved = localStorage.getItem('alarms');
        if (saved) {
            this.alarms = JSON.parse(saved);
        }
    }

    render() {
        if (this.alarms.length === 0) {
            this.alarmsList.innerHTML = '<li class="empty">No alarms set</li>';
            return;
        }

        const sorted = [...this.alarms].sort((a, b) => a.time.localeCompare(b.time));

        this.alarmsList.innerHTML = sorted.map(alarm => `
            <li class="list-item">
                <div class="alarm-time">${alarm.time}</div>
                <div class="alarm-status">${alarm.enabled ? 'Active' : 'Done'}</div>
                <button class="btn btn-delete" onclick="app.deleteAlarm(${alarm.id})">Delete</button>
            </li>
        `).join('');
    }
}

class Stopwatch {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.running = false;
        this.laps = [];
        this.intervalId = null;

        this.display = document.getElementById('stopwatchTime');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.lapBtn = document.getElementById('lapBtn');
        this.lapsList = document.getElementById('lapsList');

        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.lapBtn.addEventListener('click', () => this.recordLap());
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.startTime = Date.now() - this.elapsedTime;

        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.lapBtn.disabled = false;

        this.intervalId = setInterval(() => this.updateDisplay(), 10);
    }

    pause() {
        this.running = false;
        clearInterval(this.intervalId);

        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.lapBtn.disabled = true;
    }

    reset() {
        this.running = false;
        clearInterval(this.intervalId);
        this.elapsedTime = 0;
        this.laps = [];
        this.display.textContent = '00:00:00';
        this.lapsList.innerHTML = '<li class="empty">No laps recorded</li>';

        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.lapBtn.disabled = true;
    }

    recordLap() {
        const lapTime = this.elapsedTime;
        this.laps.push(lapTime);
        this.renderLaps();
    }

    updateDisplay() {
        this.elapsedTime = Date.now() - this.startTime;
        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        this.display.textContent =
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    renderLaps() {
        if (this.laps.length === 0) {
            this.lapsList.innerHTML = '<li class="empty">No laps recorded</li>';
            return;
        }

        this.lapsList.innerHTML = this.laps.map((lap, index) => {
            const totalSeconds = Math.floor(lap / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            return `<li class="list-item"><div>Lap ${index + 1}</div><div class="alarm-time">${time}</div></li>`;
        }).join('');
    }
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}

class Weather {
    constructor() {
        this.apiKey = '85a4e3c55f3ee4e2a61843a75fa3ff3b';
        this.tempEl = document.getElementById('weatherTemp');
        this.descEl = document.getElementById('weatherDesc');
        this.locationEl = document.getElementById('weatherLocation');
        this.init();
    }

    init() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => this.fetchWeather(position.coords.latitude, position.coords.longitude),
                () => this.fetchWeather(35.6762, 139.6503)
            );
        } else {
            this.fetchWeather(35.6762, 139.6503);
        }
    }

    fetchWeather(lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;

        fetch(url)
            .then(response => response.json())
            .then(data => this.displayWeather(data))
            .catch(error => console.error('Weather fetch error:', error));
    }

    displayWeather(data) {
        if (!data || !data.main || !data.weather) {
            return;
        }
        const temp = Math.round(data.main.temp);
        const desc = data.weather[0].main;
        const location = data.name;

        this.tempEl.textContent = `${temp}°`;
        this.descEl.textContent = desc;
        this.locationEl.textContent = location;
    }
}

if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

class Pokemon {
    constructor() {
        this.randomBtn = document.getElementById('randomBtn');
        this.nameEl = document.getElementById('pokemonName');
        this.imageEl = document.getElementById('pokemonImage');
        this.typesEl = document.getElementById('pokemonTypes');
        this.heightEl = document.getElementById('pokemonHeight');
        this.weightEl = document.getElementById('pokemonWeight');

        this.randomBtn.addEventListener('click', () => this.fetchRandomPokemon());
        this.fetchRandomPokemon();
    }

    fetchRandomPokemon() {
        const randomId = Math.floor(Math.random() * 898) + 1;
        fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`)
            .then(response => response.json())
            .then(data => this.displayPokemon(data))
            .catch(error => console.error('Pokemon fetch error:', error));
    }

    displayPokemon(data) {
        const name = data.name;
        const image = data.sprites['official-artwork']?.front_default || data.sprites.front_default;
        const types = data.types.map(t => t.type.name);
        const height = (data.height / 10).toFixed(1) + ' m';
        const weight = (data.weight / 10).toFixed(1) + ' kg';

        this.nameEl.textContent = name;
        this.imageEl.innerHTML = `<img src="${image}" alt="${name}">`;
        this.typesEl.innerHTML = types.map(type => `<span class="pokemon-type">${type}</span>`).join('');
        this.heightEl.textContent = height;
        this.weightEl.textContent = weight;
    }
}

const app = new AlarmApp();
const stopwatch = new Stopwatch();
const weather = new Weather();
const pokemon = new Pokemon();
setupTabs();
