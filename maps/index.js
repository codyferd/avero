const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const startPoint = ref('');
        const endPoint = ref('');
        const routeInfo = ref(null);
        const activePOI = ref(null);
        const suggestions = ref({ start: [], end: [] });

        let mapInstance = null;
        let routingControl = null;
        let poiLayer = null;
        let searchTimer = null;

        const poiTypes = [
            { label: 'Food', val: 'restaurant', icon: '🍴' },
            { label: 'Fuel', val: 'fuel', icon: '⛽' },
            { label: 'Hospital', val: 'hospital', icon: '🏥' }
        ];

        const initMap = () => {
            mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([40.7128, -74.0060], 13);

            // Use CartoDB Dark Matter for a clean Avero look
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapInstance);

            poiLayer = L.layerGroup().addTo(mapInstance);
        };

        const debounceSearch = (type) => {
            clearTimeout(searchTimer);
            const query = type === 'start' ? startPoint.value : endPoint.value;
            if (query.length < 3) return;

            searchTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                    suggestions.value[type] = await res.json();
                } catch (e) { console.error("Search failed"); }
            }, 400);
        };

        const selectLoc = (type, loc) => {
            if (type === 'start') startPoint.value = loc.display_name;
            else endPoint.value = loc.display_name;
            suggestions.value[type] = [];
            mapInstance.panTo([loc.lat, loc.lon]);
        };

        const geocode = async (query) => {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();
            if (data[0]) return L.latLng(data[0].lat, data[0].lon);
            throw new Error("Location not found");
        };

        const planTrip = async () => {
            if (!startPoint.value || !endPoint.value) return;

            try {
                const startLoc = await geocode(startPoint.value);
                const endLoc = await geocode(endPoint.value);

                if (routingControl) {
                    mapInstance.removeControl(routingControl);
                }

                routingControl = L.Routing.control({
                    waypoints: [startLoc, endLoc],
                    lineOptions: { styles: [{ color: '#6366f1', weight: 6, opacity: 0.9 }] },
                    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
                                                   createMarker: (i, wp) => L.marker(wp.latLng, { draggable: true }),
                                                   addWaypoints: false,
                                                   fitSelectedRoutes: true,
                                                   show: false // Hides the default text instructions panel
                }).addTo(mapInstance);

                routingControl.on('routesfound', (e) => {
                    const s = e.routes[0].summary;
                    routeInfo.value = {
                        distance: (s.totalDistance / 1609.34).toFixed(1) + ' miles',
                                  duration: Math.round(s.totalTime / 60) + ' mins'
                    };
                });

                routingControl.on('routingerror', () => {
                    alert("Could not find a road route between these points.");
                });

            } catch (e) {
                alert(e.message);
            }
        };

        const findPOI = async (type) => {
            activePOI.value = type;
            poiLayer.clearLayers();
            const b = mapInstance.getBounds();
            const query = `[out:json];node["amenity"="${type}"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});out;`;

            try {
                const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
                const data = await res.json();
                data.elements.forEach(el => {
                    L.circleMarker([el.lat, el.lon], { color: '#6366f1', fillOpacity: 0.8, radius: 8 })
                    .bindPopup(el.tags.name || type)
                    .addTo(poiLayer);
                });
            } catch (e) { console.error("POI fail"); }
        };

        const clearAll = () => {
            if (routingControl) mapInstance.removeControl(routingControl);
            poiLayer.clearLayers();
            startPoint.value = '';
            endPoint.value = '';
            routeInfo.value = null;
        };

        onMounted(() => setTimeout(initMap, 100));

        return {
            startPoint, endPoint, routeInfo, activePOI, suggestions, poiTypes,
          debounceSearch, selectLoc, planTrip, findPOI, clearAll,
          locateMe: () => mapInstance.locate({setView: true, maxZoom: 15}),
          zoomIn: () => mapInstance.zoomIn(),
          zoomOut: () => mapInstance.zoomOut()
        };
    }
}).mount('#app');

