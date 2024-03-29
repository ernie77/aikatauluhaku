var asemat = []
var asc = "" //muuttuja aseman lyhytkoodille
var stops = [] //array johon kerätään asemalle pysähtyvien junien tiedot
var laika;
var ennuste;
var raide;
function getStations() {
	return fetch("https://rata.digitraffic.fi/api/v1/metadata/stations").then((response) => response.json())
}
function getStationData() {
	return Promise.all([getStations()])
}
function getTrains() {
	return fetch("https://rata.digitraffic.fi/api/v1/live-trains/station/"+asc+"?arrived_trains=0&arriving_trains=0&departed_trains=0&departing_trains=30").then((response) => response.json())
}
function getTrainData() {
	return Promise.all([getTrains()])
}

$(document).on("keydown", "form", function(event) { 
    return event.key != "Enter";
});

getStationData().then(([asemat]) => {
	asemat.forEach(function(item) {
		if (item.passengerTraffic == true) {
			$('#lista').append('<option value="'+item.stationName+'">'+item.stationName+'</option>')
		}
	})
	$('#asemat').focus()
	$(function() {
		$('#asemat').blur(function() {
			var i = this.value
			asemat.forEach(function(item) {
				if (item.stationName === i) {
					asc = item.stationShortCode	
				}
			})
			if (!asc) {
				throw new Error("Something went badly wrong!");
			}	
  	 	console.log("aseman koodi --> " + asc + " aseman nimi --> " + i)
   		$('.search').html(i)
			getTrainData().then(([junat]) => {
				junat.forEach(function(item) {
					if (item.trainCategory == "Shunting" || item.trainCategory == "Test drive") {
					} else {
					if (!item.commuterLineID) {
						//kaukojunan tunnus
						j=item.trainType+" "+item.trainNumber
					} else {
						//lähijunan tunnut
						j=item.commuterLineID
					}
					item.timeTableRows.forEach(function(item) {
						if (item.stationShortCode == asc && item.type == "DEPARTURE") {
							//junan aikataulun mukainen lähtöaika
							laika = new Date(item.scheduledTime)
							ennuste=null					
							if (item.liveEstimateTime && item.differenceInMinutes > 0) {
								//jos juna on myöhässä
								ennuste = new Date(item.liveEstimateTime)								
							}
							if (item.cancelled == true) {
								//juna peruttu
								ennuste="Peruttu"
							}					
							//junan lähtöraide
							raide = item.commercialTrack
						}
						//haetaan aikataulun viimeinen asema
						last = item.stationShortCode
					})
					asemat.forEach(function(item) {
						if (item.stationShortCode === last) {
							loppuasema = item.stationName.replace(" asema","")
							if (loppuasema.includes('_(') ) {
								loppuasema = loppuasema.substr(0, item.stationName.indexOf('_'))	
							}
						}		
					})
					stops.push({lahtoaika: laika, ennuste: ennuste, raide: raide, juna: j, loppuasema: loppuasema}) //tuupataan tarvittavat tiedot arrayhin
				}
			})
			stops.sort(function (a,b) {
				return a.lahtoaika - b.lahtoaika //järjestää arrayn lähtöajan mukaan
			})
			var content = "<table><thead><tr><th>Juna</th><th>Aika</th><th>Raide</th><th>Määräasema</th></tr></thead><tbody>"
			stops.forEach(function(item) {
				content += "<tr><td>"+item.juna+"</td>"
				content += "<td>"
					+(item.lahtoaika.getHours()<10?'0':'')
					+item.lahtoaika.getHours()+":"
					+(item.lahtoaika.getMinutes()<10?'0':'')
					+item.lahtoaika.getMinutes()
				
				if ($.type(item.ennuste) === "string") {
					content += "<span class='ennuste'> Peruttu</span>"
				} else if (item.ennuste != null) {
					content += "<span class='ennuste'> ~"
						+(item.ennuste.getHours()<10?'0':'')
						+item.ennuste.getHours()
						+":"+(item.ennuste.getMinutes()<10?'0':'')
						+item.ennuste.getMinutes()+"</span>"
				}
				content += "</td>"
				
				content += "<td>"+item.raide+"</td>"
				content += "<td>"+item.loppuasema+"</td></tr>"
				})
			content += "</tbody></table>"
			$('#result').append(content)
			})
		})
	})
})