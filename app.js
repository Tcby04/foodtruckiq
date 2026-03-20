// FoodTruckIQ - Mobile-First Redesign
(function() {
    'use strict';

    var categoryColors = {
        'potential': '#3b82f6',
        'food_truck_court': '#22c55e',
        'existing': '#f97316'
    };
    var categoryLabels = {
        'potential': 'Potential',
        'food_truck_court': 'Court',
        'existing': 'Existing'
    };
    var categoryBadgeClass = {
        'potential': 'badge-potential',
        'food_truck_court': 'badge-court',
        'existing': 'badge-existing'
    };
    var categoryCardAccent = {
        'potential': '#3b82f6',
        'food_truck_court': '#22c55e',
        'existing': '#f97316'
    };
    var seasonalHints = {
        'fay-downtown':   { emoji: '&#127882;', text: 'Best on weekends &mdash; college crowd, events & nightlife' },
        'fay-uofa':       { emoji: '&#128218;', text: 'Lunch rush only &mdash; campus quiets down on weekends' },
        'fay-lake':       { emoji: '&#127793;', text: 'Peak summer weekends &mdash; families, joggers, sunset crowds' },
        'fay-514':        { emoji: '&#127744;', text: 'Newly opened &mdash; low competition, nice outdoor space' },
        'ben-downtown':   { emoji: '&#128693;', text: 'Weekday lunch is strong &mdash; downtown office workers' },
        'ben-crystal':    { emoji: '&#127912;', text: 'Tourist season peaks spring&ndash;fall &mdash; museum hours apply' },
        'ben-8thstreet':  { emoji: '&#128685;', text: 'Consistent foot traffic &mdash; evenings & weekends draw crowds' },
        'spr-boardwalk':  { emoji: '&#127942;', text: 'Award-winning court &mdash; weekend dinners are packed, arrive early' },
        'rog-downtown':   { emoji: '&#129389;', text: 'Growing food scene &mdash; Friday evenings attract the downtown crowd' },
        'rog-promenade':  { emoji: '&#128722;', text: 'Weekend traffic peaks midday &mdash; competition with food court' },
        'centerton-park': { emoji: '&#129482;', text: 'Family-focused &mdash; weekends & dinner time draw the playground crowd' },
        'bv-towncenter':  { emoji: '&#127960;', text: 'Quiet weekday mornings &mdash; POA community, low-key traffic' }
    };

    // DOM refs
    var layout, bottomSheet, sheetBackdrop, sheetList, sheetTitle, sheetCount;
    var sidebarCityTabs, sidebarList;
    var filterPanel, filterChevron, filterChips;
    var isDesktop = false;
    var currentCity = null;
    var currentFilter = 'all';
    var selectedLocationId = null;

    // ========================================
    // MAP
    // ========================================
    var map = L.map('map', {
        zoomControl: false
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    map.setView([36.25, -94.15], 10);

    var locationsData;
    var markers = {};

    // ========================================
    // HELPERS
    // ========================================
    function short(str) {
        if (!str) return '';
        return str.split(',')[0].trim();
    }

    function isMobile() {
        return window.innerWidth < 768;
    }

    function buildCardHTML(loc, cityName) {
        var hint = seasonalHints[loc.id];
        var badgeClass = categoryBadgeClass[loc.category] || 'badge-type';
        var accentColor = categoryCardAccent[loc.category] || 'var(--border)';
        var peakShort = short(loc.peakHours);
        var parkingShort = short(loc.parking);
        var ratingHtml = loc.rating ? '<span class="badge badge-rating">&#11088; ' + loc.rating.toFixed(1) + '</span>' : '';
        var hoursHtml = loc.peakHours ? '<div class="card-hours"><span>&#128339;</span><span>Peak: <strong>' + loc.peakHours + '</strong></span></div>' : '';
        var hintHtml = hint ? '<div class="card-hint"><span class="emoji">' + hint.emoji + '</span>' + hint.text + '</div>' : '';
        return '<div class="location-card" id="card-' + loc.id + '" style="--card-accent:' + accentColor + ';animation-delay:' + (Math.random() * 100) + 'ms" onclick="FTIQ.selectLocation(\'' + loc.id + '\')">' +
            '<div class="card-top"><div class="card-name">' + loc.name + '</div></div>' +
            '<div class="card-badges">' +
                '<span class="badge ' + badgeClass + '">' + (categoryLabels[loc.category] || loc.category) + '</span>' +
                ratingHtml +
            '</div>' +
            '<div class="card-meta">' +
                '<div class="card-meta-item">&#128099; <span>Traffic:</span> <span class="val">' + loc.footTraffic + '</span></div>' +
                '<div class="card-meta-item">&#9200; <span>Peak:</span> <span class="val">' + peakShort + '</span></div>' +
                '<div class="card-meta-item">&#127828; <span>Competitors:</span> <span class="val">' + loc.competition + '</span></div>' +
                '<div class="card-meta-item">&#128664; <span>Parking:</span> <span class="val">' + parkingShort + '</span></div>' +
            '</div>' +
            hoursHtml + hintHtml +
        '</div>';
    }

    function buildProBannerHTML() {
        return '<div class="pro-banner">' +
            '<div class="pro-banner-title">&#9889; FoodTruckIQ Pro</div>' +
            '<ul class="pro-banner-features">' +
                '<li>Analytics & heatmaps</li>' +
                '<li>Unlimited locations</li>' +
                '<li>Schedule planning</li>' +
                '<li>All NWA cities + more</li>' +
            '</ul>' +
            '<a href="https://buy.stripe.com/14A28r5it1tvafhbyo8EM09" target="_blank" class="btn btn-pro">Upgrade &mdash; $3/month</a>' +
        '</div>';
    }

    // ========================================
    // STATS BAR
    // ========================================
    function buildStatsBar() {
        var total = 0, courts = 0, potential = 0;
        for (var ci = 0; ci < locationsData.cities.length; ci++) {
            var city = locationsData.cities[ci];
            for (var j = 0; j < city.locations.length; j++) {
                var loc = city.locations[j];
                total++;
                if (loc.category === 'food_truck_court') courts++;
                if (loc.category === 'potential') potential++;
            }
        }
        document.getElementById('statsBar').innerHTML =
            '<div class="stat-item">' +
                '<div class="stat-icon teal">&#128205;</div>' +
                '<div><div class="stat-value">' + total + '</div><div class="stat-label">Locations tracked</div></div>' +
            '</div>' +
            '<div class="stat-item">' +
                '<div class="stat-icon green">&#127942;</div>' +
                '<div><div class="stat-value">' + courts + '</div><div class="stat-label">Food truck courts</div></div>' +
            '</div>' +
            '<div class="stat-item">' +
                '<div class="stat-icon blue">&#10024;</div>' +
                '<div><div class="stat-value">' + potential + '</div><div class="stat-label">Potential spots</div></div>' +
            '</div>';
    }

    // ========================================
    // MOBILE: CITY TABS (pill bar)
    // ========================================
    function buildMobileCityTabs() {
        var tabs = document.getElementById('cityTabs');
        var inner = document.createElement('div');
        inner.className = 'city-tabs-inner';
        for (var i = 0; i < locationsData.cities.length; i++) {
            var city = locationsData.cities[i];
            var btn = document.createElement('button');
            btn.className = 'city-tab' + (i === 0 ? ' active' : '');
            btn.setAttribute('data-city', city.name);
            btn.innerHTML = city.name + ' <span class="count">' + city.locations.length + '</span>';
            btn.addEventListener('click', (function(c) {
                return function() {
                    document.querySelectorAll('.city-tabs .city-tab').forEach(function(t) { t.classList.remove('active'); });
                    this.classList.add('active');
                    renderLocations(c.name);
                    currentCity = c.name;
                };
            })(city));
            inner.appendChild(btn);
        }
        tabs.innerHTML = '';
        tabs.appendChild(inner);
    }

    // ========================================
    // DESKTOP: SIDEBAR CITY TABS
    // ========================================
    function buildSidebarCityTabs() {
        var tabs = document.getElementById('sidebarCityTabs');
        var html = '';
        for (var i = 0; i < locationsData.cities.length; i++) {
            var city = locationsData.cities[i];
            var active = i === 0 ? ' active' : '';
            html += '<button class="city-tab' + active + '" data-city="' + city.name + '">' +
                '<span class="dot"></span>' + city.name +
                '<span class="count">' + city.locations.length + '</span>' +
            '</button>';
        }
        tabs.innerHTML = html;
        tabs.querySelectorAll('.city-tab').forEach(function(btn) {
            btn.addEventListener('click', (function(b) {
                return function() {
                    tabs.querySelectorAll('.city-tab').forEach(function(t) { t.classList.remove('active'); });
                    b.classList.add('active');
                    renderLocations(b.getAttribute('data-city'));
                    currentCity = b.getAttribute('data-city');
                };
            })(btn));
        });
    }

    // ========================================
    // FILTER CHIPS
    // ========================================
    function buildFilterChips() {
        var container = document.getElementById('filterChips');
        var filters = [
            { key: 'all', label: 'All' },
            { key: 'potential', label: 'Potential' },
            { key: 'food_truck_court', label: 'Court' },
            { key: 'existing', label: 'Existing' }
        ];
        container.innerHTML = '';
        filters.forEach(function(f) {
            var btn = document.createElement('button');
            btn.className = 'filter-chip' + (f.key === 'all' ? ' active' : '');
            btn.setAttribute('data-filter', f.key);
            btn.textContent = f.label;
            btn.addEventListener('click', function() {
                container.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
                this.classList.add('active');
                currentFilter = f.key;
                if (currentCity) renderLocations(currentCity);
            });
            container.appendChild(btn);
        });
    }

    // ========================================
    // RENDER LOCATIONS (shared by mobile + desktop)
    // ========================================
    function renderLocations(cityName) {
        var city = null;
        for (var ci = 0; ci < locationsData.cities.length; ci++) {
            if (locationsData.cities[ci].name === cityName) { city = locationsData.cities[ci]; break; }
        }
        if (!city) return;

        var filtered = city.locations;
        if (currentFilter !== 'all') {
            filtered = city.locations.filter(function(l) { return l.category === currentFilter; });
        }

        var html = buildProBannerHTML();
        for (var i = 0; i < filtered.length; i++) {
            html += buildCardHTML(filtered[i], city.name);
        }

        // Render in both mobile sheet and desktop sidebar
        var sheetListEl = document.getElementById('sheetList');
        var sidebarListEl = document.getElementById('sidebarList');
        if (sheetListEl) sheetListEl.innerHTML = html;
        if (sidebarListEl) sidebarListEl.innerHTML = html;

        // Update sheet header
        var sheetCountEl = document.getElementById('sheetCount');
        var sheetTitleEl = document.getElementById('sheetTitle');
        if (sheetCountEl) sheetCountEl.textContent = filtered.length + ' spots';
        if (sheetTitleEl) sheetTitleEl.textContent = city.name;
    }

    // ========================================
    // MAP MARKERS
    // ========================================
    function addAllMarkers() {
        for (var ci = 0; ci < locationsData.cities.length; ci++) {
            var city = locationsData.cities[ci];
            for (var i = 0; i < city.locations.length; i++) {
                var loc = city.locations[i];
                var color = categoryColors[loc.category] || '#888';
                var hint = seasonalHints[loc.id];
                var badgeClass = categoryBadgeClass[loc.category] || 'badge-type';
                var badgeLabel = categoryLabels[loc.category] || loc.category;
                var ratingHtml = loc.rating ? '<span class="badge badge-rating">&#11088; ' + loc.rating.toFixed(1) + '</span>' : '';
                var hoursHtml = loc.peakHours ? '<div class="popup-hours"><strong>&#128339; Peak:</strong> ' + loc.peakHours + '</div>' : '';
                var hintHtml = hint ? '<div class="popup-note"><strong>' + hint.emoji + '</strong> ' + hint.text + '</div>' : '';
                var notesHtml = loc.notes ? '<div class="popup-note">' + loc.notes + '</div>' : '';
                var popupHTML = '<div class="popup-title">' + loc.name + '</div>' +
                    '<div class="popup-badges"><span class="badge ' + badgeClass + '">' + badgeLabel + '</span>' + ratingHtml + '</div>' +
                    '<div class="popup-meta">' +
                        '<div><span class="popup-meta-label">Traffic</span><span class="popup-meta-val">' + loc.footTraffic + '</span></div>' +
                        '<div><span class="popup-meta-label">Competition</span><span class="popup-meta-val">' + loc.competition + '</span></div>' +
                        '<div><span class="popup-meta-label">Parking</span><span class="popup-meta-val">' + loc.parking + '</span></div>' +
                        '<div><span class="popup-meta-label">Rating</span><span class="popup-meta-val">' + (loc.rating ? loc.rating.toFixed(1) + '&#11088;' : 'N/A') + '</span></div>' +
                    '</div>' +
                    hoursHtml + hintHtml + notesHtml;

                var marker = L.circleMarker([loc.lat, loc.lng], {
                    radius: 11,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.85
                }).addTo(map);
                marker.bindPopup(popupHTML);
                marker.on('click', (function(m, l, c) {
                    return function() {
                        FTIQ.selectLocation(l.id, c.name);
                    };
                })(marker, loc, city));
                markers[loc.id] = marker;
            }
        }
    }

    // ========================================
    // BOTTOM SHEET INTERACTIONS
    // ========================================
    function openBottomSheet() {
        bottomSheet.classList.remove('closed', 'peek');
        bottomSheet.classList.add('full');
        sheetBackdrop.classList.add('visible');
    }

    function closeBottomSheet() {
        bottomSheet.classList.remove('full');
        bottomSheet.classList.add('peek');
        sheetBackdrop.classList.remove('visible');
    }

    function toggleFilters() {
        var panel = document.getElementById('filterPanel');
        var chevron = document.getElementById('filterChevron');
        panel.classList.toggle('open');
        chevron.classList.toggle('open');
    }

    // Touch handling for bottom sheet drag
    var sheetHandle = document.getElementById('sheetHandle');
    var sheetStartY = 0;
    var sheetCurrentY = 0;
    var isDragging = false;

    if (sheetHandle) {
        sheetHandle.addEventListener('touchstart', function(e) {
            isDragging = true;
            sheetStartY = e.touches[0].clientY;
            bottomSheet.style.transition = 'none';
        }, { passive: true });

        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            sheetCurrentY = e.touches[0].clientY;
            var delta = sheetCurrentY - sheetStartY;
            var sheetHeight = bottomSheet.offsetHeight;
            var maxTranslate = sheetHeight - 128; // peek height
            var currentTranslate = parseFloat(getComputedStyle(bottomSheet).transform.split(',')[5]) || 0;
            var newTranslate = Math.max(0, Math.min(maxTranslate, currentTranslate + delta));
            bottomSheet.style.transform = 'translateY(' + (newTranslate - maxTranslate) + 'px)';
            sheetStartY = sheetCurrentY;
        }, { passive: true });

        document.addEventListener('touchend', function() {
            if (!isDragging) return;
            isDragging = false;
            bottomSheet.style.transition = '';
            var transform = getComputedStyle(bottomSheet).transform;
            var translateY = parseFloat(transform.split(',')[5]) || 0;
            if (translateY < -100) {
                openBottomSheet();
            } else {
                closeBottomSheet();
            }
        });
    }

    // Click backdrop to close
    document.getElementById('sheetBackdrop').addEventListener('click', closeBottomSheet);

    // ========================================
    // RESPONSIVE LAYOUT
    // ========================================
    function updateLayout() {
        isDesktop = window.innerWidth >= 768;
        var layout = document.getElementById('layout');
        if (isDesktop) {
            layout.classList.add('desktop');
            closeBottomSheet();
        } else {
            layout.classList.remove('desktop');
        }
    }

    window.addEventListener('resize', function() {
        updateLayout();
    });

    // ========================================
    // PUBLIC API
    // ========================================
    window.FTIQ = {
        selectLocation: function(id, cityName) {
            selectedLocationId = id;

            // Clear all selections
            document.querySelectorAll('.location-card').forEach(function(c) { c.classList.remove('selected'); });

            // Select the card
            var card = document.getElementById('card-' + id);
            if (card) {
                card.classList.add('selected');
                // Scroll into view in the appropriate list
                var list = isDesktop ? document.getElementById('sidebarList') : document.getElementById('sheetList');
                if (list) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Fly to marker
            if (markers[id]) {
                map.flyTo(markers[id].getLatLng(), 14, { duration: 0.8 });
                setTimeout(function() { markers[id].openPopup(); }, 900);
            }

            // On mobile, open the bottom sheet
            if (!isDesktop) {
                openBottomSheet();
            }
        }
    };

    window.selectLocation = window.FTIQ.selectLocation;

    window.toggleFilters = toggleFilters;

    window.openSubmitModal = function() {
        document.getElementById('submitModal').classList.add('show');
        document.getElementById('submitForm').style.display = 'block';
        document.getElementById('submitSuccess').style.display = 'none';
        document.getElementById('submitForm').reset();
    };

    window.closeSubmitModal = function() {
        document.getElementById('submitModal').classList.remove('show');
    };

    document.getElementById('submitModal').addEventListener('click', function(e) {
        if (e.target === this) closeSubmitModal();
    });

    window.handleSubmit = function(e) {
        e.preventDefault();
        var form = e.target;
        var data = {
            name: form.name.value,
            city: form.city.value,
            notes: form.notes.value,
            email: form.email.value || null
        };
        console.log('Location submitted:', data);
        form.style.display = 'none';
        document.getElementById('submitSuccess').style.display = 'block';
        setTimeout(closeSubmitModal, 2500);
    };

    // Upgrade success
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgraded') === 'true') {
        localStorage.setItem('foodtruckIQPro', 'true');
        if (urlParams.get('session_id')) {
            fetch('https://quote-genius-server.onrender.com/code-by-session?session_id=' + urlParams.get('session_id') + '&product=foodtruckiq')
                .then(function(res) { return res.json(); })
                .then(function(data) { if (data.code) localStorage.setItem('foodtruckIQCode', data.code); })
                .catch(function() {});
        }
    }

    // ========================================
    // BOOT
    // ========================================
    fetch('data/locations.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            locationsData = data;
            buildStatsBar();
            buildMobileCityTabs();
            buildSidebarCityTabs();
            buildFilterChips();
            updateLayout();
            var firstCity = locationsData.cities[0].name;
            currentCity = firstCity;
            renderLocations(firstCity);
            addAllMarkers();
        });
})();
