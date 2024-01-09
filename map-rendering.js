document.addEventListener("DOMContentLoaded", function () {
    const mapCenter = [-15.793889, -47.882778];

    const myMap = L.map('map', { zoomControl: false }).setView(mapCenter, 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(myMap);

    const pontos = [
        { lat: -27.601996145321202, long: -48.55201843558214, texto: 'GopherCon Brasil' },
        { lat: -23.55736284085273, long: -46.66796755767078, texto: 'TDC SUMMIT SP' },
    ];

    const markers = L.markerClusterGroup();
    pontos.forEach(ponto => {
        const marker = L.marker([ponto.lat, ponto.long]);
        marker.bindPopup(ponto.texto);
        markers.addLayer(marker);
    });

    myMap.addLayer(markers);

    myMap.on('resize', function() {
        myMap.invalidateSize();
    });
});