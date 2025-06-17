const map = L.map('map').setView([27.7, 85.3], 7); // Default: Nepal
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
}).addTo(map);

let marker = L.marker([27.7, 85.3], { draggable: true }).addTo(map);

// Hidden fields update on drag
marker.on('dragend', function () {
    const pos = marker.getLatLng();
    document.getElementById('lat').value = pos.lat.toFixed(6);
    document.getElementById('lon').value = pos.lng.toFixed(6);
});

// Click on map updates marker
map.on('click', function (e) {
    const lat = e.latlng.lat.toFixed(6);
    const lon = e.latlng.lng.toFixed(6);
    marker.setLatLng([lat, lon]);
    document.getElementById('lat').value = lat;
    document.getElementById('lon').value = lon;
});

// Setup for address field + suggestions box
const addressInput = document.getElementById("address");
const suggestionsBox = document.getElementById("suggestions");
let nearbyAddresses = [];

// 🧭 Ask for location and search nearby
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async function (position) {
        const lat = parseFloat(position.coords.latitude).toFixed(6);
        const lon = parseFloat(position.coords.longitude).toFixed(6);
        document.getElementById('lat').value = lat;
        document.getElementById('lon').value = lon;

        map.setView([lat, lon], 16);
        marker.setLatLng([lat, lon]);

        // Search nearby within bounding box (~0.5km)
        const boxSize = 0.005;
        const url = `https://nominatim.openstreetmap.org/search?format=json&bounded=1&limit=10&viewbox=${lon - boxSize},${lat + boxSize},${lon + boxSize},${lat - boxSize}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.length > 0) {
            nearbyAddresses = data.map(place => place.display_name);
        }
    });
}

// 🧠 Show suggestions as user types
addressInput.addEventListener("input", function () {
    const inputVal = this.value.toLowerCase();
    suggestionsBox.innerHTML = "";

    if (inputVal.length < 2) return;

    nearbyAddresses.forEach(item => {
        if (item.toLowerCase().includes(inputVal)) {
            const div = document.createElement("div");
            div.textContent = item;
            div.className = "suggestion-item";
            div.onclick = () => {
                addressInput.value = item;
                suggestionsBox.innerHTML = "";

                // Geocode again to center map to selected suggestion
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data[0]) {
                            const lat = parseFloat(data[0].lat).toFixed(6);
                            const lon = parseFloat(data[0].lon).toFixed(6);
                            marker.setLatLng([lat, lon]);
                            map.setView([lat, lon], 16);
                            document.getElementById('lat').value = lat;
                            document.getElementById('lon').value = lon;
                        }
                    });
            };
            suggestionsBox.appendChild(div);
        }
    });
});

// Hide suggestions on blur
addressInput.addEventListener("blur", () => {
    setTimeout(() => suggestionsBox.innerHTML = "", 200);
});
