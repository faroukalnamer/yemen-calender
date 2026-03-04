/**
 * Yemen Calendar - Main Application
 * Orchestrates all components: Calendar, Prayer Times, Converter, Auth, Secure Data
 */

(function () {
    'use strict';

    // ==========================================
    // State
    // ==========================================
    let state = {
        currentCalendarType: 'hijri',
        currentDate: new Date(),
        calendarViewDate: null,
        selectedGovernorate: null,
        theme: 'light',
        prayerTimes: null,
        user: null,
        csrfToken: null
    };

    // ==========================================
    // Initialization
    // ==========================================

    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initLocationModal();
        initClock();
        initDateDisplay();
        initCalendar();
        initConverter();
        initEvents();
        initParticles();
        initNavigation();
        initScrollEffects();
        if (localStorage.getItem('yemenCalGov')) {
            initPrayerTimes();
        }
    });



    // ==========================================
    // Location Modal 
    // ==========================================

    function initLocationModal() {
        const savedGov = localStorage.getItem('yemenCalGov');
        const modal = document.getElementById('locationModal');
        const confirmBtn = document.getElementById('confirmLocationBtn');
        const modalSelect = document.getElementById('modalGovSelect');

        if (!savedGov) {
            document.body.classList.add('location-required');
            modal.classList.add('active');
        } else {
            state.selectedGovernorate = savedGov;
        }

        confirmBtn.addEventListener('click', () => {
            const selected = modalSelect.value;
            if (selected) {
                state.selectedGovernorate = selected;
                localStorage.setItem('yemenCalGov', selected);
                modal.classList.remove('active');
                document.body.classList.remove('location-required');
                initPrayerTimes();
            } else {
                alert('الرجاء اختيار المحافظة');
            }
        });

        const changeBtn = document.getElementById('changeGovBtn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                document.body.classList.add('location-required');
                modal.classList.add('active');
            });
        }
    }

    // ==========================================
    // Theme
    // ==========================================

    function initTheme() {
        const saved = localStorage.getItem('yemenCalTheme');
        if (saved) {
            state.theme = saved;
        }
        applyTheme();

        document.getElementById('themeToggle').addEventListener('click', () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('yemenCalTheme', state.theme);
            applyTheme();
        });
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-theme', state.theme);
        const icon = document.querySelector('.theme-icon');
        icon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
    }

    // ==========================================
    // Live Clock (12-Hour System)
    // ==========================================

    function initClock() {
        updateClock();
        setInterval(updateClock, 1000);
    }

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const period = hours >= 12 ? 'م' : 'ص';

        const displayHours = hours % 12 || 12;

        document.getElementById('clockTime').textContent =
            `${displayHours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
        document.getElementById('clockPeriod').textContent = period;
    }

    // ==========================================
    // Date Display
    // ==========================================

    function initDateDisplay() {
        updateDateDisplay();
    }

    function updateDateDisplay() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        // Gregorian
        document.getElementById('gregorianDate').textContent =
            CalendarConverter.formatGregorian(year, month, day);
        document.getElementById('gregorianDay').textContent =
            CalendarConverter.getDayName(now);

        // Hijri
        const hijri = CalendarConverter.gregorianToHijri(year, month, day);
        document.getElementById('hijriDate').textContent =
            CalendarConverter.formatHijri(hijri);
        document.getElementById('hijriDay').textContent =
            CalendarConverter.getDayName(now);

        // Agricultural
        const agri = CalendarConverter.getAgriculturalData(now);
        document.getElementById('agriculturalDate').innerHTML =
            `🌾 ${agri.starName}`;
        document.getElementById('agriculturalDesc').textContent =
            `${agri.description}`;

        // Syriac
        document.getElementById('syriacDate').textContent =
            CalendarConverter.formatSyriac(year, month, day);
        document.getElementById('syriacDay').textContent =
            CalendarConverter.getDayName(now);
    }

    // ==========================================
    // Calendar
    // ==========================================

    function initCalendar() {
        const now = new Date();
        setCalendarViewDate(now);

        document.querySelectorAll('.cal-type-btn').forEach(btn => {
            if (btn.id === 'changeGovBtn') return;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cal-type-btn').forEach(b => {
                    if (b.id !== 'changeGovBtn') b.classList.remove('active');
                });
                btn.classList.add('active');
                state.currentCalendarType = btn.dataset.type;
                setCalendarViewDate(new Date());
                renderCalendar();
            });
        });

        document.getElementById('prevMonth').addEventListener('click', () => {
            navigateMonth(-1);
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            navigateMonth(1);
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            setCalendarViewDate(new Date());
            renderCalendar();
        });

        renderCalendar();
    }

    function setCalendarViewDate(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        switch (state.currentCalendarType) {
            case 'gregorian':
                state.calendarViewDate = { year, month };
                break;
            case 'hijri':
                const hijri = CalendarConverter.gregorianToHijri(year, month, day);
                state.calendarViewDate = { year: hijri.year, month: hijri.month };
                break;
        }
    }

    function navigateMonth(direction) {
        let { year, month } = state.calendarViewDate;
        month += direction;

        if (month > 12) { month = 1; year++; }
        if (month < 1) { month = 12; year--; }

        state.calendarViewDate = { year, month };
        renderCalendar();
    }

    function renderCalendar() {
        const { year, month } = state.calendarViewDate;
        const type = state.currentCalendarType;

        let monthName, monthNames;
        switch (type) {
            case 'hijri':
                monthNames = CalendarConverter.hijriMonths;
                break;
            case 'gregorian':
                monthNames = CalendarConverter.gregorianMonths;
                break;
        }

        document.getElementById('calMonthName').textContent = monthNames[month - 1];
        document.getElementById('calYear').textContent = year;

        const weekdaysEl = document.getElementById('calWeekdays');
        weekdaysEl.innerHTML = '';
        const weekdays = ['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع'];
        weekdays.forEach(d => {
            const div = document.createElement('div');
            div.className = 'weekday';
            div.textContent = d;
            weekdaysEl.appendChild(div);
        });

        let daysInMonth;
        switch (type) {
            case 'gregorian':
                daysInMonth = new Date(year, month, 0).getDate();
                break;
            case 'hijri':
                daysInMonth = CalendarConverter.hijriMonthDays(year, month);
                break;
        }

        let firstDayGregorian;
        switch (type) {
            case 'gregorian':
                firstDayGregorian = new Date(year, month - 1, 1);
                break;
            case 'hijri':
                const g = CalendarConverter.hijriToGregorian(year, month, 1);
                firstDayGregorian = new Date(g.year, g.month - 1, g.day);
                break;
        }

        let firstDayOfWeek = firstDayGregorian.getDay();
        firstDayOfWeek = (firstDayOfWeek + 1) % 7;

        const today = new Date();
        let todayInType;
        switch (type) {
            case 'gregorian':
                todayInType = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
                break;
            case 'hijri':
                todayInType = CalendarConverter.gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
                break;
        }

        const daysEl = document.getElementById('calDays');
        daysEl.innerHTML = '';

        for (let i = 0; i < firstDayOfWeek; i++) {
            const div = document.createElement('div');
            div.className = 'day empty';
            daysEl.appendChild(div);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const div = document.createElement('div');
            div.className = 'day';

            let gDate;
            switch (type) {
                case 'gregorian':
                    gDate = new Date(year, month - 1, d);
                    break;
                case 'hijri':
                    const g = CalendarConverter.hijriToGregorian(year, month, d);
                    gDate = new Date(g.year, g.month - 1, g.day);
                    break;
            }

            const isToday = todayInType && d === todayInType.day && month === todayInType.month && year === todayInType.year;
            if (isToday) div.classList.add('today');

            if (gDate.getDay() === 5) div.classList.add('friday');

            if (type === 'hijri') {
                const hasEvent = CalendarConverter.islamicEvents.some(e => e.month === month && e.day === d);
                if (hasEvent) div.classList.add('event');
            }

            const dayNum = document.createElement('span');
            dayNum.textContent = d;
            div.appendChild(dayNum);

            const subDate = document.createElement('span');
            subDate.className = 'sub-date';
            switch (type) {
                case 'hijri':
                    subDate.textContent = `${gDate.getDate()}`;
                    break;
                case 'gregorian':
                    const h = CalendarConverter.gregorianToHijri(year, month, d);
                    subDate.textContent = `${h.day}`;
                    break;
            }
            div.appendChild(subDate);

            div.addEventListener('click', () => {
                document.querySelectorAll('.calendar-days .day').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                showDateInfo(type, year, month, d);
            });

            daysEl.appendChild(div);
        }
    }

    function showDateInfo(type, year, month, day) {
        const result = CalendarConverter.convertDate(type, day, month, year);

        const infoEl = document.getElementById('selectedDateInfo');
        infoEl.innerHTML = `
            <div class="info-row">
                <div class="info-item">
                    <div class="info-label">الميلادي</div>
                    <div class="info-value">${result.formatted.gregorian}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">الشمسي</div>
                    <div class="info-value" style="color:var(--sand-gold);">${result.formatted.syriac}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">الهجري</div>
                    <div class="info-value">${result.formatted.hijri}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">المعلم</div>
                    <div class="info-value">${result.agricultural.starName}</div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // Prayer Times (With Modal Handling)
    // ==========================================

    function initPrayerTimes() {
        if (!state.selectedGovernorate) return;

        updatePrayerTimes();
        setInterval(updatePrayerCountdown, 1000);
    }

    function updatePrayerTimes() {
        if (!state.selectedGovernorate) return;

        const times = PrayerTimesCalculator.calculate(new Date(), state.selectedGovernorate);
        if (!times) return;

        state.prayerTimes = times;

        const format12h = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            const period = h >= 12 ? 'م' : 'ص';
            const h12 = h % 12 || 12;
            return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
        };

        document.getElementById('fajrTime').textContent = format12h(times.fajr);
        document.getElementById('sunriseTime').textContent = format12h(times.sunrise);
        document.getElementById('dhuhrTime').textContent = format12h(times.dhuhr);
        document.getElementById('asrTime').textContent = format12h(times.asr);
        document.getElementById('maghribTime').textContent = format12h(times.maghrib);
        document.getElementById('ishaTime').textContent = format12h(times.isha);

        updateCurrentPrayer();
    }

    function updateCurrentPrayer() {
        if (!state.prayerTimes) return;

        const current = PrayerTimesCalculator.getCurrentPrayer(state.prayerTimes);

        document.querySelectorAll('.prayer-card').forEach(card => {
            card.classList.remove('active-prayer');
        });

        if (current) {
            const card = document.querySelector(`.prayer-card.${current}`);
            if (card) card.classList.add('active-prayer');
        }
    }

    function updatePrayerCountdown() {
        if (!state.prayerTimes) return;

        const next = PrayerTimesCalculator.getNextPrayer(state.prayerTimes);

        document.getElementById('nextPrayerName').textContent = next.name;

        const now = new Date();
        const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const prayerSeconds = PrayerTimesCalculator.timeToMinutes(next.time) * 60;

        let diff;
        if (prayerSeconds > currentSeconds) {
            diff = prayerSeconds - currentSeconds;
        } else {
            diff = (24 * 3600 - currentSeconds) + prayerSeconds;
        }

        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;

        document.getElementById('nextPrayerCountdown').textContent =
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        updateCurrentPrayer();
    }

    // ==========================================
    // Date Converter
    // ==========================================

    function initConverter() {
        document.getElementById('convertBtn').addEventListener('click', performConversion);

        document.querySelectorAll('.converter-fields input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performConversion();
            });
        });

        const now = new Date();
        document.getElementById('convDay').value = now.getDate();
        document.getElementById('convMonth').value = now.getMonth() + 1;
        document.getElementById('convYear').value = now.getFullYear();
    }

    function performConversion() {
        const fromType = document.getElementById('convertFrom').value;
        const day = parseInt(document.getElementById('convDay').value);
        const month = parseInt(document.getElementById('convMonth').value);
        const year = parseInt(document.getElementById('convYear').value);

        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            alert('يرجى إدخال تاريخ صحيح');
            return;
        }

        try {
            const result = CalendarConverter.convertDate(fromType, day, month, year);

            document.getElementById('resultGregorian').textContent = result.formatted.gregorian;
            document.getElementById('resultHijri').textContent = result.formatted.hijri;
            document.getElementById('resultSyriac').textContent = result.formatted.syriac;
            document.getElementById('resultAgricultural').textContent = result.agricultural.starName;

            document.querySelectorAll('.result-card').forEach((card, i) => {
                card.style.animation = 'none';
                card.offsetHeight;
                card.style.animation = `fadeInUp 0.4s ease-out ${i * 0.1}s backwards`;
            });
        } catch (e) {
            alert('خطأ في التحويل.');
        }
    }

    // ==========================================
    // Islamic Events
    // ==========================================

    function initEvents() {
        const now = new Date();
        const hijri = CalendarConverter.gregorianToHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const events = CalendarConverter.getUpcomingEvents(hijri);

        const container = document.getElementById('eventsContainer');
        container.innerHTML = '';

        events.forEach((event, index) => {
            const card = document.createElement('div');
            card.className = `event-card ${event.isPast ? 'past-event' : ''} ${event.isToday ? 'today-event' : ''}`;
            card.style.animationDelay = `${index * 0.05}s`;

            let remainingText;
            if (event.isToday) {
                remainingText = '🎉 اليوم!';
            } else if (event.isPast) {
                remainingText = 'انقضت';
            } else {
                remainingText = `بعد ${event.daysRemaining} يوم`;
            }

            const gDate = event.gregorianDate;
            const gFormatted = CalendarConverter.formatGregorian(gDate.year, gDate.month, gDate.day);

            card.innerHTML = `
                <div class="event-icon">${event.icon}</div>
                <div class="event-name">${event.name}</div>
                <div class="event-date">${event.formattedHijri}</div>
                <div class="event-date" style="font-size: 0.75rem; opacity: 0.7">${gFormatted}</div>
                <div class="event-remaining">${remainingText}</div>
            `;

            container.appendChild(card);
        });
    }

    // ==========================================
    // Particles Background
    // ==========================================

    function initParticles() {
        const container = document.getElementById('particles');
        const particleCount = 20;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = Math.random() * 4 + 1;
            const left = Math.random() * 100;
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * 20;

            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${left}%;
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
            `;

            container.appendChild(particle);
        }
    }

    function initNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                const target = link.getAttribute('href');
                if (target === '#') return; // For auth link, ignore scroll

                if (target) {
                    const el = document.querySelector(target);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    function initScrollEffects() {
        const header = document.getElementById('header');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section);
        });
    }

})();
