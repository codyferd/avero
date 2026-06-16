const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const globalSearchQuery = ref('');
        const startPoint = ref('');
        const endPoint = ref('');
        const routeInfo = ref(null);
        const activePOI = ref(null);
        const isInspecting = ref(false);
        
        const suggestions = ref({ global: [], start: [], end: [] });
        const selectedNodeInfo = ref(null);

        let mapInstance = null;
        let routingControl = null;
        let poiLayer = null;
        let standaloneMarkerLayer = null;
        let searchTimer = null;

        // EXPANDED MATRIX SCAN POI REGISTRATION ARRAY
        const poiTypes = [
            { label: 'Food', val: 'restaurant', icon: '🍴' },
            { label: 'Fuel', val: 'fuel', icon: '⛽' },
            { label: 'Hospital', val: 'hospital', icon: '🏥' },
            { label: 'Hotel', val: 'hotel', icon: '🏨' },
            { label: 'Cafe', val: 'cafe', icon: '☕' },
            { label: 'Charging', val: 'charging_station', icon: '⚡' },
            { label: 'Park', val: 'park', icon: '🌳' },
            { label: 'Cinema', val: 'cinema', icon: '🎬' },
            { label: 'Bank', val: 'bank', icon: '🏦' },
        ];

        const initMap = () => {
            // Instantiate map context centered on regional coordinate bounds
            mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([40.7128, -74.0060], 12);

            // CHANGED: Fixed monotone gray by deploying Stadia Smooth Dark asset nodes
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 20
            }).addTo(mapInstance);

            poiLayer = L.layerGroup().addTo(mapInstance);
            standaloneMarkerLayer = L.layerGroup().addTo(mapInstance);
            
            // Native Map Intercept Tap Registry Click Link
            mapInstance.on('click', (e) => {
                reverseGeocodeMapCoordinates(e.latlng.lat, e.latlng.lng);
            });
        };

        // NEW: Real Reverse Geocoding Address Lookup Pipeline Engine
        const reverseGeocodeMapCoordinates = async (lat, lon) => {
            isInspecting.value = true;
            
            // Build out a predictive container frame while processing responses
            selectedNodeInfo.value = {
                title: "Resolving geospatial node markers...",
                coords: `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`,
                latLng: L.latLng(lat, lon)
            };

            // Flash a visual marker highlight onto the location immediately
            standaloneMarkerLayer.clearLayers();
            L.circleMarker([lat, lon], { color: '#6366f1', radius: 10, weight: 2, fillOpacity: 0.3 }).addTo(standaloneMarkerLayer);

            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
                if (!response.ok) throw new Error();
                const data = await response.json();
                
                // Assemble address fragments into a coherent descriptive title
                const resolvedTitle = data.display_name || `Coordinate Anchor (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
                
                selectedNodeInfo.value.title = resolvedTitle;
            } catch (err) {
                selectedNodeInfo.value.title = `Dropped Pin Marker Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
            } finally {
                isInspecting.value = false;
            }
        };

        const debounceSearch = (type) => {
            clearTimeout(searchTimer);
            let query = '';
            if (type === 'global') query = globalSearchQuery.value;
            else if (type === 'start') query = startPoint.value;
            else query = endPoint.value;

            if (query.length < 3) {
                suggestions.value[type] = [];
                return;
            }

            searchTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6`);
                    if (res.ok) {
                        suggestions.value[type] = await res.json();
                    }
                } catch (e) { console.error("Search failed"); }
            }, 350);
        };

        const selectLoc = (type, loc) => {
            const targetLatLng = L.latLng(loc.lat, loc.lon);
            suggestions.value[type] = [];

            if (type === 'global') {
                globalSearchQuery.value = loc.display_name;
                standaloneMarkerLayer.clearLayers();
                
                L.circleMarker(targetLatLng, { color: '#10b981', radius: 12, weight: 3, fillOpacity: 0.2 }).addTo(standaloneMarkerLayer);
                L.marker(targetLatLng).addTo(standaloneMarkerLayer);
                
                mapInstance.setView(targetLatLng, 14);
                
                selectedNodeInfo.value = {
                    title: loc.display_name,
                    coords: `Lat: ${parseFloat(loc.lat).toFixed(5)}, Lon: ${parseFloat(loc.lon).toFixed(5)}`,
                    latLng: targetLatLng
                };
            } else {
                if (type === 'start') startPoint.value = loc.display_name;
                else endPoint.value = loc.display_name;
                mapInstance.panTo(targetLatLng);
            }
        };

        const setInspectedAsRoute = (type) => {
            if (!selectedNodeInfo.value || isInspecting.value) return;
            if (type === 'start') {
                startPoint.value = selectedNodeInfo.value.title;
            } else {
                endPoint.value = selectedNodeInfo.value.title;
            }
            selectedNodeInfo.value = null;
            standaloneMarkerLayer.clearLayers();
        };

        const geocode = async (query) => {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();
            if (data[0]) return L.latLng(data[0].lat, data[0].lon);
            throw new Error(`Location not found: ${query}`);
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
                    lineOptions: { styles: [{ color: '#6366f1', weight: 6, opacity: 0.85 }] },
                    router: L.Routing.osrmv1({ 
                        serviceUrl: 'https://router.project-osrm.org/route/v1',
                        profile: 'driving'
                    }),
                    createMarker: (i, wp) => L.marker(wp.latLng, { draggable: false }),
                    addWaypoints: false,
                    fitSelectedRoutes: true,
                    show: false
                }).addTo(mapInstance);

                routingControl.on('routesfound', (e) => {
                    const s = e.routes[0].summary;
                    routeInfo.value = {
                        distance: (s.totalDistance / 1609.34).toFixed(1) + ' miles',
                        duration: Math.round(s.totalTime / 60) + ' mins'
                    };
                });

                routingControl.on('routingerror', () => {
                    alert("Avero Route Failure: No roadway routes could be established between these anchors.");
                });

            } catch (e) { alert(e.message); }
        };

        const findPOI = async (type) => {
            if (activePOI.value === type) {
                activePOI.value = null;
                poiLayer.clearLayers();
                return;
            }
            
            activePOI.value = type;
            poiLayer.clearLayers();
            const b = mapInstance.getBounds();
            
            // Matrix Scan Query compilation filters over nodes and matching amenity pathways
            const query = `[out:json];(node["amenity"="${type}"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});node["leisure"="${type}"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}););out 50;`;

            try {
                const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
                const data = await res.json();
                
                data.elements.forEach(el => {
                    const marker = L.circleMarker([el.lat, el.lon], { 
                        color: '#6366f1', 
                        fillColor: '#ffffff',
                        fillOpacity: 0.9, 
                        radius: 6,
                        weight: 2
                    });
                    
                    const markerName = el.tags.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Feature Node`;
                    marker.bindPopup(`<b>${markerName}</b>`);
                    marker.addTo(poiLayer);

                    marker.on('click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        reverseGeocodeMapCoordinates(el.lat, el.lon);
                    });
                });
            } catch (e) { console.error("POI fetch failed."); }
        };

        const clearAll = () => {
            if (routingControl) mapInstance.removeControl(routingControl);
            poiLayer.clearLayers();
            standaloneMarkerLayer.clearLayers();
            globalSearchQuery.value = '';
            startPoint.value = '';
            endPoint.value = '';
            routeInfo.value = null;
            selectedNodeInfo.value = null;
            activePOI.value = null;
        };

        onMounted(() => setTimeout(initMap, 100));

        return {
            globalSearchQuery, startPoint, endPoint, routeInfo, activePOI, suggestions, poiTypes, selectedNodeInfo, isInspecting,
            debounceSearch, selectLoc, setInspectedAsRoute, planTrip, findPOI, clearAll,
            locateMe: () => mapInstance.locate({setView: true, maxZoom: 14}),
            zoomIn: () => mapInstance.zoomIn(),
            zoomOut: () => mapInstance.zoomOut()
        };
    }
}).mount('#app');
