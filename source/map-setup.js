console.log(geoJsonFeatureCollectionB)

// Setting up the map (in Porto Alegre)
let map = L.map('map', {
	center: [-30.035, -51.22],
	zoom: 15,
    minZoom: 12,
    maxZoom: 18
});

function onMapClick(e) {
    console.log("Test")
    resetRegionHighlight();
    //popup
     //   .setLatLng(e.latlng)
     //   .setContent("You clicked the map at " + e.latlng.toString())
     //   .openOn(mymap);
}

map.on('click', onMapClick);

map.createPane('regions');
map.createPane('flowmap');
map.createPane('flowmapIcons');
map.getPane('regions').style.zIndex = 401;
map.getPane('flowmap').style.zIndex = 402;
map.getPane('flowmap').style.pointerEvents = 'none';
map.getPane('flowmapIcons').style.zIndex = 403;

let displayAllRegions = true
const fewRegionsList = ["Azenha", "Bom Fim", "Centro Histórico", "Cidade Baixa", 
                    "Farroupilha", "Floresta", "Independência", "Menino Deus", 
                    "Moinhos de Vento", "Praia de Belas", "Rio Branco", "Santa Cecília", "Santana"];

let selectedAge = ["Children", "Youngs", "Adults", "Elders"]
let selectedOccupation = ["Students", "Workers", "Idle"]
let selectedNodes = ["Home", "Gas Station"]

function getActiveNodes() {
	nodes = []
	if (selectedNodes.includes("Home")) nodes.push('home')
    if (selectedNodes.includes("Work")) nodes.push('work')
    if (selectedNodes.includes("School")) nodes.push('school')
    if (selectedNodes.includes("Marketplace")) nodes.push('marketplace')
    if (selectedNodes.includes("Pharmacy")) nodes.push('pharmacy')
    if (selectedNodes.includes("Gas Station")) nodes.push('gas_station')
    if (selectedNodes.includes("Hospital")) nodes.push('hospital')
    if (selectedNodes.includes("Shopping Mall")) nodes.push('shopping_mall')
    if (selectedNodes.includes("Stadium")) nodes.push('stadium')
    return nodes
}

// -------------------- Creates Basemap TileLayers -------------------- //


// Mapbox Streets Tile Layer
var mapboxUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
var mapboxAttribution = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
var baseLayerMapboxStreets = L.tileLayer(mapboxUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: mapboxAttribution});
var baseLayerMapboxDark = L.tileLayer(mapboxUrl, {id: 'mapbox/dark-v11', tileSize: 512, zoomOffset: -1, attribution: mapboxAttribution});
var baseLayerMapboxLight = L.tileLayer(mapboxUrl, {id: 'mapbox/light-v11', tileSize: 512, zoomOffset: -1, attribution: mapboxAttribution});

// CARTO Tile Layer
var cartodbAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';
var baseLayerCartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', { attribution: cartodbAttribution});
var baseLayerCartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: cartodbAttribution});

// OSM Tile Layer
var baseLayerOSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

// Select initial Basemap
baseLayerMapboxDark.addTo(map);

// Objects that contain the layers reference
var baseMaps = {
    "Mapbox Dark": baseLayerMapboxDark,
    "Mapbox Light": baseLayerMapboxLight,
    "Mapbox Streets": baseLayerMapboxStreets,
	"Carto Dark": baseLayerCartoDark,
	"Carto Light": baseLayerCartoLight,
    "OpenStreetMap": baseLayerOSM,
};

// -------------------- Creates Region GeoJSON Layers -------------------- //
// Region MouseOver callback
function highlightRegion(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    layer.bringToFront();
    regionInfoControl.update(layer.feature.properties);
}

// Region MouseOut callback
function resetRegionHighlight(e) {
    if (displayAllRegions)
        allNeighborhoodsGeoJsonLayer.resetStyle();
    else
        fewNeighborhoodsGeoJsonLayer.resetStyle();
        
    regionInfoControl.update();
}

// Region MouseClick callback
function onRegionClicked(e) {
    map.flyTo(e.target.getBounds().getCenter());
    resetRegionHighlight(e)
    var layer = e.target;
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    layer.bringToFront();
    regionInfoControl.update(layer.feature.properties);
    L.DomEvent.stopPropagation(e);
}

function onEachRegionFeature(feature, layer) {
    layer.on({ click: onRegionClicked });
}

// Creating Region GeoJSON Layers
allNeighborhoodsGeoJsonLayer = L.geoJSON(regionOutlines, {  
    onEachFeature: onEachRegionFeature, 
    pane: 'regions'
});
fewNeighborhoodsGeoJsonLayer = L.geoJSON(regionOutlines, {
    onEachFeature: onEachRegionFeature,
    filter: function(feature, layer) {
        return fewRegionsList.includes(feature.properties.Nome);
    },
    pane: 'regions'
});

// Tooltips
regionTooltipsConfig = { direction: 'right',
    permanent: false,
    sticky: true,
    offset: [10, 0],
    opacity: 0.75,
    className: 'leaflet-tooltip-own' 
} 
allNeighborhoodsGeoJsonLayer.bindTooltip(function (layer) {return layer.feature.properties.Nome;}, regionTooltipsConfig);
fewNeighborhoodsGeoJsonLayer.bindTooltip(function (layer) {return layer.feature.properties.Nome;},  regionTooltipsConfig);

// -------------------- Creates Region Info Control -------------------- //
var regionInfoControl = L.control({position: 'bottomleft'});

regionInfoControl.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info legend');
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
regionInfoControl.update = function (props) {
    this._div.innerHTML = '<h2>Selected Neighborhood:</h2>' +  (props ?
        '<b><h2>' + props.Nome + '</h2></b><br />' + "FID: " + props.FID
        : 'Click on a Neighborhood');
};

regionInfoControl.addTo(map);


// -------------------- Creates OverlayLayers -------------------- //
// Neighborhood Layers
var allNeighborhoods = L.layerGroup([allNeighborhoodsGeoJsonLayer]).addTo(map);
var fewNeighborhoods = L.layerGroup([fewNeighborhoodsGeoJsonLayer]);

// Population Age Layers
var childrenAgeLayer = L.layerGroup([]).addTo(map);
var youngsAgeLayer = L.layerGroup([]).addTo(map);
var adultsAgeLayer = L.layerGroup([]).addTo(map);
var eldersAgeLayer = L.layerGroup([]).addTo(map);

// Population Occupation Layers
var studentsOccupationLayer = L.layerGroup([]).addTo(map);
var workersOccupationLayer = L.layerGroup([]).addTo(map);
var idleOccupationLayer = L.layerGroup([]).addTo(map);

// Node type Layers
var homeNodeLayer = L.layerGroup([]).addTo(map);
var workNodeLayer = L.layerGroup([]);
var schoolNodeLayer = L.layerGroup([]);
var marketplaceNodeLayer = L.layerGroup([]);
var pharmacyNodeLayer = L.layerGroup([]);
var gasStationNodeLayer = L.layerGroup([]).addTo(map);
var hospitalNodeLayer = L.layerGroup([]);
var shoppingMallNodeLayer = L.layerGroup([]);
var stadiumNodeLayer = L.layerGroup([]);

var groupedOverlays = {
    "<u>Neighborhoods:</u>":{
        "All 94":allNeighborhoods,
        "Only 13":fewNeighborhoods
    },
    "<u>Population Age:</u>":{
        "Children":childrenAgeLayer,
        "Youngs":youngsAgeLayer,
        "Adults":adultsAgeLayer,
        "Elders":eldersAgeLayer
    },
    "<u>Population Occupation:</u>":{
        "Students":studentsOccupationLayer,
        "Workers":workersOccupationLayer,
        "Idle":idleOccupationLayer
    },
    "<u>Node Types:</u>":{
        "Home":homeNodeLayer,
        "Work":workNodeLayer,
        "School":schoolNodeLayer,
        "Marketpalce":marketplaceNodeLayer,
        "Pharmacy":pharmacyNodeLayer,
        "Gas Station":gasStationNodeLayer,
        "Hospital":hospitalNodeLayer,
        "Shopping Mall":shoppingMallNodeLayer,
        "Stadium":stadiumNodeLayer,
    }
};

var groupedLayersOptions = {
  // Make the "Neighborhoods" group exclusive (use radio inputs)
  exclusiveGroups: ["<u>Neighborhoods:</u>"],
  // Show a checkbox next to non-exclusive group labels for toggling all
  groupCheckboxes: true,
  collapsed: false
};

// Use the custom grouped layer control, not "L.control.layers"
var layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, groupedLayersOptions).addTo(map);


L.control.scale({imperial:false, position:'bottomright'}).addTo(map);

// Creating a GeoJSON layer
let geoJsonLayer = L.geoJSON();
setupRegionOutlines(true)



map.on('overlayadd', onOverlayAdd);

function onOverlayAdd(e){
    console.log(e.name)
    //map.removeLayer(geoJsonLayer)
    if (e.name == "All 94")
        setupRegionOutlines(true)
    else if (e.name == "Only 13")
        setupRegionOutlines(false)
    else if (e.name == "Children" || e.name == "Youngs" 
            || e.name == "Adults" || e.name == "Elders" ) {
        selectedAge.push(e.name);
        updateOD();
        //console.log(selectedAge);
    }
    else if (e.name == "Students" || e.name == "Workers"  || e.name == "Idle"){
        selectedOccupation.push(e.name);
        updateOD();
        //console.log(selectedOccupation);
    }
    else {
        selectedNodes.push(e.name);
        updateOD();
        //console.log(selectedNodes);
    }
}

map.on('overlayremove', onOverlayRemove);

function onOverlayRemove(e){
    console.log("removing: " + e.name)
    if (e.name == "All 94" || e.name == "Only 13") return;
    else if (e.name == "Children" || e.name == "Youngs" || e.name == "Adults" || e.name == "Elders" ) {
        selectedAge = selectedAge.filter(n => n !== e.name)
        updateOD();
        //console.log(selectedAge);
    }
    else if (e.name == "Students" || e.name == "Workers"  || e.name == "Idle"){
        selectedOccupation = selectedOccupation.filter(n => n !== e.name)
        updateOD();
        //console.log(selectedOccupation);
    }
    else {
        selectedNodes = selectedNodes.filter(n => n !== e.name)
        updateOD();
        //console.log(selectedNodes);
    }
}

function setupRegionOutlines(allRegions){
    displayAllRegions = allRegions
}