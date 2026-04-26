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
            alert('時刻を選択してください');
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
            new Notification('アラーム', {
                body: 'アラームが鳴っています！',
                icon: '⏰'
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
            this.alarmsList.innerHTML = '<li class="empty">アラームはまだ設定されていません</li>';
            return;
        }

        const sorted = [...this.alarms].sort((a, b) => a.time.localeCompare(b.time));

        this.alarmsList.innerHTML = sorted.map(alarm => `
            <li class="list-item">
                <div class="alarm-time">${alarm.time}</div>
                <div class="alarm-status">${alarm.enabled ? '有効' : '完了'}</div>
                <button class="btn btn-delete" onclick="app.deleteAlarm(${alarm.id})">削除</button>
            </li>
        `).join('');
    }
}

if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

const app = new AlarmApp();
