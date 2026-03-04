/**
 * Prayer Times Calculator
 * Based on the calculation method of Umm al-Qura (used in Saudi Arabia & Yemen)
 * Implements astronomical calculations for accurate prayer times
 */

const PrayerTimesCalculator = (function() {
    'use strict';

    // Calculation Methods
    const Methods = {
        UmmAlQura: {
            name: 'أم القرى',
            fajrAngle: 18.5,
            ishaAngle: 0,     // Umm al-Qura uses fixed minutes after maghrib
            ishaMinutes: 90,  // 90 minutes after Maghrib
            maghribMinutes: 0
        }
    };

    // Governorate coordinates
    const Governorates = {
        sanaa:      { name: 'أمانة العاصمة - صنعاء', lat: 15.3547, lng: 44.2067, tz: 3 },
        aden:       { name: 'عدن',                   lat: 12.7793, lng: 45.0360, tz: 3 },
        taiz:       { name: 'تعز',                   lat: 13.5771, lng: 44.0210, tz: 3 },
        ibb:        { name: 'إب',                    lat: 13.9631, lng: 44.1762, tz: 3 },
        hudaydah:   { name: 'الحديدة',               lat: 14.7963, lng: 42.9463, tz: 3 },
        hadhramaut: { name: 'حضرموت',                lat: 14.5204, lng: 49.1226, tz: 3 },
        dhamar:     { name: 'ذمار',                  lat: 14.5422, lng: 44.4093, tz: 3 },
        amran:      { name: 'عمران',                 lat: 15.6593, lng: 44.7801, tz: 3 },
        hajjah:     { name: 'حجة',                   lat: 15.6980, lng: 43.1502, tz: 3 },
        sadah:      { name: 'صعدة',                  lat: 16.9461, lng: 43.7661, tz: 3 },
        marib:      { name: 'مأرب',                  lat: 15.4667, lng: 45.3333, tz: 3 },
        bayda:      { name: 'البيضاء',               lat: 14.6738, lng: 45.5760, tz: 3 },
        lahij:      { name: 'لحج',                   lat: 13.0560, lng: 44.8770, tz: 3 },
        shabwah:    { name: 'شبوة',                  lat: 14.5381, lng: 46.8322, tz: 3 },
        abyan:      { name: 'أبين',                  lat: 13.7380, lng: 45.3789, tz: 3 },
        dhale:      { name: 'الضالع',                lat: 13.7915, lng: 44.7337, tz: 3 },
        mahwit:     { name: 'المحويت',               lat: 15.4705, lng: 43.5413, tz: 3 },
        jawf:       { name: 'الجوف',                 lat: 16.1408, lng: 44.7733, tz: 3 },
        mahrah:     { name: 'المهرة',                lat: 16.2081, lng: 52.1764, tz: 3 },
        raymah:     { name: 'ريمة',                  lat: 14.7818, lng: 43.6811, tz: 3 },
        socotra:    { name: 'سقطرى',                 lat: 12.6500, lng: 54.0333, tz: 3 },
        sanaaGov:   { name: 'صنعاء (المحافظة)',       lat: 15.3547, lng: 44.2067, tz: 3 }
    };

    // Math helpers
    const DEG = Math.PI / 180;
    const RAD = 180 / Math.PI;

    function sin(d) { return Math.sin(d * DEG); }
    function cos(d) { return Math.cos(d * DEG); }
    function tan(d) { return Math.tan(d * DEG); }
    function arcsin(x) { return RAD * Math.asin(x); }
    function arccos(x) { return RAD * Math.acos(x); }
    function arctan2(y, x) { return RAD * Math.atan2(y, x); }
    function fixAngle(a) { return a - 360.0 * Math.floor(a / 360.0); }
    function fixHour(a) { return a - 24.0 * Math.floor(a / 24.0); }

    // Julian Date calculation
    function julianDate(year, month, day) {
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        const A = Math.floor(year / 100);
        const B = 2 - A + Math.floor(A / 4);
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
    }

    // Sun position calculations
    function sunPosition(jd) {
        const D = jd - 2451545.0;
        const g = fixAngle(357.529 + 0.98560028 * D);
        const q = fixAngle(280.459 + 0.98564736 * D);
        const L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g));
        const e = 23.439 - 0.00000036 * D;
        const RA = arctan2(cos(e) * sin(L), cos(L)) / 15.0;
        const d = arcsin(sin(e) * sin(L));
        const EqT = q / 15.0 - fixHour(RA);
        return { declination: d, equation: EqT };
    }

    // Compute mid-day (Dhuhr) time
    function computeMidDay(t, jd, lng, tz) {
        const sunPos = sunPosition(jd + t);
        const z = fixHour(12 - sunPos.equation);
        return z;
    }

    // Compute time for a given angle
    function computeTime(angle, t, lat, direction, jd, lng, tz) {
        const sunPos = sunPosition(jd + t);
        const D = sunPos.declination;
        const Z = computeMidDay(t, jd, lng, tz);
        const V = arccos((-sin(angle) - sin(D) * sin(lat)) / (cos(D) * cos(lat))) / 15.0;
        return Z + (direction === 'ccw' ? -V : V);
    }

    // Compute Asr time (Shafi'i method - shadow = object length)
    function computeAsr(factor, t, lat, jd, lng, tz) {
        const sunPos = sunPosition(jd + t);
        const D = sunPos.declination;
        const G = -arccos(sin(arccos(1 / (factor + tan(Math.abs(lat - D))))) - sin(D) * sin(lat) / (cos(D) * cos(lat)));
        const Z = computeMidDay(t, jd, lng, tz);
        return Z - G / 15.0;
    }

    // Main calculation
    function calculate(date, govKey) {
        const gov = Governorates[govKey];
        if (!gov) return null;

        const method = Methods.UmmAlQura;
        const lat = gov.lat;
        const lng = gov.lng;
        const tz = gov.tz;

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const jd = julianDate(year, month, day) - lng / (15 * 24);

        // Iteratively compute times
        let t = 0;
        const midDay = computeMidDay(t, jd, lng, tz);
        
        const fajr = computeTime(method.fajrAngle, t, lat, 'ccw', jd, lng, tz);
        const sunrise = computeTime(0.833 + 0.0347 * Math.sqrt(0), t, lat, 'ccw', jd, lng, tz); // 0.833 = standard refraction
        const dhuhr = midDay + (1 / 60.0); // Add 1 minute safety margin
        const asr = computeAsr(1, t, lat, jd, lng, tz); // Shafi'i
        const sunset = computeTime(0.833, t, lat, 'cw', jd, lng, tz);
        const maghrib = sunset + (method.maghribMinutes / 60.0);
        
        let isha;
        if (method.ishaMinutes > 0) {
            isha = sunset + method.ishaMinutes / 60.0;
        } else {
            isha = computeTime(method.ishaAngle, t, lat, 'cw', jd, lng, tz);
        }

        // Adjust for timezone and longitude
        const lngDiff = lng / 15.0 - tz;

        const times = {
            fajr: fajr - lngDiff,
            sunrise: sunrise - lngDiff,
            dhuhr: dhuhr - lngDiff,
            asr: asr - lngDiff,
            maghrib: maghrib - lngDiff,
            isha: isha - lngDiff,
        };

        // Format times
        const formatted = {};
        for (let key in times) {
            formatted[key] = formatTime(times[key]);
        }

        return formatted;
    }

    function formatTime(hours) {
        if (isNaN(hours)) return '--:--';
        hours = fixHour(hours + 0.5 / 60); // Add 30 seconds for rounding
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        const hStr = h.toString().padStart(2, '0');
        const mStr = m.toString().padStart(2, '0');
        return `${hStr}:${mStr}`;
    }

    // Convert time string HH:MM to minutes since midnight
    function timeToMinutes(timeStr) {
        if (!timeStr || timeStr === '--:--') return -1;
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    // Get next prayer
    function getNextPrayer(times) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const prayerOrder = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerNames = {
            fajr: 'الفجر',
            sunrise: 'الشروق',
            dhuhr: 'الظهر',
            asr: 'العصر',
            maghrib: 'المغرب',
            isha: 'العشاء'
        };

        for (let prayer of prayerOrder) {
            const prayerMin = timeToMinutes(times[prayer]);
            if (prayerMin > currentMinutes) {
                const remaining = prayerMin - currentMinutes;
                const h = Math.floor(remaining / 60);
                const m = remaining % 60;
                return {
                    name: prayerNames[prayer],
                    key: prayer,
                    time: times[prayer],
                    remaining: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
                    remainingMinutes: remaining
                };
            }
        }

        // If all prayers passed, next is Fajr tomorrow
        const fajrMin = timeToMinutes(times.fajr);
        const remaining = (24 * 60 - currentMinutes) + fajrMin;
        const h = Math.floor(remaining / 60);
        const m = remaining % 60;
        return {
            name: prayerNames.fajr,
            key: 'fajr',
            time: times.fajr,
            remaining: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
            remainingMinutes: remaining
        };
    }

    // Get current prayer (the active one)
    function getCurrentPrayer(times) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const prayerOrder = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        let current = null;
        for (let prayer of prayerOrder) {
            const prayerMin = timeToMinutes(times[prayer]);
            if (currentMinutes >= prayerMin) {
                current = prayer;
            }
        }
        return current;
    }

    return {
        calculate,
        getNextPrayer,
        getCurrentPrayer,
        timeToMinutes,
        Governorates
    };
})();
