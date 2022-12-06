
// -------------------- Color and Grades Setup -------------------- //
let maximumMovement = 0;
let legendColorScheme = ['#fff7ec','#fee8c8','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#990000']
let legendColorSchemeB = ['#FFEDA0','#FED976','#FEB24C','#FD8D3C','#FC4E2A','#E31A1C','#BD0026','#800026']

function getGrades() {
	return [0, 
		Math.floor(maximumMovement*0.15), 
		Math.floor(maximumMovement*0.25), 
		Math.floor(maximumMovement*0.40), 
		Math.floor(maximumMovement*0.50), 
		Math.floor(maximumMovement*0.60), 
		Math.floor(maximumMovement*0.75), 
		Math.floor(maximumMovement*0.85)];
}

function getColorFromScheme(index) {
	//return legendColorScheme[index];
	return legendColorSchemeB[index];
}

function getColorFromValue(d) {
	var _grades = getGrades();
	for (var _i = _grades.length-1; _i >= 0; _i--) {
		if (d > _grades[_i]){
			return getColorFromScheme(_i);
		}
	}
	return getColorFromScheme(0);
}

// -------------------- Color Legend Setup -------------------- //
// Creates a Legend Control
let legendColor = L.control({position: 'bottomright'});

// Function called when added to map
legendColor.onAdd = function (map) {
	this._div = L.DomUtil.create('div', 'info legend'); // create a div with a class "info"
    this.update();
    return this._div;
};
// Updates legend according to "maximumMoviment"
legendColor.update = function (props) {
	const grades = getGrades();
	const labels = [];
	let from, to;
	for (let i = 0; i < grades.length; i++) {
		from = grades[i];
		to = grades[i + 1];
		labels.push(`<i style="background:${getColorFromValue(from + 1)}"></i> ${from}${to-1 ? `&ndash;${to-1}` : `&ndash;${maximumMovement}`}`);
	}
	this._div.innerHTML = '<h2><u>Movement:</u></h2>' + labels.join('<br>');// + "<br>" + "Max: " + maximumMovement  ;
};

// Adds to the map
legendColor.addTo(map);

// -------------------- Flowmap Layer Setup -------------------- //
var flowmapODFieldIds = {
	originUniqueIdField: 'Origin',
	originGeometry: {
		x: 'or_lng',
		y: 'or_lat'
	},
	destinationUniqueIdField: 'Destination',
	destinationGeometry: {
		x: 'dest_lng',
		y: 'dest_lat'
	}
}

function getClassBreakInfos() {
	var _list = []
	var _grades = getGrades();
	// Push value 0
	_list.push({classMinValue: -1,
		classMaxValue: 0,
		symbol:{
			type: 'simple',
			strokeStyle: '#00000000',
			lineWidth: 0,
			lineCap: 'round',
			shadowColor: '#00000000',
			shadowBlur: 0
		}
	})
	for (var _i = 1; _i <= _grades.length;  _i++) {
		var _obj = {
			classMinValue: (_i == 1) ? 1 : _grades[_i - 1],
			classMaxValue: (_i == _grades.length) ? maximumMovement : _grades[_i] - 1,
			symbol: {
				strokeStyle: getColorFromScheme(_i - 1),//'#fee8c8',
				lineWidth: 3.5 + (_i * 1.5),
				lineCap: 'round',
				shadowColor: getColorFromScheme(_i - 1),
				shadowBlur: 2.0
			}
		}
		_list.push(_obj)
	}
	//console.log(_list);
	return _list
}

function getFlowmapCanvazBezierStyle() {
	var flowmapCanvazBezierStyle = {
		type: 'classBreaks',
		field: 'Value',
		classBreakInfos: getClassBreakInfos(),
		defaultSymbol: {
			strokeStyle: '#888888',
			lineWidth: 0.5,
			lineCap: 'round',
			shadowColor: '#888888',
			shadowBlur: 1.5
		},
	}
	return flowmapCanvazBezierStyle
}



var flowmapStyleFunction = function(geoJsonFeature) {
	// use leaflet's path styling options
	// since the GeoJSON feature properties are modified by the layer,
	// developers can rely on the "isOrigin" property to set different
	// symbols for origin vs destination CircleMarker stylings
	
	if (geoJsonFeature.properties.isOrigin) {
		return {
			//renderer: L.canvas(), // recommended to use your own L.canvas()
			radius: 20,
			weight: 1,
			color: 'rgb(195, 255, 62)',
			fillColor: 'rgba(195, 255, 62, 0.6)',
			fillOpacity: 1,
			pane: 'flowmapIcons'
		};
		} else {
		return {
			//renderer: L.canvas(),
			radius: 10,
			weight: 0.25,
			color: 'rgb(17, 142, 170)',
			fillColor: 'rgb(17, 142, 170)',
			fillOpacity: 0.7,
			pane: 'flowmapIcons'
		};
		}
}



let oneToManyFlowmapLayer = L.canvasFlowmapLayer();
setupFlowmap();


//console.log (oneToManyFlowmapLayer)
// Selection for dispaly
var popup = L.popup();
function flowmapMouseClickFunction (e) {
	console.log(e)
	if (e.sharedOriginFeatures.length) {
		oneToManyFlowmapLayer.selectFeaturesForPathDisplay(e.sharedOriginFeatures, 'SELECTION_NEW');
	}
	if (e.sharedDestinationFeatures.length) {
		oneToManyFlowmapLayer.selectFeaturesForPathDisplay(e.sharedDestinationFeatures, 'SELECTION_NEW');
	}
    L.DomEvent.stopPropagation(e);
	popup
	.setLatLng(e.latlng)
	.setContent(setFlowmapPopupContent(e))
	.openOn(map);
};

function setFlowmapPopupContent(e) {
	//oriOrDe
	var regionName = "";
	var oriOrDest = "";
	var _list = {};
	var _other = "";
	if (e.isOriginFeature) {
		regionName = e.layer.feature.properties.Origin;
		oriOrDest = "Origin";
		_other = "Destination"
		_list = e.sharedOriginFeatures;
	}
	else  {
		regionName = e.layer.feature.properties.Destination;
		oriOrDest = "Destination";
		_other = "Origin"
		_list = e.sharedDestinationFeatures;
	}

	var _content = `<h2 style="text-align:center"><u>${regionName}</u></h2>`;
	var _total = 0;
	_content += `<h3>${oriOrDest}</h3>`;
	_content += "<ul>";
	for (var _i = 0 ; _i < _list.length; _i ++) {
		if (_list[_i].properties[_other] == regionName) continue;
		_content += `<li>${_list[_i].properties[_other]}: ${_list[_i].properties.Value}</li>`;
		_total += _list[_i].properties.Value;
	}
	_content += "</ul>";
	_content += `<b>Total Movement:${_total}</b>`;
	return _content;
}

function updateOD() {
	console.log("Updating");
	setupFlowmap();
}

function setupFlowmap() {
	updateGeoJsonProperties()
	oneToManyFlowmapLayer.remove();
	//map.removeLayer(oneToManyFlowmapLayer)
	let fColl = JSON.parse(JSON.stringify(geoJsonFeatureCollectionB));
	oneToManyFlowmapLayer = L.canvasFlowmapLayer(fColl, {
		originAndDestinationFieldIds: flowmapODFieldIds,
		canvasBezierStyle: getFlowmapCanvazBezierStyle(),
		pathDisplayMode: 'selection',
		animationStarted: true,
		style: flowmapStyleFunction,
		pane: 'flowmap'
	}).addTo(map);
	oneToManyFlowmapLayer.on('click', flowmapMouseClickFunction);
	
	oneToManyFlowmapLayer.selectFeaturesForPathDisplayById('Origin', 'Centro', true, 'SELECTION_NEW');
	map.closePopup();
	legendColor.update();
}

function updateGeoJsonProperties() {
	maximumMovement = 0;
	console.log(geoJsonFeatureCollectionB.features[0])
	var _nodes = getActiveNodes()
	console.log(_nodes)
	geoJsonFeatureCollectionB.features.forEach(element => {
		if (element.properties.Origin == element.properties.Destination) {
			return;
		}
		
		var ageSum = 0;
		var occSum = 0;

		for (var _i = 0; _i < _nodes.length; _i ++)
		{
			var _nodeName = _nodes[_i]
			if (selectedAge.includes("Children")) ageSum += Number(element.properties[_nodeName]['age: [children]']);
			if (selectedAge.includes("Youngs")) ageSum += Number(element.properties[_nodeName]['age: [young]']);
			if (selectedAge.includes("Adults")) ageSum += Number(element.properties[_nodeName]['age: [adults]']);
			if (selectedAge.includes("Elders")) ageSum += Number(element.properties[_nodeName]['age: [elders]']);

			if (selectedOccupation.includes("Students")) occSum += Number(element.properties[_nodeName]['occupation: [student]']);
			if (selectedOccupation.includes("Workers")) occSum += Number(element.properties[_nodeName]['occupation: [worker]']);
			if (selectedOccupation.includes("Idle")) occSum += Number(element.properties[_nodeName]['occupation: [idle]']);
			}
		// if (selectedAge.includes("Children")) ageSum += Number(element.properties['age: [children]']);
		// if (selectedAge.includes("Youngs")) ageSum += Number(element.properties['age: [young]']);
		// if (selectedAge.includes("Adults")) ageSum += Number(element.properties['age: [adults]']);
		// if (selectedAge.includes("Elders")) ageSum += Number(element.properties['age: [elders]']);

		// if (selectedOccupation.includes("Students")) occSum += Number(element.properties['occupation: [student]']);
		// if (selectedOccupation.includes("Workers")) occSum += Number(element.properties['occupation: [worker]']);
		// if (selectedOccupation.includes("Idle")) occSum += Number(element.properties['occupation: [idle]']);
		
		//console.log(ageSum, occSum, element.properties.Total)
		let _finalValue = Math.min(ageSum, occSum)

		if (_finalValue > maximumMovement)
		{
			maximumMovement = _finalValue
			//console.log(element.properties)
		}
		element.properties.Value = _finalValue;
	});

	console.log("Maximun value is:" + maximumMovement)
}



