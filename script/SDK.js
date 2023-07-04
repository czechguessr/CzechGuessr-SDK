"use strict";
var CzechGuessr;
(function (CzechGuessr) {
    var SDK;
    (function (SDK) {
        /**
         * SDK Location class
         */
        class CGLocation {
            lat;
            lon;
            marker;
            constructor(lat, lon) {
                this.lat = lat;
                this.lon = lon;
                this.marker = new L.Marker([lat, lon]);
                this.marker.addTo(LMAP);
            }
            /**
             * Convert coords to array
             * @returns latitude, longitude
             */
            toArray() {
                return [this.lat, this.lon];
            }
        }
        let MAP;
        let LMAP;
        let PANO;
        let SPANO;
        let LOCATIONS;
        let BOUNDS;
        /**
         * Handle the click event on the map
         * @param e Leaflet mouse event
         */
        function handleMap(e) {
            SMap.Pano.getBest(SMap.Coords.fromWGS84(e.latlng.lng, e.latlng.lat), 100000).then((place) => {
                var coords = place.getCoords().toWGS84();
                LOCATIONS.push(new CGLocation(coords[1], coords[0]));
                rerenderTable();
                SPANO.show(place, { yaw: 1.8 * Math.PI });
            });
        }
        /**
         * Update table and JSON
         */
        function rerenderTable() {
            let json = {
                version: "1.0",
                name: $("#mapName").val(),
                author: $("#mapAuthor").val(),
                center: [
                    Number.parseFloat($("#mapCenterLat").val()),
                    Number.parseFloat($("#mapCenterLon").val()),
                    Number.parseInt($("#mapCenterZoom").val())
                ],
                locations: [],
            };
            let index = 0;
            $("#locBody").html("");
            for (let loc of LOCATIONS) {
                $("#locBody").append(`<tr>
    <td scope="row">${++index}</td>
    <td>${loc.lat}</td>
    <td>${loc.lon}</td>
    <td><i class="bi bi-x-square-fill text-danger" onclick="CzechGuessr.SDK.removeLocation(${index - 1});"></i></td>
    <td><i class="bi bi-eye text-success" onclick="CzechGuessr.SDK.previewLocation(${index - 1});"></i></td>
</tr>`);
                loc.marker.bindPopup(`#${index}`);
                json.locations.push(loc.toArray());
            }
            $("#jsonMap").text(JSON.stringify(json, null, 2));
        }
        SDK.rerenderTable = rerenderTable;
        /**
         * Delete location at idx
         * @param idx Index of the location
         */
        function removeLocation(idx) {
            LOCATIONS[idx].marker.remove();
            LOCATIONS.splice(idx, 1);
            rerenderTable();
        }
        SDK.removeLocation = removeLocation;
        /**
         * Load map, pano
         */
        function load() {
            LOCATIONS = [];
            MAP = $("#map");
            LMAP = new L.Map(MAP[0]).setView([49.799, 15.364], 7);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(LMAP);
            LMAP.on("click", handleMap);
            PANO = $("#pano");
            SPANO = new SMap.Pano.Scene(PANO[0]);
        }
        SDK.load = load;
        /**
         * Preview the random generation bounds on the map
         */
        function preview() {
            if (BOUNDS !== undefined) {
                BOUNDS.remove();
            }
            let minLon = $("#minLon").val();
            let maxLon = $("#maxLon").val();
            let minLat = $("#minLat").val();
            let maxLat = $("#maxLat").val();
            if (minLon > maxLon || minLat > maxLat) {
                alert("Minimum cannot be greater than maximum.");
                return;
            }
            BOUNDS = L.polygon([
                [minLat, minLon],
                [maxLat, minLon],
                [maxLat, maxLon],
                [minLat, maxLon],
            ]).addTo(LMAP);
        }
        SDK.preview = preview;
        /**
         * Generate random locations
         */
        async function generate() {
            let minLon = Number.parseFloat($("#minLon").val());
            let maxLon = Number.parseFloat($("#maxLon").val());
            let minLat = Number.parseFloat($("#minLat").val());
            let maxLat = Number.parseFloat($("#maxLat").val());
            let count = Number.parseInt($("#count").val());
            if (minLon > maxLon || minLat > maxLat) {
                alert("Minimum cannot be greater than maximum.");
                return;
            }
            if (count < 1) {
                alert("Count cannot be lower than 1");
                return;
            }
            for (let i = 0; i < count; i++) {
                newRandomLocation(minLon, maxLon, minLat, maxLat);
            }
        }
        SDK.generate = generate;
        /**
         * Generate new random location, if fails do recursively
         * @param minLon minimal longitude
         * @param maxLon maximal longitude
         * @param minLat minimal latitude
         * @param maxLat maximal latitude
         */
        async function newRandomLocation(minLon, maxLon, minLat, maxLat) {
            try {
                let lon = (Math.random() * (maxLon - minLon));
                let lat = (Math.random() * (maxLat - minLat));
                let place = await SMap.Pano.getBest(SMap.Coords.fromWGS84(lon + minLon, lat + minLat));
                var coords = place.getCoords().toWGS84();
                LOCATIONS.push(new CGLocation(coords[1], coords[0]));
                rerenderTable();
            }
            catch {
                newRandomLocation(minLon, maxLon, minLat, maxLat);
            }
        }
        function previewLocation(idx) {
            let loc = LOCATIONS[idx];
            SMap.Pano.getBest(SMap.Coords.fromWGS84(loc.lon, loc.lat)).then((place) => SPANO.show(place, { yaw: 1.8 * Math.PI }));
        }
        SDK.previewLocation = previewLocation;
    })(SDK = CzechGuessr.SDK || (CzechGuessr.SDK = {}));
})(CzechGuessr || (CzechGuessr = {}));
