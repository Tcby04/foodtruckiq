// FoodTruckIQ - Main Application JS
(function() {
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
        'fay-downtown':   { emoji: '&#127882;', text: 'Best on weekends &#8212; college crowd, events & nightlife' },
        'fay-uofa':       { emoji: '&#128218;', text: 'Lunch rush only &#8212; campus quiets down on weekends' },
        'fay-lake':       { emoji: '&#127793;', text: 'Peak summer weekends &#8212; families, joggers, sunset crowds' },
        'fay-514':        { emoji: '&#127744;', text: 'Newly opened &#8212; low competition, nice outdoor space' },
        'ben-downtown':   { emoji: '&#128693;', text: 'Weekday lunch is strong &#8212; downtown office workers' },
        'ben-crystal':    { emoji: '&#127912;', text: 'Tourist season peaks spring&#8211;fall &#8212; museum hours apply' },
        'ben-8thstreet':  { emoji: '&#128685;', text: 'Consistent foot traffic &#8212; evenings & weekends draw crowds' },
        'spr-boardwalk':  { emoji: '&#127942;', text: 'Award-winning court &#8212; weekend dinners are packed, arrive early' },
        'rog-downtown':   { emoji: '&#129389;', text: 'Growing food scene &#8212; Friday evenings attract the downtown crowd' },
        'rog-promenade':  { emoji: '&#128722;', text: 'Weekend traffic peaks midday &#8212; competition with food court' },
        'centerton-park': { emoji: '&#129482;', text: 'Family-focused &#8212; weekends & dinner time draw the playground crowd' },
        'bv-towncenter':  { emoji: '&#127960;', text: 'Quiet weekday mornings &#8212; POA community, low-key traffic' }
    };

    var map = L.map('map').setView([36.25, -94.15], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    var locationsData;
    var markers = {};

    function buildStatsBar() {
        var total = 0, courts = 0, potential = 0;
        for (var i = 0; i < locationsData.cities.length; i++) {
            var city = locationsData.cities[i];
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

    function buildCityTabs() {
        var tabs = document.getElementById('cityTabs');
        var html = '';
        for (var i = 0; i < locationsData.cities.length; i++) {
            var city = locationsData.cities[i];
            var active = city === locationsData.cities[0] ? ' active' : '';
            html += '<button class="city-tab' + active + '" data-city="' + city.name + '">' +
                '<span class="dot"></span>' + city.name +
                '<span class="count">' + city.locations.length + '</span>' +
            '</button>';
        }
        tabs.innerHTML = html;
        var tabBtns = tabs.querySelectorAll('.city-tab');
        for (var k = 0; k < tabBtns.length; k++) {
            tabBtns[k].addEventListener('click', (function(btn) {
                return function() {
                    var allTabs = document.querySelectorAll('.city-tab');
                    for (var m = 0; m < allTabs.length; m++) allTabs[m].classList.remove('active');
                    btn.classList.add('active');
                    renderLocations(btn.getAttribute('data-city'));
                };
            })(tabBtns[k]));
        }
    }

    function short(str) {
        if (!str) return '';
        var first = str.split(',')[0].trim();
        return first;
    }

    function renderLocations(cityName) {
        var city = null;
        for (var ci = 0; ci < locationsData.cities.length; ci++) {
            if (locationsData.cities[ci].name === cityName) { city = locationsData.cities[ci]; break; }
        }
        if (!city) return;
        var list = document.getElementById('locationList');
        var html = '<div class="pro-banner">' +
            '<div class="pro-banner-title">&#9889; FoodTruckIQ Pro</div>' +
            '<ul class="pro-banner-features">' +
                '<li>Analytics & heatmaps</li>' +
                '<li>Unlimited locations</li>' +
                '<li>Schedule planning</li>' +
                '<li>All NWA cities + more</li>' +
            '</ul>' +
            '<a href="https://buy.stripe.com/14A28r5it1tvafhbyo8EM09" target="_blank" class="btn btn-pro">Upgrade &#8212; $3/month</a>' +
        '</div>';
        for (var i = 0; i < city.locations.length; i++) {
            var loc = city.locations[i];
            var hint = seasonalHints[loc.id];
            var badgeClass = categoryBadgeClass[loc.category] || 'badge-type';
            var accentColor = categoryCardAccent[loc.category] || 'var(--border)';
            var peakShort = short(loc.peakHours);
            var parkingShort = short(loc.parking);
            var ratingHtml = loc.rating ? '<span class="badge badge-rating">&#11088; ' + loc.rating.toFixed(1) + '</span>' : '';
            var addressHtml = loc.address ? '<span class="badge badge-type">&#128205; Has address</span>' : '';
            var hoursHtml = loc.peakHours ? '<div class="card-hours"><span>&#128339;</span><span>Peak hours: <strong>' + loc.peakHours + '</strong></span></div>' : '';
            var hintHtml = hint ? '<div class="card-hint"><span class="emoji">' + hint.emoji + '</span>' + hint.text + '</div>' : '';
            html += '<div class="location-card" id="card-' + loc.id + '" style="--card-accent:' + accentColor + ';animation-delay:' + (i * 45) + 'ms" onclick="selectLocation(\'' + loc.id + '\')">' +
                '<div class="card-top"><div class="card-name">' + loc.name + '</div></div>' +
                '<div class="card-badges">' +
                    '<span class="badge ' + badgeClass + '">' + (categoryLabels[loc.category] || loc.category) + '</span>' +
                    ratingHtml + addressHtml +
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
        list.innerHTML = html;
    }

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
                    '<div class="popup-badges">' +
                        '<span class="badge ' + badgeClass + '">' + badgeLabel + '</span>' +
                        ratingHtml +
                    '</div>' +
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
                (function(m, l, c) {
                    m.on('click', function() { selectLocation(l.id, c.name); });
                })(marker, loc, city);
                markers[loc.id] = marker;
            }
        }
    }

    window.selectLocation = function(id) {
        var cards = document.querySelectorAll('.location-card');
        for (var i = 0; i < cards.length; i++) cards[i].classList.remove('selected');
        var card = document.getElementById('card-' + id);
        if (card) { card.classList.add('selected'); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        if (markers[id]) { map.flyTo(markers[id].getLatLng(), 14, { duration: 0.8 }); markers[id].openPopup(); }
    };

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
        var data = { name: form.name.value, city: form.city.value, notes: form.notes.value, email: form.email.value || null };
        console.log('Location submitted:', data);
        form.style.display = 'none';
        document.getElementById('submitSuccess').style.display = 'block';
        setTimeout(closeSubmitModal, 2500);
    };

    // Upgrade success handler
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

    // Boot
    fetch('data/locations.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            locationsData = data;
            buildStatsBar();
            buildCityTabs();
            renderLocations(locationsData.cities[0].name);
            addAllMarkers();
        });
})();
