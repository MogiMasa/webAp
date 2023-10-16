var vm = new Vue({
    el: '#app',
    data: {
      mymap: undefined,
    },
    mounted: function() {
        // 地図を表示する処理。
        this.mymap = L.map('map').setView([35.6800328,139.7692996], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            axZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                        'Imagery Â© <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox.streets'
        }).addTo(this.mymap);
        L.control.scale().addTo(this.mymap);
    }
})
    