/**
 * Calendar Conversion Library
 * Supports: Gregorian, Hijri (Islamic - Umm al-Qura), Agricultural (Ma'alim), Syriac (Kawanin)
 */

const CalendarConverter = (function () {
    'use strict';

    // ==========================================
    // Arabic Month & Day Names
    // ==========================================

    const hijriMonths = [
        'محرّم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
        'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
        'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجة'
    ];

    const gregorianMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل',
        'مايو', 'يونيو', 'يوليو', 'أغسطس',
        'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const syriacMonths = [
        'كانون الثاني', 'شباط', 'آذار', 'نيسان',
        'أيار', 'حزيران', 'تموز', 'آب',
        'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
    ];

    const dayNames = [
        'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء',
        'الخميس', 'الجمعة', 'السبت'
    ];

    const dayNamesShort = [
        'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'
    ];

    // ==========================================
    // Hijri Calendar (Using Intl API + Algorithm)
    // ==========================================

    function gregorianToHijri(year, month, day) {
        try {
            const date = new Date(year, month - 1, day);
            const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            const parts = formatter.formatToParts(date);
            const result = {};
            parts.forEach(p => {
                if (p.type === 'day') result.day = parseInt(p.value);
                if (p.type === 'month') result.month = parseInt(p.value);
                if (p.type === 'year') result.year = parseInt(p.value);
            });
            return result;
        } catch (e) {
            return gregorianToHijriFallback(year, month, day);
        }
    }

    function gregorianToHijriFallback(year, month, day) {
        const d = new Date(year, month - 1, day);
        const jd = Math.floor((d.getTime() / 86400000) + 2440587.5);

        const l = jd - 1948440 + 10632;
        const n = Math.floor((l - 1) / 10631);
        const l2 = l - 10631 * n + 354;
        const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
            + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
        const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
            - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
        const m = Math.floor((24 * l3) / 709);
        const dd = l3 - Math.floor((709 * m) / 24);
        const yy = 30 * n + j - 30;

        return { year: yy, month: m, day: dd };
    }

    function hijriToGregorian(hYear, hMonth, hDay) {
        hMonth = parseInt(hMonth);
        hDay = parseInt(hDay);
        hYear = parseInt(hYear);

        const jd = Math.floor((11 * hYear + 3) / 30) + 354 * hYear + 30 * hMonth
            - Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;

        let l = jd + 68569;
        const n = Math.floor(4 * l / 146097);
        l = l - Math.floor((146097 * n + 3) / 4);
        const i = Math.floor(4000 * (l + 1) / 1461001);
        l = l - Math.floor(1461 * i / 4) + 31;
        const j = Math.floor(80 * l / 2447);
        const day = l - Math.floor(2447 * j / 80);
        l = Math.floor(j / 11);
        const month = j + 2 - 12 * l;
        const year = 100 * (n - 49) + i + l;

        return { year, month, day };
    }

    function hijriMonthDays(hYear, hMonth) {
        try {
            const g = hijriToGregorian(hYear, hMonth, 1);
            const startDate = new Date(g.year, g.month - 1, g.day);
            for (let d = 30; d >= 28; d--) {
                const gTest = hijriToGregorian(hYear, hMonth, d);
                const testDate = new Date(gTest.year, gTest.month - 1, gTest.day);
                const hijri = gregorianToHijri(gTest.year, gTest.month, gTest.day);
                if (hijri.month === hMonth && hijri.day === d) {
                    return d;
                }
            }
            return 30;
        } catch (e) {
            return hMonth % 2 === 1 ? 30 : 29;
        }
    }

    // ==========================================
    // agricultural Calendar (Ma'alim al-Zira'a)
    // ==========================================

    const agriculturalStars = [
        { name: 'البلدة', startDay: 353 },
        { name: 'سعد الذابح', startDay: 2, desc: 'مبرد الماء' },
        { name: 'سعد بلع', startDay: 15, desc: 'كل وشرب ولا تبتلع' },
        { name: 'سعد السعود', startDay: 28, desc: 'يدفئ كل مبرود' },
        { name: 'سعد الأخبية', startDay: 41, desc: 'تخرج من بيوتها الحنش والعقربة' },
        { name: 'المقدم', startDay: 54 },
        { name: 'المؤخر', startDay: 67 },
        { name: 'بطن الحوت (الرشا)', startDay: 80, desc: 'بداية الربيع الزراعي' },
        { name: 'الشرطين', startDay: 93 },
        { name: 'البطين', startDay: 106 },
        { name: 'الثريا', startDay: 119, desc: 'من زرع فيها ما تملى' },
        { name: 'الدبران', startDay: 132 },
        { name: 'الهقعة', startDay: 145 },
        { name: 'الهنعة', startDay: 158 },
        { name: 'الذراع', startDay: 171 },
        { name: 'النثرة', startDay: 184 },
        { name: 'الطرف', startDay: 197 },
        { name: 'الجبهة', startDay: 210 },
        { name: 'الزبرة', startDay: 223 },
        { name: 'الصرفة', startDay: 236, desc: 'تصريف الحر' },
        { name: 'العواء', startDay: 249 },
        { name: 'السماك', startDay: 262 },
        { name: 'الغفر', startDay: 275 },
        { name: 'الزبانا', startDay: 288 },
        { name: 'الإكليل', startDay: 301 },
        { name: 'القلب', startDay: 314 },
        { name: 'الشولة', startDay: 327 },
        { name: 'النعايم', startDay: 340 }
    ];

    function getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    function getAgriculturalData(date) {
        const doy = getDayOfYear(date);
        let currentStar = agriculturalStars[agriculturalStars.length - 1];
        let sortedStars = [...agriculturalStars].sort((a, b) => a.startDay - b.startDay);

        for (let i = sortedStars.length - 1; i >= 0; i--) {
            if (doy >= sortedStars[i].startDay) {
                currentStar = sortedStars[i];
                break;
            }
        }

        if (doy < 2) {
            currentStar = agriculturalStars.find(s => s.name === 'البلدة') || { name: 'البلدة' };
        }

        return {
            starName: currentStar.name,
            description: currentStar.desc || 'معلم زراعي',
            dayOfYear: doy,
            icon: '🌾'
        };
    }

    // ==========================================
    // Utility Functions
    // ==========================================

    function getDayName(date) {
        return dayNames[date.getDay()];
    }

    function getDayNameShort(date) {
        return dayNamesShort[date.getDay()];
    }

    function formatHijri(hijri) {
        if (!hijri) return '--';
        return `${hijri.day} ${hijriMonths[hijri.month - 1]} ${hijri.year} هـ`;
    }

    function formatGregorian(year, month, day) {
        return `${day} ${gregorianMonths[month - 1]} ${year} م`;
    }

    function formatSyriac(year, month, day) {
        return `${day} ${syriacMonths[month - 1]} ${year} م`;
    }

    /**
     * Universal converter 
     */
    function convertDate(fromType, day, month, year) {
        let gregorian, hijri, agricultural;
        let dateObj;

        switch (fromType) {
            case 'gregorian':
                dateObj = new Date(year, month - 1, day);
                gregorian = { year, month, day };
                hijri = gregorianToHijri(year, month, day);
                agricultural = getAgriculturalData(dateObj);
                break;
            case 'hijri':
                gregorian = hijriToGregorian(year, month, day);
                dateObj = new Date(gregorian.year, gregorian.month - 1, gregorian.day);
                hijri = { year, month, day };
                agricultural = getAgriculturalData(dateObj);
                break;
        }

        return {
            gregorian,
            hijri,
            agricultural,
            dayName: getDayName(dateObj),
            date: dateObj,
            formatted: {
                gregorian: formatGregorian(gregorian.year, gregorian.month, gregorian.day),
                syriac: formatSyriac(gregorian.year, gregorian.month, gregorian.day),
                hijri: formatHijri(hijri),
                agricultural: `${agricultural.starName}`
            }
        };
    }

    // ==========================================
    // Islamic Events
    // ==========================================

    const islamicEvents = [
        { month: 1, day: 1, name: 'رأس السنة الهجرية', icon: '🌟' },
        { month: 1, day: 10, name: 'يوم عاشوراء', icon: '📿' },
        { month: 3, day: 12, name: 'المولد النبوي الشريف', icon: '🕌' },
        { month: 7, day: 27, name: 'ليلة الإسراء والمعراج', icon: '✨' },
        { month: 8, day: 15, name: 'ليلة النصف من شعبان', icon: '🌕' },
        { month: 9, day: 1, name: 'بداية شهر رمضان المبارك', icon: '🌙' },
        { month: 9, day: 27, name: 'ليلة القدر (المتوقعة)', icon: '⭐' },
        { month: 10, day: 1, name: 'عيد الفطر المبارك', icon: '🎉' },
        { month: 12, day: 9, name: 'يوم عرفة', icon: '🏔️' },
        { month: 12, day: 10, name: 'عيد الأضحى المبارك', icon: '🐑' }
    ];

    function getUpcomingEvents(currentHijri) {
        const events = [];
        const currentMonth = currentHijri.month;
        const currentDay = currentHijri.day;
        const currentYear = currentHijri.year;

        for (let e of islamicEvents) {
            let year = currentYear;
            let isPast = false;

            if (e.month < currentMonth || (e.month === currentMonth && e.day < currentDay)) {
                year = currentYear + 1;
                isPast = false;
            }
            if (e.month === currentMonth && e.day === currentDay) {
                isPast = false;
            }

            const eventG = hijriToGregorian(year, e.month, e.day);
            const eventDate = new Date(eventG.year, eventG.month - 1, eventG.day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = eventDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            events.push({
                ...e,
                hijriYear: year,
                daysRemaining: diffDays,
                isPast: diffDays < 0,
                isToday: diffDays === 0,
                gregorianDate: eventG,
                formattedHijri: `${e.day} ${hijriMonths[e.month - 1]} ${year} هـ`
            });
        }

        events.sort((a, b) => {
            if (a.isToday) return -1;
            if (b.isToday) return 1;
            if (a.isPast && !b.isPast) return 1;
            if (!a.isPast && b.isPast) return -1;
            return a.daysRemaining - b.daysRemaining;
        });

        return events;
    }

    return {
        gregorianToHijri,
        hijriToGregorian,
        convertDate,
        getAgriculturalData,
        hijriMonthDays,
        hijriMonths,
        gregorianMonths,
        syriacMonths,
        dayNames,
        dayNamesShort,
        formatHijri,
        formatGregorian,
        formatSyriac,
        getDayName,
        getDayNameShort,
        islamicEvents,
        getUpcomingEvents
    };
})();
