const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const startPoint = ref('');
        const endPoint = ref('');
        const routeInfo = ref(null);
        const activePOI = ref(null);
        let mapInstance = null;
        let routingControl = null;
        let poiLayer = L.layerGroup();

        const poiTypes = [
            { label: 'Food', val: 'restaurant', icon: '🍴' },
            { label: 'Fuel', val: 'fuel', icon: '⛽' },
            { label: 'Med', val: 'hospital', icon: '🏥' },
            { label: 'Park', val: 'park', icon: '🌲' }
        ];

        const initMap = () => {
            mapInstance = L.map('map', { zoomControl: false, attributionControl: false })
            .setView([40.2798, -75.3855], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
            poiLayer.addTo(mapInstance);
        };

        const geocode = async (query) => {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.length > 0) return { lat: data[0].lat, lon: data[0].lon, name: data[0].display_name };
            throw new Error("Location not found");
        };

        const planTrip = async () => {
            if (!startPoint.value || !endPoint.value) return;
            try {
                const start = await geocode(startPoint.value);
                const end = await geocode(endPoint.value);

                if (routingControl) mapInstance.removeControl(routingControl);

                routingControl = L.Routing.control({
                    waypoints: [L.latLng(start.lat, start.lon), L.latLng(end.lat, end.lon)],
                                                   lineOptions: { styles: [{ color: '#6366f1', weight: 6, opacity: 0.8 }] },
                                                   createMarker: (i, wp) => L.marker(wp.latLng),
                                                   addWaypoints: false,
                                                   fitSelectedRoutes: true
                }).addTo(mapInstance);

                routingControl.on('routesfound', (e) => {
                    const s = e.routes[0].summary;
                    routeInfo.value = {
                        distance: (s.totalDistance / 1609.34).toFixed(1) + ' mi',
                                  duration: Math.round(s.totalTime / 60) + ' mins'
                    };
                });
            } catch (e) { alert(e.message); }
        };

        const findPOI = async (type) => {
            activePOI.value = type;
            poiLayer.clearLayers();
            const bounds = mapInstance.getBounds();
            const query = `[out:json];node["amenity"="${type}"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});out;`;

            try {
                const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
                const data = await res.json();
                data.elements.forEach(el => {
                    L.circleMarker([el.lat, el.lon], { color: '#6366f1', radius: 6 }).addTo(poiLayer)
                    .bindPopup(el.tags.name || type);
                });
            } catch (e) { console.error("POI search failed"); }
        };

        const clearAll = () => {
            if (routingControl) mapInstance.removeControl(routingControl);
            poiLayer.clearLayers();
            routeInfo.value = null;
            activePOI.value = null;
            startPoint.value = '';
            endPoint.value = '';
        };

        const locateMe = () => mapInstance.locate({setView: true, maxZoom: 16});
        const zoomIn = () => mapInstance.zoomIn();
        const zoomOut = () => mapInstance.zoomOut();

        onMounted(() => setTimeout(initMap, 100));

        return {
            startPoint, endPoint, routeInfo, poiTypes, activePOI,
            planTrip, findPOI, clearAll, locateMe, zoomIn, zoomOut
        };
    }
}).mount('#app');
