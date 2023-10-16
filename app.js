// import poi from "./poi.json" assert { type: "json" };
var vm = new Vue({
    el: '#app',
    data: {
      toggle_hs: false,
      toggle_mu: false,
      mymap: undefined,
      hs_array: [],
      mu_array: [],
      travelList: [], //自分で追加したマーカー
      poi: null,
      data: null,
      prompt: "を最短で巡回する場合の座標の順番を 'lat,lng' の文字列を:で区切って教えて下さい。", //gptに送る文章
      message: null, //gptから返ってきた文章
      chatGPT_APIkey: null,
      ekispert_APIkey: null,
      suggest: [] //AIの提案した経路
    },

    methods: {
        drawHotspring: function() {
            this.toggle_hs = !this.toggle_hs;
            //POIデータ(Hotspring)の表示
            var poi = this.poi;
            var hotsprings = poi.hotspring;
            if (this.toggle_hs) {
                hotsprings.forEach((e) => {
                    var marker = this.drawMarker(e);
                    this.hs_array.push(marker);
                });
            }else{
                this.hs_array.forEach((e) => {
                    this.mymap.removeLayer(e);
                });
            }
        },

        drawMuseum: function() {
            this.toggle_mu = !this.toggle_mu;
            //POIデータ(museum)の表示
            var poi = this.poi;
            var museums = poi.museum;
            if (this.toggle_mu) {
                museums.forEach((e) => {
                    var marker = this.drawMarker(e);
                    this.mu_array.push(marker);
                });
            }else{
                this.mu_array.forEach((e) => {
                    this.mymap.removeLayer(e);
                });
            }
        },

        drawMarker: function(poi_data) {
            var marker = L.marker([poi_data.lat, poi_data.lon], {title: poi_data.name});
            marker.on('dblclick', this.onMarkerDoubleClick).addTo(this.mymap).bindPopup(poi_data.name);
            return marker;
        },

        onMarkerDoubleClick: function(e) {
            vm.travelList.push({'name':e.target.options.title, 'lat':e.latlng.lat, 'lng':e.latlng.lng});
            console.log(e);
        },
        
        remove: function(index) {
            vm.travelList.splice(index,1);
        },
        
        //ChatGPTのAPIの機能
        getRequest: async function() {

            const requestOptions = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + String(this.chatGPT_APIkey)
                },
                body: JSON.stringify({
                  'model': 'gpt-3.5-turbo',
                  'messages': [
                    {
                        'role': 'system',
                        'content': JSON.stringify(this.travelList) + this.prompt,   
                    }
                  ]
                })
            };
            
            // TODO: travellistがnullの時の処時を追加
            console.log(JSON.stringify(this.travelList));
            fetch('https://api.openai.com/v1/chat/completions', requestOptions)
                .then(response => response.json())
                .then(data => {
                // console.log("Success:", data);
                this.message = data.choices[0].message.content;
                console.log("Message:", this.message);
                this.getEkispertRequest()
            }).catch(err => {
                console.log("chatgpt:Ran out of tokens for today! Try tomorrow!");
            });
        
        },

        getEkispertRequest: async function() {
            console.log("getEkispertRequest")

            const requestOptions = {
                method: 'GET'
            }

            const params = {
                answerCount: 1,
                key: this.ekispert_APIkey,
                viaList: this.message
                //TODO: 世界測地系に
            }
            
            fetch('https://api.ekispert.jp/v1/json/search/course/extreme?'+new URLSearchParams(params).toString(), requestOptions)
                .then(response => response.json())
                .then(data => {
                console.log("Success:", data);

                //TODO: dataの中身が配列かオブジェクトか確認しなければいけない
                
                if(Error in data.ResultSet){
                    // chatGPTが正しく返答しなかった場合
                    console.log("error in data.Resultset");
                }else{
                    var route = data.ResultSet.Course.Route;
                    console.log("Route:", route);
                    this.suggest.splice(0);  
                    for(let i=0; i<route.Point.length; i++){
                        if("Station" in route.Point[i]){
                            //駅名(地点名)がある場合
                            this.suggest.push(route.Point[i].Station.Name);
                            // console.log("suggest >>" , this.suggest);
                        }else if("Name" in route.Point[i]){
                            //選んだ旅行先のマーカー
                            console.log("travellist >> ", this.travelList);
                            console.log("route.Point >> ", route.Point[i].Name);
                            for(let j = 0; j < this.travelList.length; j++){ //全探索
                                if(route.Point[i].Name === this.travelList[j].lat+","+this.travelList[j].lng+",tokyo"){
                                    console.log("hit");
                                    this.suggest.push(this.travelList[j].name);
                                    break;
                                }
                            }
                            
                        }else{
                            console.log("error in route.Point");
                        }

                        if(i > 0) {
                            // LineはPointより1小さいので、i=0のときは無視し、i-1をしてインデックスを合わせる
                            if("Name" in route.Line[i-1]){
                                var date = new Date(route.Line[i-1].DepartureState.Datetime.text);
                                this.suggest.push(date.toLocaleTimeString() + " " + route.Line[i-1].Name); //出発時刻 + 路線名
                                
                            }else if(route.Line[i-1].distance === "0"){
                                console.log("near");
                            }else{
                                console.log("error in route.Line");
                            }
                        }
                    }
                    console.log("Suggest:", this.suggest);
                }
                
            }).catch(err => {
                console.log("ekispert:Ran out of tokens for today! Try tomorrow!");
            });
        
        },

        setLocalStorage: function() {
            // console.log(this.chatGPT_APIkey);
            localStorage.setItem('chatGPT_APIkey', this.chatGPT_APIkey);
            localStorage.setItem('ekispert_APIkey', this.ekispert_APIkey);
        }
    },
    //描画時
    mounted: function() {
        //APIキー取得
        this.chatGPT_APIkey = localStorage.getItem('chatGPT_APIkey');
        this.ekispert_APIkey = localStorage.getItem('ekispert_APIkey');
        
        //データ読み込み
        axios.get("poi.json").then(response => (this.poi = response.data));

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
 
        window.addEventListener('DOMContentLoaded', event => {
            // サイドバーの表示・非表示をトグルさせる処理。
            // Webページが読み込まれてDOMが構築されたタイミングで処理される。
            const sidebarToggle = document.body.querySelector('#sidebarToggle');
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', event => {
                    event.preventDefault();
                    document.body.classList.toggle('sb-sidenav-toggled');
                    localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
                });
            }   
        });

        //矩形領域の描画
        var xy = [[35.468259,139.251284], [35.817852, 139.251284],[35.817852,139.936556], [35.468259, 139.936556]];
        L.polygon(xy).addTo(this.mymap);
        
        latlngs=[]; //緯度経度の保存
        plines = [] //polylineの保存
        this.mymap.on('click', function(ev) {
            // console.log(ev);
            latlngs.push(ev.latlng);
            
            //線を引く
            if(latlngs.length > 1) {
                var pline = L.polyline([latlngs[latlngs.length - 2], ev.latlng]);
                var result = pline.on('click', onLineClick);
                pline.addTo(this);
            }
            //markerをクリックしたときの挙動
            var marker = L.marker(ev.latlng);
            marker.on('click', onMarkerClick).addTo(this);
        });

        function onMarkerClick(e) {
            //マーカーのclickイベント呼び出される
            //クリックされたマーカーを地図のレイヤから削除する
            // vm.mymap.removeLayer(e.target);
            alert("hello world");
        }

        function onLineClick(e) {
            vm.mymap.removeLayer(e.target);
        }           
    }
});