import './style.css';
import {
  Map,
  View
} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import ImageWMS from "ol/source/ImageWMS";
import {
  Vector as VectorLayer
} from 'ol/layer';
import {
  Vector as VectorSource
} from 'ol/source';
import ImageLayer from "ol/layer/Image";
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import {
  toLonLat
} from 'ol/proj';
import Icon from 'ol/style/Icon';
import {
  transform
} from 'ol/proj';
import Overlay from "ol/Overlay";
import {
  defaults as defaultControls,
  Control
} from "ol/control";
var cord_e_3857;
var cord_n_3857;
var lastCoord;
var container = document.getElementById("popup");
var content = document.getElementById("popup-content");
var closer = document.getElementById("popup-closer");
var wmsLayerSource;
var wmsLayer;
var lastid;
var lastmodel;
var lastfoto;
var lastwiki;
var dop = false;
var createTool = false;
var editTool = false;
var deleteTool = false;
var draw;
var lat;
var lon;
var pyUrl = 'https://opendem.info/cgi-bin/';

/**
 * Create an overlay to anchor the popup to the map.
 */
var overlay = new Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});
/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// Custom Control Toggle Tools
class SwitchControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    var switchDiv = document.createElement("div");
    switchDiv.style.cssText =
      "position:absolute;top:0px;left:1px; width:30px; height:30px;";
    switchDiv.className = "switchDiv";
    switchDiv.id = "switchDiv";

    super({
      element: switchDiv,
      target: options.target,
    });

    switchDiv.addEventListener(
      "click",
      this.handleSwitchDivChange.bind(this),
      false
    );

  }
  handleSwitchDivChange() {
    var selfDiv = document.getElementById("switchDiv");
    var controlEle = document.getElementById("controlEle");
    if (controlEle.style.display === "none") {
      controlEle.style.display = "block";
      selfDiv.className = "switchDiv";
    } else {
      controlEle.style.display = "none";
      selfDiv.className = "switchDivHide";
    }
  }
}

// Custom Control Selector Tools
class SelectorControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};
    // radio butons
    var radioItem1 = document.createElement("input");
    radioItem1.type = "radio";
    radioItem1.name = "radioGrp";
    radioItem1.id = "rad1";
    radioItem1.value = "myradio1";
    radioItem1.defaultChecked = true;
    radioItem1.checked = true;

    var radioItem2 = document.createElement("input");
    radioItem2.type = "radio";
    radioItem2.name = "radioGrp";
    radioItem2.id = "rad2";
    radioItem2.value = "myradio2";

    var radioItem3 = document.createElement("input");
    radioItem3.type = "radio";
    radioItem3.name = "radioGrp";
    radioItem3.id = "rad3";
    radioItem3.value = "myradio3";

    var radioItem4 = document.createElement("input");
    radioItem4.type = "radio";
    radioItem4.name = "radioGrp";
    radioItem4.id = "rad4";
    radioItem4.value = "myradio4";

    var objTextNode1 = document.createTextNode("3D Model");
    var objTextNode2 = document.createTextNode("Foto");
    var objTextNode3 = document.createTextNode("Wikipedia");
    var objTextNode4 = document.createTextNode("OpenStreetMap");

    var objLabel = document.createElement("label");
    objLabel.style.cssText = "position:absolute;top:50px;left:10px";
    objLabel.htmlFor = radioItem1.id;
    objLabel.appendChild(radioItem1);
    objLabel.appendChild(objTextNode1);

    var objLabel2 = document.createElement("label");
    objLabel2.style.cssText = "position:absolute;top:70px;left:10px;";
    objLabel2.htmlFor = radioItem2.id;
    objLabel2.appendChild(radioItem2);
    objLabel2.appendChild(objTextNode2);

    var objLabel3 = document.createElement("label");
    objLabel3.style.cssText = "position:absolute;top:90px;left:10px;";
    objLabel3.htmlFor = radioItem3.id;
    objLabel3.appendChild(radioItem3);
    objLabel3.appendChild(objTextNode3);

    var objLabel4 = document.createElement("label");
    objLabel4.style.cssText = "position:absolute;top:110px;left:10px;";
    objLabel4.htmlFor = radioItem4.id;
    objLabel4.appendChild(radioItem4);
    objLabel4.appendChild(objTextNode4);

    var objTextNode5 = document.createElement("P");
    objTextNode5.innerHTML =
      "<strong>Was gibt es hier zu pflegen?</strong>";
    objTextNode5.style.cssText = "position:absolute;left:20px";


    var divLegend = document.createElement("p");
    divLegend.style.cssText = "position:absolute;top:120px;left:5px";
    divLegend.innerHTML = `<div><strong>&nbsp;&nbsp;Vorhanden:</strong></div><div class="kreis_green"></div>&nbsp;&nbsp;Ja<br />
        <div  id="kreis_yellow"><div class="kreis_yellow"></div>&nbsp;&nbsp;In Arbeit</div>
        <div class="kreis_red"></div>&nbsp;&nbsp;Nein`;

    var element = document.createElement("div");
    element.style.cssText =
      "position:relative;top:10px;left:10px;background: lightcyan; width: 225px; height: 220px;";
    element.className = "ol-unselectable ol-control noiseselect";
    element.id = "controlEle";
    element.appendChild(objTextNode5);
    element.appendChild(objLabel);
    element.appendChild(objLabel2);
    element.appendChild(objLabel3);
    element.appendChild(objLabel4);
    element.appendChild(divLegend);


    super({
      element: element,
      target: options.target,
    });

    objLabel.addEventListener(
      "change",
      this.handleModel3dChange.bind(this),
      false
    );
    objLabel2.addEventListener(
      "change",
      this.handleOtherChange.bind(this),
      false
    );
    objLabel3.addEventListener(
      "change",
      this.handleOtherChange.bind(this),
      false
    );
    objLabel4.addEventListener(
      "change",
      this.handleOtherChange.bind(this),
      false
    );


  }

  handleModel3dChange() {
    updateWMS();
    document.getElementById('kreis_yellow').style.display = 'block';


  }
  handleOtherChange() {
    document.getElementById('kreis_yellow').style.display = 'none';
    updateWMS();
  }


}



class CreateControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};
    var CreateDiv = document.createElement("div");
    CreateDiv.style.cssText =
      "position:absolute;top:50px;right:5px; width:40px; height:40px;";
    CreateDiv.className = "CreateDiv";
    CreateDiv.id = "CreateDiv";
    super({
      element: CreateDiv,
      target: options.target,
    });

    CreateDiv.addEventListener('click', this.Create.bind(this), false);
  }
  Create() {
    if (createTool === false) {
      createTool = true;
      document.getElementById('CreateDiv').style.border = "2px solid red";
      document.getElementById('createNonModal').style.display = "block";
      // switch other toolbars
      document.getElementById('EditDiv').style.border = "0px solid red";
      document.getElementById('DeleteDiv').style.border = "0px solid red";
      document.getElementById('editNonModal').style.display = "none";
      document.getElementById('deleteNonModal').style.display = "none";
      editTool = false;
      deleteTool = false;
    } else {
      createTool = false;
      document.getElementById('CreateDiv').style.border = "0px solid red";
      document.getElementById('createNonModal').style.display = "none";
    }
  }
}

class EditControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};

    var EditDiv = document.createElement("div");
    EditDiv.style.cssText =
      "position:absolute;top:100px;right:5px; width:40px; height:40px;";
    EditDiv.className = "EditDiv";
    EditDiv.id = "EditDiv";
    super({
      element: EditDiv,
      target: options.target,
    });

    EditDiv.addEventListener('click', this.Edit.bind(this), false);
  }

  Edit() {
    if (editTool === false) {
      editTool = true;
      document.getElementById('EditDiv').style.border = "2px solid red";
      document.getElementById('editNonModal').style.display = "block";
      // switch other toolbar
      document.getElementById('CreateDiv').style.border = "0px solid red";
      document.getElementById('DeleteDiv').style.border = "0px solid red"
      document.getElementById('createNonModal').style.display = "none";
      document.getElementById('deleteNonModal').style.display = "none";
      createTool = false;
      deleteTool = false;

    } else {
      editTool = false;
      document.getElementById('EditDiv').style.border = "0px solid red";
      document.getElementById('editNonModal').style.display = "none";
    }
  }
}

class DeleteControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};
    var DeleteDiv = document.createElement("div");
    DeleteDiv.style.cssText =
      "position:absolute;top:150px;right:5px; width:40px; height:40px;";
    DeleteDiv.className = "DeleteDiv";
    DeleteDiv.id = "DeleteDiv";
    super({
      element: DeleteDiv,
      target: options.target,
    });

    DeleteDiv.addEventListener('click', this.Delete.bind(this), false);
  }
  Delete() {
    if (deleteTool === false) {
      deleteTool = true;
      document.getElementById('DeleteDiv').style.border = "2px solid red";
      document.getElementById('deleteNonModal').style.display = "block";
      // switch other toolbar
      document.getElementById('CreateDiv').style.border = "0px solid red";
      document.getElementById('EditDiv').style.border = "0px solid red"
      document.getElementById('createNonModal').style.display = "none";
      document.getElementById('editNonModal').style.display = "none";
      createTool = false;
      editTool = false;

    } else {
      deleteTool = false;
      document.getElementById('DeleteDiv').style.border = "0px solid red";
      document.getElementById('deleteNonModal').style.display = "none";
    }
  }
}



class LocationControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};
    var LocationDiv = document.createElement("div");
    LocationDiv.style.cssText =
      "position:absolute;top:200px;right:5px; width:40px; height:40px;";
    LocationDiv.className = "LocationDiv";
    LocationDiv.id = "LocationDiv";
    super({
      element: LocationDiv,
      target: options.target,
    });

    LocationDiv.addEventListener('click', this.Location.bind(this), false);
  }
  Location() {
    navigator.geolocation.getCurrentPosition(onPosition);


    function onPosition(position) {
      map.getView().setCenter(transform([position.coords.longitude, position.coords.latitude,], 'EPSG:4326', 'EPSG:3857'));
    }
  }
}

class LayerSwitchControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};
    var LayerSwitchDiv = document.createElement("div");
    LayerSwitchDiv.style.cssText =
      "position:absolute;top:5px;right:5px; width:40px; height:40px;";
    LayerSwitchDiv.className = "LayerSwitchDiv";
    LayerSwitchDiv.id = "LayerSwitchDiv";
    super({
      element: LayerSwitchDiv,
      target: options.target,
    });

    LayerSwitchDiv.addEventListener('click', this.LayerSwitch.bind(this), false);
  }
  LayerSwitch() {
    var layers = map.getLayers().getArray();;

    for (var i = layers.length - 1; i >= 0; i--) {
      console.log(layers[i].className_);
      if (layers[i].className_ == 'dop') {

        if (dop == false) {
          layers[i].setVisible(true);
          dop = true;
          document.getElementById("LayerSwitchDiv").className = "LayerSwitchDivK";
        } else {
          layers[i].setVisible(false);
          dop = false;
          document.getElementById("LayerSwitchDiv").className = "LayerSwitchDiv";
        }

      }
    }
  }
}


wmsLayerSource = new ImageWMS({
  url: "https://www.opendem.info/geoserver/openmaps/wms",
  params: {
    LAYERS: 'openmaps:denkmaeler'
  },
  serverType: "geoserver",
  crossOrigin: "anonymous",
  attributions: ', <a target="_blank" href="https://www.offenedaten-koeln.de/dataset/denkmalliste-stadt-koeln">Stadt Köln & Denkmal 4D Contributors DL-DE-Zero-2.0</a>',
});


wmsLayer = new ImageLayer({
  source: wmsLayerSource,
  // maxResolution: 2,
  className: 'wmsLayer',
  zIndex: 2
});



wmsLayerSource.on('imageloadstart', function () {
  document.getElementById('loader').style.display = 'block';
});

wmsLayerSource.on('imageloadend', function () {
  document.getElementById('loader').style.display = 'none';
});


var sourceV = new VectorSource({
  wrapX: false
});

var vector = new VectorLayer({
  source: sourceV
});

var wmsLayerSourceDOP = new ImageWMS({
  url: "https://www.wms.nrw.de/geobasis/wms_nw_dop",
  params: {
    LAYERS: "nw_dop_rgb"
  },
  serverType: "mapserver",
  crossOrigin: "anonymous",
  attributions: ', <a target="_blank" href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/webdienste/geodatendienste/">Land NRW, DL-DE Zero 3.0</a>',
});

var wmsLayerDOP = new ImageLayer({
  source: wmsLayerSourceDOP,
  visible: false,
  className: 'dop',
  zIndex: 1
});



// url parameter coordinates

var zoomView = 13;
var ycoord = 774670.0;
var xcoord = 6610915.0;


try {
  if (getUrlVars()["y"] != undefined) {
    ycoord = parseFloat(getUrlVars()["y"]);
  }
} catch (e) { }

try {
  if (getUrlVars()["x"] != undefined) {
    xcoord = parseFloat(getUrlVars()["x"]);
  }
} catch (e) { }

// lat lon

try {
  if (getUrlVars()["xcoord"] != undefined) {
    xcoord = parseFloat(getUrlVars()["xcoord"]);
  }
} catch (e) { }
try {
  if (getUrlVars()["ycoord"] != undefined) {
    ycoord = parseFloat(getUrlVars()["ycoord"]);
  }
} catch (e) { }
try {
  if (getUrlVars()["zoomView"] != undefined) {
    zoomView = Number(getUrlVars()["zoomView"]);
  }
} catch (e) { }



// Map
var view = new View({
  center: [ycoord, xcoord],
  zoom: zoomView,
});
var map = new Map({
  controls: defaultControls().extend([
    new CreateControl(),
    new EditControl(),
    new DeleteControl(),
    new LayerSwitchControl(),
    new SwitchControl(),
    new LocationControl(),
    new SelectorControl()
  ]),
  layers: [
    new TileLayer({
      source: new OSM({ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' })
    }),
    wmsLayer, wmsLayerDOP, vector
  ],
  target: "map",
  overlays: [overlay],
  view: view,
});

// events


/**
 * Handle change event.
 */



// update WMS

function updateWMS() {

  // kein SLD notwendig, einfach den style anders setzen

  // radios
  var newStyle;
  if (document.getElementById("rad1").checked) {
    newStyle = 'openmaps:denkmaeler'
  }
  if (document.getElementById("rad2").checked) {
    newStyle = 'openmaps:denkmaeler_fotos'
  }
  if (document.getElementById("rad3").checked) {
    newStyle = 'openmaps:denkmaeler_wiki'
  }
  if (document.getElementById("rad4").checked) {
    newStyle = 'openmaps:denkmaeler_osm'
  }

  wmsLayer.getSource().updateParams({
    styles: newStyle
  });

}

// handle events abhängig vom aktivierten Tool
map.on("singleclick", function (evt) {


  if (createTool === true) {

    var latlon = toLonLat(evt.coordinate);
    lat = latlon[0];
    lon = latlon[1];

    cord_e_3857 = evt.coordinate[0];
    cord_n_3857 = evt.coordinate[1];

    self = this;

    document.getElementById("coordinates_create_x").innerText = lat;
    document.getElementById("coordinates_create_y").innerText = lon;
    if (self.dinamicPinLayer !== undefined) {

      if (self.dinamicPinLayer.getVisible() === false) {
        self.dinamicPinLayer.setVisible(true);
      }
      console.log("move")
      self.iconGeometry.setCoordinates(evt.coordinate);
      //or create another pin
    } else {

      self.iconGeometry = new Point(evt.coordinate);
      var iconFeature = new Feature({
        geometry: self.iconGeometry,
        name: 'marker'
      });
      var iconStyle = new Style({
        image: new Icon(({
          anchor: [0.5, 46],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          size: [48, 48],
          opacity: 1,
          src: 'images/icon.png'
        }))
      });

      iconFeature.setStyle(iconStyle);

      var vectorSource = new VectorSource({
        features: [iconFeature]

      });
      self.dinamicPinLayer = new VectorLayer({
        source: vectorSource,
        zIndex: 3,
        className: 'pinVector'
      });
      map.addLayer(self.dinamicPinLayer);
    }

    // edit

  } else if (editTool === true) {

    // delete spans & values

    document.getElementById('edit_modelUrl').value = '';
    document.getElementById('edit_bezeichnung').value = '';
    document.getElementById('edit_fotoUrl').value = '';
    document.getElementById('edit_wikiUrl').value = '';
    document.getElementById('edit_osm').checked = false;
    document.getElementById('edit_model_care').checked = false;
    document.getElementById('edit_denkmalliste').value = '';
    document.getElementById('edit_strasse').value = '';
    document.getElementById('edit_hausnummer').value = '';
    document.getElementById('edit_plz').value = '';
    document.getElementById('edit_stadtbezirk').value = '';
    document.getElementById('edit_kategorie').value = '';
    document.getElementById('edit_architektur').value = '';
    document.getElementById('edit_bezeichnung').value = '';
    document.getElementById('edit_unterschutz').value = '';
    document.getElementById('edit_baujahr').value = '';
    document.getElementById('edit_eigentum').value = '';


    var viewResolution = /** @type {number} */ (view.getResolution());
    var url = wmsLayerSource.getFeatureInfoUrl(
      evt.coordinate,
      viewResolution,
      "EPSG:3857", {
      INFO_FORMAT: "application/json"
    }
    );

    lastCoord = evt.coordinate;

    if (url) {
      fetch(url)
        .then(function (response) {
          if (!response.ok) {
            alert('Irgendwas ist leider schief gegangen.');
          } else {
            return response.text();
          }
        })
        .then(function (json) {


          var fi = JSON.parse(json);
          window.document.baemsche = fi;

          if (fi.features.length > 0) {

            lastid = fi.features[0].id;

            document.getElementById('edit').style.display = 'block';
            document.getElementById('editNonModal').style.display = 'none';
            document.getElementById('edit_modelUrl').value = fi.features[0].properties.model3durl;
            lastmodel = fi.features[0].properties.model3d;
            lastfoto = fi.features[0].properties.foto;
            lastwiki = fi.features[0].properties.wiki;
            document.getElementById('edit_fotoUrl').value = fi.features[0].properties.fotourl;
            document.getElementById('edit_wikiUrl').value = fi.features[0].properties.wikiurl;
            var osm = fi.features[0].properties.osm;
            if (osm === 'ja') {
              document.getElementById('edit_osm').checked = true;
            } else {
              document.getElementById('edit_osm').checked = false;
            }
            var model3d = fi.features[0].properties.model3d;
            if (model3d === 'work') {
              document.getElementById('edit_model_care').checked = true;
            }

            document.getElementById('edit_denkmalliste').value = fi.features[0].properties.denkmallistennummer;
            document.getElementById('edit_strasse').value = fi.features[0].properties.strasse;
            document.getElementById('edit_hausnummer').value = fi.features[0].properties.hausnummer;
            document.getElementById('edit_plz').value = fi.features[0].properties.plz;
            document.getElementById('edit_stadtbezirk').value = fi.features[0].properties.stadtbezirk;
            document.getElementById('edit_kategorie').value = fi.features[0].properties.kategorie;
            document.getElementById('edit_architektur').value = fi.features[0].properties.architektur;
            document.getElementById('edit_bezeichnung').value = fi.features[0].properties.kurzbezeichnung;

            try {
              var unterschutzLocale = fi.features[0].properties.unterschutzstellung;
              var uLarray = unterschutzLocale.split('.');
              document.getElementById('edit_unterschutz').value = uLarray[2] + '-' + uLarray[1] + '-' + uLarray[0];
            } catch (e) { }

            document.getElementById('edit_baujahr').value = fi.features[0].properties.baujahr;
            document.getElementById('edit_eigentum').value = fi.features[0].properties.eigentum;

            var aktualisierung = fi.features[0].properties.aktualisierung.substr(0, fi.features[0].properties.aktualisierung.length - 1);
            document.getElementById('editFooter').innerHTML = 'Letzte Aktualisierung: ' + aktualisierung;


          }
        });
    }

    // delete
  } else if (deleteTool === true) {
    var viewResolution = /** @type {number} */ (view.getResolution());
    var url = wmsLayerSource.getFeatureInfoUrl(
      evt.coordinate,
      viewResolution,
      "EPSG:3857", {
      INFO_FORMAT: "application/json"
    }
    );
    lastCoord = evt.coordinate;
    if (url) {
      fetch(url)
        .then(function (response) {
          if (!response.ok) {
            alert('Irgendwas ist leider schief gegangen.');
          } else {
            return response.text();
          }
        })
        .then(function (json) {
          var fi = JSON.parse(json);
          if (fi.features.length > 0) {
            document.getElementById('delete').style.display = 'block';
            document.getElementById('deleteNonModal').style.display = 'none';
            lastid = fi.features[0].id;
          }
        });
    }


  } else {


    //featureInfo
    var viewResolution = /** @type {number} */ (view.getResolution());
    var url = wmsLayerSource.getFeatureInfoUrl(
      evt.coordinate,
      viewResolution,
      "EPSG:3857", {
      INFO_FORMAT: "application/json"
    }
    );
    lastCoord = evt.coordinate;
    if (url) {
      fetch(url)
        .then(function (response) {
          if (!response.ok) {
            alert('Irgendwas ist leider schief gegangen.');
          } else {
            return response.text();
          }
        })
        .then(function (json) {
          var fi = JSON.parse(json);
          if (fi.features.length > 0) {

            var coordinate = evt.coordinate;

            lastid = fi.features[0].id;
            content.innerHTML = '';
            // Foto

            if (fi.features[0].properties.foto === 'ja') {
              content.innerHTML += '<figure><img src="' + fi.features[0].properties.fotourl + '" style="height:200px"><figcaption><a target="_blank" href="' + fi.features[0].properties.fotourl + '">Bitte die Lizenzbedingungen des Fotos beachten</a>';
            } else {
              content.innerHTML += '<figure><img src="images/nofoto.png" style="height:200px">';
            }

            content.innerHTML += 'Bezeichnung: ' + fi.features[0].properties.kurzbezeichnung;
            content.innerHTML += '<br/>Kategorie: ' + fi.features[0].properties.kategorie;
            content.innerHTML += '<br/>Adresse: ' + fi.features[0].properties.strasse + ' ' + fi.features[0].properties.hausnummer + ' ' + fi.features[0].properties.plz + ' Köln';
            content.innerHTML += '<br/>Stadtbezirk: ' + fi.features[0].properties.stadtbezirk;
            content.innerHTML += '<br/>Baujahr: ' + fi.features[0].properties.baujahr;
            content.innerHTML += '<br/>Geschützt seit: ' + fi.features[0].properties.unterschutzstellung;
            content.innerHTML += '<br/>Eigentum: ' + fi.features[0].properties.eigentum;
            content.innerHTML += '<br/>Denkmallisten Nummer: ' + fi.features[0].properties.denkmallistennummer;

            if (fi.features[0].properties.architektur !== null) {
              content.innerHTML += '<br/>Architektur: ' + fi.features[0].properties.architektur;
            }


            // todo
            /*
            content.innerHTML += ` <details>
            <summary>Epcot Center</summary>
            <p>Epcot is a theme park at Walt Disney World Resort featuring exciting attractions, international pavilions, award-winning fireworks and seasonal special events.</p>
          </details> `;
*/

            if (fi.features[0].properties.model3d === 'nein') {
              content.innerHTML += '<p><strong>Leider noch kein 3D Modell vorhanden, erstelle doch bitte eins!<img onclick="zurAnleitung()" style="cursor: pointer;" src="images/help-svgrepo-white.svg" height="18" width="18"/></p>';
              content.innerHTML += '<button id=\"careDenkmal\"> Klar, da kümmere ich mich drum!</button></p>';
              document.getElementById("careDenkmal").addEventListener("click", careDenkmal);
            }
            if (fi.features[0].properties.model3d === 'work') {
              content.innerHTML += '<p><strong>Um das 3D Modell wird sich bereits gekümmert </strong></p>';
            }
            if (fi.features[0].properties.model3d === 'ja') {
              content.innerHTML += '<p><a target=\"_blank\"href=\"' + fi.features[0].properties.model3durl + '\">Link zum 3d Model </a></p>';
            }

            // close button 4 mobile
            /*
            if (window.matchMedia("(max-width: 700px)").matches) {
              content.innerHTML += '<button id="popupCloserButton">✖</button>';
              document.getElementById("popupCloserButton").addEventListener("click", closeFiViaButton);
            }
            */


            if (fi.features[0].properties.wiki === 'ja') {
              content.innerHTML += '<br/><a target=\"_blank\"href=\"' + fi.features[0].properties.wikiurl + '\">Link zum Wikipedia Artikel </a>';
            }
            overlay.setPosition(coordinate);
          }
        });
    }
  }
});


// event handlers


document.getElementById("createReady").addEventListener("click", createReady);
document.getElementById("createDenkmal").addEventListener("click", createDenkmal);
document.getElementById("resetCreateDenkmal").addEventListener("click", resetCreateDenkmal);
document.getElementById("editDenkmal").addEventListener("click", editDenkmal);
document.getElementById("deleteDenkmal").addEventListener("click", deleteDenkmal);

function careDenkmal() {

  lastid = lastid.replace('denkmaeler.', '');
  var url = pyUrl + 'maintainDenkmal.py?ogc_fid=' + lastid;
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      try {
        var res = JSON.parse(this.response);
        if (res.request === 'done') {
          alert('Danke für´s Kümmern!\n ')
          wmsLayerSource.updateParams({
            'update': Math.random()
          });
        } else {
          alert("Leider ist etwas schief gelaufen.");
        }
      } catch (e) {
        alert("Leider ist etwas schief gelaufen.");
      }
    }
  };
  xhttp.onerror = function () {
    alert("Leider ist etwas schief gelaufen.");
  };
  xhttp.open("Get", url, true);
  xhttp.send();

}


function createReady() {
  if (document.getElementById("coordinates_create_x").innerText === '') {
    alert('Bitte in die Karte klicken um den Standort eiens Denkmals anzulegen.');
  } else {
    let createLat = document.getElementById('coordinates_create_x').innerText;
    let createLon = document.getElementById('coordinates_create_y').innerText;
    document.getElementById('createNonModal').style.display = 'none';
    document.getElementById('create').style.display = 'block';

    // remove icon
    var layers = map.getLayers().getArray();;

    for (var i = layers.length - 1; i >= 0; i--) {
      if (layers[i].className_ == 'pinVector') {
        layers[i].setVisible(false);
      }
    }

    // delete spans & values
    document.getElementById('create_modelUrl').value = '';
    document.getElementById('create_bezeichnung').value = '';
    document.getElementById('create_fotoUrl').value = '';
    document.getElementById('create_wikiUrl').value = '';
    document.getElementById('create_osm').checked = false;
    document.getElementById('create_denkmalliste').value = '';
    document.getElementById('create_strasse').value = '';
    document.getElementById('create_hausnummer').value = '';
    document.getElementById('create_plz').value = '';
    document.getElementById('create_stadtbezirk').value = '';
    document.getElementById('create_kategorie').value = '';
    document.getElementById('create_architektur').value = '';
    document.getElementById('create_bezeichnung').value = '';
    document.getElementById('create_unterschutz').value = '';
    document.getElementById('create_baujahr').value = '';
    document.getElementById('create_eigentum').value = '';


  }
}

function createDenkmal() {

  if (document.getElementById("license").checked === false) {
    alert('Bitte zunächst die Lizenz akzeptieren');

  } else {
    document.getElementById('loader').style.display = 'block';

    var bezeichnung = document.getElementById('create_bezeichnung').value;
    var strasse = document.getElementById('create_strasse').value;
    var hausnummer = document.getElementById('create_hausnummer').value;
    var plz = document.getElementById('create_plz').value;
    var stadtbezirk = document.getElementById('create_stadtbezirk').value;
    var baujahr = document.getElementById('create_baujahr').value;
    var unterschutz = document.getElementById('create_unterschutz').value;
    var eigentum = document.getElementById('create_eigentum').value;
    var denkmalliste = document.getElementById('create_denkmalliste').value;
    var kategorie = document.getElementById('create_kategorie').value;
    var architektur = document.getElementById('create_architektur').value;
    //  var amtsblatt = document.getElementById('create_amtsblatt').value;
    //var bemerkung = document.getElementById('create_bemerkung').value;
    var modelurl = document.getElementById('create_modelUrl').value;
    var model = 'nein';
    if (modelurl.length > 0) {
      model = 'ja';
    }
    var fotourl = document.getElementById('create_fotoUrl').value;
    var foto = 'nein';
    if (fotourl.length > 0) {
      foto = 'ja';
    }
    var wikiurl = document.getElementById('create_wikiUrl').value;
    var wiki = 'nein';
    if (wikiurl.length > 0) {
      wiki = 'ja';
    }
    var osm = document.getElementById('create_osm');
    if (osm.checked) {
      osm = 'ja';
    } else {
      osm = 'nein';
    }

    var url = `${pyUrl}createDenkmal.py?lat=${cord_e_3857}&lon=${cord_n_3857}&model=${model}&modelurl=${modelurl}&bezeichnung=${bezeichnung}
&strasse=${strasse}&hausnummer=${hausnummer}&plz=${plz}&stadtbezirk=${stadtbezirk}&baujahr=${baujahr}
&unterschutzstellung=${unterschutz}&eigentum=${eigentum}&denkmalliste=${denkmalliste}&kategorie=${kategorie}&foto=${foto}&fotourl=${fotourl}
&wiki=${wiki}&wikiurl=${wikiurl}&osm=${osm}&architektur=${architektur}`;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {

        try {
          var res = JSON.parse(this.response);
          if (res.request === 'done') {
            document.getElementById('loader').style.display = 'none';
            alert('Danke! Ein neues Denkmal wurde eingepflegt.')
            document.getElementById('create').style.display = 'none';
            document.getElementById('CreateDiv').style.border = "0px solid red";
            document.getElementById("coordinates_create_x").innerText = '';
            document.getElementById("coordinates_create_y").innerText = '';
            createTool = false;
            // Pseudo Parameter for the refresh
            wmsLayerSource.updateParams({
              'update': Math.random()
            });
          } else {
            alert("Leider ist etwas schief gelaufen.");
            document.getElementById('loader').style.display = 'none';
          }
        } catch (e) {
          alert("Leider ist etwas schief gelaufen.");
          document.getElementById('loader').style.display = 'none';
        }
      }
    };
    xhttp.onerror = function () {
      document.getElementById('loader').style.display = 'none';
      alert("Leider ist etwas schief gelaufen.");
    };

    xhttp.open("Get", url, true);
    xhttp.send();
  }
}

function editDenkmal() {
  if (document.getElementById("licenseEdit").checked === false) {
    alert('Bitte zunächst die Lizenz akzeptieren');
  } else {
    document.getElementById('loader').style.display = 'block';
    lastid = lastid.replace('denkmaeler.', '');
    //var comment = document.getElementById('commentEdit').value;


    var modelurlEdit = document.getElementById('edit_modelUrl').value;
    var model = lastmodel;

    var model_careEdit = document.getElementById('edit_model_care');
    if (model_careEdit.checked === false) {
      model = 'nein';
    }

    if (modelurlEdit.length > 0) {
      model = 'ja';
    }

    var foto = lastfoto;
    var fotourlEdit = document.getElementById('edit_fotoUrl').value;
    if (fotourlEdit.length > 0) {
      foto = 'ja';
    } else {
      foto = 'nein';
    }
    var wiki = lastwiki;
    var wikiurlEdit = document.getElementById('edit_wikiUrl').value;
    if (wikiurlEdit.length > 0) {
      wiki = 'ja';
    }
    var bezeichnungEdit = document.getElementById('edit_bezeichnung').value;

    var osmEdit = document.getElementById('edit_osm');
    if (osmEdit.checked === true) {
      osmEdit = 'ja'
    } else { osmEdit = 'nein' }

    var strasseEdit = document.getElementById('edit_strasse').value;
    var hausnummerEdit = document.getElementById('edit_hausnummer').value;
    var plzEdit = document.getElementById('edit_plz').value;
    var stadtbezirkEdit = document.getElementById('edit_stadtbezirk').value;
    var baujahrEdit = document.getElementById('edit_baujahr').value;
    var unterschutzEdit = document.getElementById('edit_unterschutz').value;
    var eigentumEdit = document.getElementById('edit_eigentum').value;
    var denkmallisteEdit = document.getElementById('edit_denkmalliste').value;
    var kategorieEdit = document.getElementById('edit_kategorie').value;
    var architekturEdit = document.getElementById('edit_architektur').value;

    var aktualisierung = new Date();
    aktualisierung = aktualisierung.getFullYear() + "-" + (aktualisierung.getMonth() + 1) + "-" + aktualisierung.getDate();

    var url = `${pyUrl}editDenkmal.py?ogc_fid=${lastid}&model=${model}&modelurl=${modelurlEdit}&bezeichnung=${bezeichnungEdit}
&strasse=${strasseEdit}&hausnummer=${hausnummerEdit}&plz=${plzEdit}&stadtbezirk=${stadtbezirkEdit}&baujahr=${baujahrEdit}
&unterschutzstellung=${unterschutzEdit}&eigentum=${eigentumEdit}&denkmalliste=${denkmallisteEdit}&kategorie=${kategorieEdit}&foto=${foto}
&fotourl=${fotourlEdit}&wiki=${wiki}&wikiurl=${wikiurlEdit}&osm=${osmEdit}&aktualisierung=${aktualisierung}&architektur=${architekturEdit}`;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {

        try {
          var res = JSON.parse(this.response);
          if (res.request === 'done') {

            document.getElementById('loader').style.display = 'none';
            alert('Danke! Die Daten des Denkmals wurden angepasst.')
            document.getElementById('edit').style.display = 'none';
            document.getElementById('EditDiv').style.border = "0px solid red";
            editTool = false;

            // Pseudo Parameter for the refresh
            wmsLayerSource.updateParams({
              'update': Math.random()
            });
          } else {
            alert("Leider ist etwas schief gelaufen.");
            document.getElementById('loader').style.display = 'none';
          }

        } catch (e) {
          alert("Leider ist etwas schief gelaufen.");
          document.getElementById('loader').style.display = 'none';
        }

      }

    };
    xhttp.onerror = function () {
      document.getElementById('loader').style.display = 'none';
      alert("Leider ist etwas schief gelaufen.");
    };

    xhttp.open("Get", url, true);
    xhttp.send();
  }
}

function deleteDenkmal() {
  if (document.getElementById("checkDelete").checked === false) {
    alert('Bitte zunächst die Checkbox aktivieren, um zu Bestätigen, dass dieses Denkmal wirklich gelöscht werden soll.');
  } else {

    lastid = lastid.replace('denkmaeler.', '');
    var url = pyUrl + 'deleteDenkmal.py?ogc_fid=' + lastid;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {

        try {
          var res = JSON.parse(this.response);
          if (res.request === 'done') {
            alert('Danke! Dieses Denkmal wurde aus dem Datensatz gelöscht.')
            document.getElementById('delete').style.display = 'none';
            document.getElementById('DeleteDiv').style.border = "0px solid red";
            deleteTool = false;

            // Pseudo Parameter for the refresh
            wmsLayerSource.updateParams({
              'update': Math.random()
            });
          } else {
            alert("Leider ist etwas schief gelaufen.");
            document.getElementById('loader').style.display = 'none';
          }

        } catch (e) {
          alert("Leider ist etwas schief gelaufen.");
          document.getElementById('loader').style.display = 'none';
        }
      }
    };
    xhttp.onerror = function () {
      alert("Leider ist etwas schief gelaufen.");
    };

    xhttp.open("Get", url, true);
    xhttp.send();
  }
}

function closeFiViaButton() {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};


// help
document.getElementById("helpIcon").addEventListener("click", help);

function help() {
  document.getElementById("help").style.display = "block";
  document.getElementById("head").style.pointerEvents = "none";
  document.getElementById("head").style.opacity = "50%";
  document.getElementById("map").style.pointerEvents = "none";
  document.getElementById("map").style.opacity = "50%";
}
document.getElementById("closeHelp").addEventListener("click", closeHelp);

function closeHelp() {
  document.getElementById("help").style.display = "none";
  document.getElementById("head").style.pointerEvents = "auto";
  document.getElementById("head").style.opacity = "1";
  document.getElementById("map").style.pointerEvents = "auto";
  document.getElementById("map").style.opacity = "1";
}
// legal notes
document.getElementById("legalIcon").addEventListener("click", legal);

function legal() {
  document.getElementById("legal").style.display = "block";
  document.getElementById("head").style.pointerEvents = "none";
  document.getElementById("head").style.opacity = "50%";
  document.getElementById("map").style.pointerEvents = "none";
  document.getElementById("map").style.opacity = "50%";
}
document.getElementById("closeLegal").addEventListener("click", closeLegal);

function closeLegal() {
  document.getElementById("legal").style.display = "none";
  document.getElementById("head").style.pointerEvents = "auto";
  document.getElementById("head").style.opacity = "1";
  document.getElementById("map").style.pointerEvents = "auto";
  document.getElementById("map").style.opacity = "1";
}

document.getElementById("storyIcon").addEventListener("click", story);

function story() {
  document.getElementById("story").style.display = "block";
  document.getElementById("head").style.pointerEvents = "none";
  document.getElementById("head").style.opacity = "50%";
  document.getElementById("map").style.pointerEvents = "none";
  document.getElementById("map").style.opacity = "50%";
}
document.getElementById("closestory").addEventListener("click", closestory);

function closestory() {
  document.getElementById("story").style.display = "none";
  document.getElementById("head").style.pointerEvents = "auto";
  document.getElementById("head").style.opacity = "1";
  document.getElementById("map").style.pointerEvents = "auto";
  document.getElementById("map").style.opacity = "1";
}

document.getElementById("closeCreate").addEventListener("click", closeCreate);

function closeCreate() {
  document.getElementById("create").style.display = "none";
  document.getElementById("head").style.pointerEvents = "auto";
  document.getElementById("head").style.opacity = "1";
  document.getElementById("map").style.pointerEvents = "auto";
  document.getElementById("map").style.opacity = "1";
  document.getElementById('CreateDiv').style.border = "0px solid red";
  document.getElementById("coordinates_create_x").innerText = '';
  document.getElementById("coordinates_create_y").innerText = '';
  createTool = false;
}

document.getElementById("closeEdit").addEventListener("click", closeEdit);

function closeEdit() {
  document.getElementById("edit").style.display = "none";
  document.getElementById("head").style.pointerEvents = "auto";
  document.getElementById("head").style.opacity = "1";
  document.getElementById("map").style.pointerEvents = "auto";
  document.getElementById("map").style.opacity = "1";
  document.getElementById('EditDiv').style.border = "0px solid red";
  editTool = false;
}

document.getElementById("closeDelete").addEventListener("click", closeDelete);

function closeDelete() {
  document.getElementById("delete").style.display = "none";
  document.getElementById("head").style.pointerEvents = "auto";
  document.getElementById("head").style.opacity = "1";
  document.getElementById("map").style.pointerEvents = "auto";
  document.getElementById("map").style.opacity = "1";
  document.getElementById('DeleteDiv').style.border = "0px solid red";
  deleteTool = false;
}

// get url parameters helper
function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value;
  });
  return vars;
}


function documentLoaded(e) {
  // handle very small displays
  if (innerWidth < 450) {
    var title = document.getElementById("titleApp");
    title.style.fontSize = "1.1rem";
    title.style.top = "0px";
  }
}
document.addEventListener("DOMContentLoaded", documentLoaded);
