namespace CzechGuessr.SDK {
    /**
     * SDK Location class
     */
    class CGLocation {
        public lat: number;
        public lon: number;
        public marker: L.Marker;
        constructor(lat: number, lon: number) {
            this.lat = lat;
            this.lon = lon;
            this.marker = new L.Marker([lat, lon]);
            this.marker.addTo(LMAP);
        }
        /**
         * Convert coords to array
         * @returns latitude, longitude
         */
        public toArray() {
            return [this.lat, this.lon];
        }
    }

    let MAP: JQuery<HTMLElement>;
    let LMAP: L.Map;
    let PANO: JQuery<HTMLElement>;
    let SPANO: SMap.Pano.Scene;
    let LOCATIONS: CGLocation[];
    let BOUNDS: L.Polygon;

    /**
     * Handle the click event on the map
     * @param e Leaflet mouse event
     */
    function handleMap(e: L.LeafletMouseEvent) {
        SMap.Pano.getBest(SMap.Coords.fromWGS84(e.latlng.lng, e.latlng.lat), 100000).then((place: SMap.Pano.Place) => {
            var coords = place.getCoords().toWGS84() as number[];
            LOCATIONS.push(new CGLocation(coords[1], coords[0]));
            rerenderTable();
            SPANO.show(place, { yaw: 1.8 * Math.PI });
        });
    }

    /**
     * Update table and JSON
     */
    export function rerenderTable() {
        let json = {
            version: "1.0",
            name: $("#mapName").val() as string,
            author: $("#mapAuthor").val() as string,
            center: [
                Number.parseFloat($("#mapCenterLat").val() as string),
                Number.parseFloat($("#mapCenterLon").val() as string),
                Number.parseInt($("#mapCenterZoom").val() as string)
            ],
            locations: [] as number[][],
        }
        let index = 0;
        $("#locBody").html("")
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

    /**
     * Delete location at idx
     * @param idx Index of the location
     */
    export function removeLocation(idx: number) {
        LOCATIONS[idx].marker.remove();
        LOCATIONS.splice(idx, 1);
        rerenderTable();
    }

    /**
     * Load map, pano
     */
    export function load() {
        LOCATIONS = [];
        MAP = $("#map");
        LMAP = new L.Map(MAP[0]).setView([49.799, 15.364], 7);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(LMAP);
        LMAP.on("click", handleMap)
        PANO = $("#pano");
        SPANO = new SMap.Pano.Scene(PANO[0]);
    }

    /**
     * Preview the random generation bounds on the map
     */
    export function preview() {
        if (BOUNDS !== undefined) {
            BOUNDS.remove();
        }
        let minLon = $("#minLon").val() as number;
        let maxLon = $("#maxLon").val() as number;
        let minLat = $("#minLat").val() as number;
        let maxLat = $("#maxLat").val() as number;
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

    /**
     * Generate random locations
     */
    export async function generate() {
        let minLon = Number.parseFloat($("#minLon").val() as string);
        let maxLon = Number.parseFloat($("#maxLon").val() as string);
        let minLat = Number.parseFloat($("#minLat").val() as string);
        let maxLat = Number.parseFloat($("#maxLat").val() as string);
        let count = Number.parseInt($("#count").val() as string);
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

    /**
     * Generate new random location, if fails do recursively
     * @param minLon minimal longitude
     * @param maxLon maximal longitude
     * @param minLat minimal latitude
     * @param maxLat maximal latitude
     */
    async function newRandomLocation(minLon: number, maxLon: number, minLat: number, maxLat: number) {
        try {
            let lon = (Math.random() * (maxLon - minLon));
            let lat = (Math.random() * (maxLat - minLat));
            let place = await SMap.Pano.getBest(SMap.Coords.fromWGS84(lon + minLon, lat + minLat));
            var coords = place.getCoords().toWGS84() as number[];
            LOCATIONS.push(new CGLocation(coords[1], coords[0]));
            rerenderTable();
        } catch {
            newRandomLocation(minLon, maxLon, minLat, maxLat);
        }
    }

    export function previewLocation(idx: number) {
        let loc = LOCATIONS[idx];
        SMap.Pano.getBest(SMap.Coords.fromWGS84(loc.lon, loc.lat)).then((place: SMap.Pano.Place) => SPANO.show(place, { yaw: 1.8 * Math.PI }));
    }
}