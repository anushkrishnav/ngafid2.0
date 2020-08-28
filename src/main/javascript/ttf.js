import 'bootstrap';
import React, { Component } from "react";
import ReactDOM from "react-dom";
import Form from "react-bootstrap/Form";

import { errorModal } from "./error_modal.js";
import { map, styles, layers, Colors, overlay, initializeMap } from "./map.js";
import  TimeHeader from "./time_header.js";
import SignedInNavbar from "./signed_in_navbar.js";

import Overlay from 'ol/Overlay';
import {fromLonLat, toLonLat} from 'ol/proj.js';
import {Group, Vector as VectorLayer} from 'ol/layer.js';
import {Vector as VectorSource} from 'ol/source.js';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style.js';
import Draw from 'ol/interaction/Draw.js';

import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import Point from 'ol/geom/Point.js';
import { Filter } from './filter.js';

import Plotly from 'plotly.js';

var moment = require('moment');

initializeMap();

class TTFCard extends React.Component {
    constructor(props) {
        super(props);
        console.log(airports);
        var date = new Date();
        this.state = {
            // The start of the date range that this.state.data corresponds to.
            // This will be null if and only if this.state.data is null
            dataStartDate: null,

            // The end of the date range that this.state.data corresponds to.
            // This will be null if and only if this.state.data is null
            dataEndDate: null,

            // Data is an object containing the following information:
            //     data = {
            //         airports: [ <list of airports that appear in the ttf list> ],
            //         ttfs: [ <list of turn to final objects> ],
            //     }
            // The turn to final objects are defined in the org.ngafid.flights.TurnToFinal::jsonify method.
            data: null,

            datesChanged: true,

            startYear: 2000,
            startMonth: 1,
            endYear: date.getFullYear(),
            endMonth: date.getMonth() + 1,
            startDate: "2000-01-01",
            endDate: new String(date.getFullYear()) + "-" + (date.getMonth() + 1) + "-01",

            selectedAirport: airports[0],
            selectedRunway: "Any Runway",
            mapVisible: true,
            plotVisible: true,
            mapStyle: "Road",

            // Style object for ttf lines. This is just a thin green line style.
            ttfStyle:
                new Style({
                    stroke: new Stroke({
                        color: "#00ff00",
                        width: 2.5
                    }),
                    image: new Circle({
                        radius: 5,
                        //fill: new Fill({color: [0, 0, 0, 255]}),
                        stroke: new Stroke({
                            color: [0, 0, 0, 0],
                            width: 2
                        })
                    })
                }),
            optimalDescentExceedencesStyle:
                new Style({
                     stroke: new Stroke({
                         color: "#ff0000",
                         width: 1.5
                     }),
                     image: new Circle({
                         radius: 5,
                         //fill: new Fill({color: [0, 0, 0, 255]}),
                         stroke: new Stroke({
                             color: [0, 0, 0, 0],
                             width: 2
                         })
                     })
                }),
            plotlyLayout: {
                title: 'Self Defined Glide Angles',
                autosize: true,
                margin: {
                    pad: 10
                }
            },

            plotlyConfig: {responsive: true}
        };

        var navbar = ReactDOM.render(
            <SignedInNavbar
                                 filterVisible={false}
                                 plotVisible={this.state.plotVisible}
                                 mapVisible={this.state.mapVisible}
                                 filterSelected={false}
                                 plotSelected={false}
                                 mapSelected={false}
                                 mapStyle={this.state.mapStyle}
                                 togglePlot={() => this.togglePlot()}
                                 toggleFilter={() => this.toggleFilter()}
                                 toggleMap={() => this.toggleMap()}
                                 mapSelectChanged={(style) => this.mapSelectChanged(style)}
                                 waitingUserCount={waitingUserCount}
                                 fleetManager={fleetManager}
                                 unconfirmedTailsCount={unconfirmedTailsCount}
                                 modifyTailsAccess={modifyTailsAccess}/>,
            document.querySelector('#navbar')
        );

        // https://embed.plnkr.co/plunk/hhEAWk
        map.on('click', function(event) {
            // https://openlayers.org/en/latest/examples/popup.html
            var container = document.getElementById('popup');
            var content = document.getElementById('popup-content');
            var closer = document.getElementById('popup-closer');

            closer.onclick = function() {
                overlay.setPosition(undefined);
                closer.blur();
                return false;
            };

            var coordinate = event.coordinate;
            var f = map.forEachFeatureAtPixel(event.pixel, function(feature, layer) { return feature; });
            console.log(f);
            if (f && f.get('type') == 'ttf') {
                var geometry = f.getGeometry();
                var coord = geometry.getCoordinates();
                console.log("selected feature " + f.get('name'));
                content.innerHTML = '<p>Flight ' + f.get('ttf').flightId + '</p>, <a href="#" class="btn btn-info">Open Flight Page</a>';
                overlay.setPosition(coordinate);
                container.style.display = "block";
            } else {
                container.style.display = 'none';
            }
        });

        Plotly.newPlot('glide-angle-plot', {}, this.state.plotlyLayout, this.state.plotlyConfig);
    }

    mapSelectChanged(style) {
        for (var i = 0, ii = layers.length; i < ii; ++i) {
            layers[i].setVisible(styles[i] === style);
        }

        this.setState({mapStyle: style});
    }

    showMap() {
        if (this.state.mapVisible) return;

        if ( !$("#map-toggle-button").hasClass("active") ) {
            $("#map-toggle-button").addClass("active");
            $("#map-toggle-button").attr("aria-pressed", true);
        }

        this.state.mapVisible = true;
        this.setState(this.state);

        $("#map-div").css("height", "50%");
        $("#map").show();

        $("#map").css("width", "100%");

    }

    hideMap() {
        if (!this.state.mapVisible) return;

        if ( $("#map-toggle-button").hasClass("active") ) {
            $("#map-toggle-button").removeClass("active");
            $("#map-toggle-button").attr("aria-pressed", false);
        }

        this.state.mapVisible = false;
        this.setState(this.state);

        $("#map").hide();

        $("#map").css("height", "0%");
    }

    toggleMap() {
        if (this.state.mapVisible) {
            this.hideMap();
        } else {
            this.showMap();
        }
    }

    toggleFilter() {
        if (this.state.filterVisible) {
            this.hideFilter();
        } else {
            this.showFilter();
        }
    }

    ttfToPoints(ttf) {
        // This will generate a list of points in the appropriate format and save it, so it is only computed once.
        // This should only ever get called once though so I guess this is unnecessary.
        if (typeof ttf.points !== 'undefined')
            return ttf.points;

        var points = [];
        ttf.points = points;

        for (var i = 0; i < ttf.lon.length; i++) {
            var point = fromLonLat([ttf.lon[i], ttf.lat[i]]);
            points.push(point);
        }

        return points;
    }

    rangeExtraction(list) {
        var len = list.length;
        if (len == 0) return [];

        var out = [];
        var i, j;

        for (i = 0; i < len; i = j + 1) {
            // find end of range
            for (var j = i + 1; j < len && list[j] == list[j-1] + 1; j++);
            j--;

            if (i == j) {
                // single number
                out.push([list[i]]);
            } else {
                out.push([list[i], list[j]]);
            }
        }

        return out;
    }

    rangesToFeatures(points, ranges) {
        // Ranges should be a list of ranges generated by rangeExtraction
        // the ranges generated by list extraction are either ranges (an array, [min, max]) or a single number in an array
        // [like_this]. We ignore the numbers that are by themselves since they cannot be connected to anything. In the
        // future perhaps it would be good to display them as dots.
        var features = [];
        for (var i = 0; i < ranges.length; i++) {
            let r = ranges[i];
            if (r.length == 1) continue; // There is no range, just a single number

            let min = r[0];
            let max = r[1];
            let rangePoints = [];

            // This is an inclusive range.
            for (var j = min; j <= max; j++)
                rangePoints.push(points[j]);

            features.push(new Feature({
                geometry: new LineString(rangePoints)
            }));
        }
        return features;
    }

    makeTtfLayers(ttf) {
        // This will generate a layer for this ttf if once hasn't been generated before, and add it to the map as a
        // hidden layer.
        if (typeof ttf.layer !== 'undefined')
            return ttf.layer;

        var points = this.ttfToPoints(ttf);

        // Create simple layer of the path.
        let trackingPoint =
            new Feature({
                geometry : new Point(points[0]),
                name: 'TrackingPoint'
            });
        var features = [
            new Feature({
                geometry: new LineString(points),
                name: ttf.flightId,
                type: 'ttf',
                ttf: ttf
            }),
            trackingPoint
        ];

        let layer = new VectorLayer({
            style: this.state.ttfStyle,
            source : new VectorSource({
                features: features,
            }),
        });

        ttf.layer = layer;
        map.addLayer(layer);
        layer.setVisible(false);


        // Create a layer of the optimalDescentExceedences

        let odeFeatures = this.rangesToFeatures(points, this.rangeExtraction(ttf.locExceedences));
        let optimalDescentExceedencesLayer = new VectorLayer({
            style: this.state.optimalDescentExceedencesStyle,
            source: new VectorSource({ features: odeFeatures }),
        });

        ttf.optimalDescentExceedencesLayer = optimalDescentExceedencesLayer;
        map.addLayer(optimalDescentExceedencesLayer);
        optimalDescentExceedencesLayer.setVisible(false);

    }

    plotTTF(ttf) {
        this.makeTtfLayers(ttf);

        let layer = ttf.layer;
        layer.setVisible(true);

        let optimalDescentExceedencesLayer = ttf.optimalDescentExceedencesLayer;
        optimalDescentExceedencesLayer.setVisible(true);

        // let extent = layer.getSource().getExtent();
        // console.log(extent);
        // map.getView().fit(extent, map.getSize());
    }

    hideTTF(ttf) {
        this.makeTtfLayers(ttf);
        let layer = ttf.layer;
        layer.setVisible(false);

        let optimalDescentExceedencesLayer = ttf.optimalDescentExceedencesLayer;
        optimalDescentExceedencesLayer.setVisible(false);
    }

    plotSelfDefinedGlideAngles(ttfs) {
        let curves = ttfs.map(ttf => {
            let y = ttf.selfDefinedGlideAngle;
            return { x: [...Array(y.length).keys()], y: y, type: 'scatter', mode: 'lines' };
        });

        console.log(curves.length);

        Plotly.newPlot('glide-angle-plot', curves, this.state.plotlyLayout, this.state.plotlyConfig);
    }

    getRunwayValue() {
        let runwayElement = this.state.selectedRunway;
        if (runwayElement == null)
            return null;
        else if (this.state.dataAirport != this.getAirportValue())
            return null;
        else
            return runwayElement.value;
    }

    getAirportValue() {
        return this.state.selectedAirport;
    }

    onFetchClicked() {
        var startDateString = this.state.startDate;
        var endDateString = this.state.endDate;
        var airport = this.state.selectedAirport;
        var runway = this.state.selectedRunway;

        var submissionData = {
            startDate: startDateString,
            endDate: endDateString,
            airport: airport,
        };
        var thisTTF = this;

        // For parsing dates in the format "yyyy-mm-dd hh:mm:ss" where the hh:mm:ss is optional
        function parseDate(dateString) {
            if (dateString == null) return null;
            var pieces = dateString.split(" ");
            var yyyymmdd = pieces[0].split("-");
            var year = yyyymmdd[0];
            // Minus 1 because dates are zero indexed in javascript
            var month = parseInt(yyyymmdd[1]) - 1;
            var day = yyyymmdd[2];

            if (pieces.length > 1) {
                var hhmmss = pieces[1].split(":");
                var hour = hhmmss[0];
                var minutes = hhmmss[1];
                var seconds = hhmmss[2];

                return new Date(year, month, day, hour, minutes, seconds);
            } else
                return new Date(year, month, day);

            return new Date(year, month, day);
        }

        var startDate = parseDate(startDateString);
        var endDate = parseDate(endDateString);

        // start and end dates for the data we already have
        // This won't encounter an error even if either of dataStartDate or dataEndDate is null.
        // If they're null then they won't get used because this.state.data is also null.
        // This feels like bad practice though.
        var dataStartDate = parseDate(this.state.dataStartDate);
        var dataEndDate = parseDate(this.state.dataEndDate);

        // These should all be date objects
        function dateWithinRange(date, startDate, endDate) {
            return startDate <= date && date <= endDate;
        }

        // This will show TTFs in the specified date range and hide every other TTF.
        // If the TTFs have already been plotted it will use the previous layer.
        function responseFunction(response) {
            console.log("Executing response function");
            var ttfs = [];
            for (var i = 0; i < response.ttfs.length; i++) {
                let date = parseDate(response.ttfs[i].flightStartDate);
                let ttf = response.ttfs[i];

                if ((runway == null || ["Any Runway", ttf.runway].includes(runway)) && dateWithinRange(date, startDate, endDate)) {
                    ttfs.push(ttf);
                    thisTTF.plotTTF(ttf);
                } else {
                    thisTTF.hideTTF(ttf);
                }
            }

            thisTTF.plotSelfDefinedGlideAngles(ttfs);
            thisTTF.setState({data: response})

        }

        // If we already have some data, and the date range of that data contains the new date range,
        // then we don't need to fetch any more data - just turn off layers for data that not within the new range.
        // We should keep the old dataStartDate and dataEndDate though to preserve the entire range.
        if (this.state.data != null &&
            dateWithinRange(startDate, dataStartDate, dataEndDate) &&
            dateWithinRange(endDate,   dataStartDate, dataEndDate) &&
            airport == this.state.dataAirport) {
            responseFunction(this.state.data);
        } else {
            // Remove all old layers
            if (this.state.data != null) {
                console.log("Removing old layers");
                for (var ttf of this.state.data.ttfs) {
                    map.removeLayer(ttf.layer);
                    map.removeLayer(ttf.optimalDescentExceedencesLayer);
                    console.log(ttf.layer);
                }
            }

            // Fetch the data.
            $.ajax({
                type: 'POST',
                url: '/protected/ttf',
                data : submissionData,
                dataType : 'json',
                success : function(response) {
                    console.log("Fetched response " + response);

                    // store the dates we have fetched data for
                    thisTTF.state.dataAirport = submissionData.airport;
                    thisTTF.state.dataStartDate = submissionData.startDate;
                    thisTTF.state.dataEndDate = submissionData.endDate;

                    responseFunction(response);
                },
                error : function(jqXHR, textStatus, errorThrown) {
                    console.log(textStatus);
                    console.log(errorThrown);
                },
                async: true
            });
        }
    }

    getAirports() {
        if (this.state.data == null) {
            console.log("This shouldn't get called when this.state.data == null");
            return null;
        }

        // list of airport IATA codes
        var airports = [];

        for (let [name, ap] of Object.entries(this.state.data.airports)) {
            console.log(ap);
            airports.push(ap.iataCode);
        }

        console.log(airports);
        return airports;
    }

    onAirportFilterChanged(airport) {
        let iataCode = airport;

        this.state.selectedAirport = iataCode;
        this.state.selectedRunway = "Any Runway";

        this.forceUpdate();
    }

    onUpdateStartYear(year) {
        this.state.startYear = year;
        this.setDates();
        this.forceUpdate();
    }

    onUpdateStartMonth(month) {
        this.state.startMonth = month;
        this.setDates();
        this.forceUpdate();
    }

    onUpdateEndYear(year) {
        this.state.endYear = year;
        this.setDates();
        this.forceUpdate();
    }

    onUpdateEndMonth(month) {
        this.state.endMonth = month;
        this.setDates();
        this.forceUpdate();
    }

    setDates() {
        this.state.datesChanged = true;
        if (this.startMonth < 10) {
            this.startDate = "" + this.startYear + "-0" + this.startMonth + "-01";
        } else {
            this.startDate = "" + this.startYear + "-" + this.startMonth + "-01";
        }

        if (this.endMonth < 10) {
            this.endDate = "" + this.endYear + "-0" + this.endMonth + "-01";
        } else {
            this.endDate = "" + this.endYear + "-" + this.endMonth + "-01";
        }
    }

    onRunwayFilterChanged(runway) {
        if (runway == null) {
            throw "getRunwayValue returned null even though the onRunwayFilterChanged event handler was called."
        }

        this.state.selectedRunway = runway;

        if (this.state.data != null)
            for (const ttf of this.state.data.ttfs) {
                if (runway == "Any Runway" || runway == ttf.runway.name)
                    this.plotTTF(ttf);
                else
                    this.hideTTF(ttf);
        }

        this.forceUpdate();
    }

    render() {
        console.log("re-rendering");

        let runwaySelect;

        if (this.state.data == null) {
            runwaySelect = ( <div> </div> );
        } else {
            let airport = this.state.dataAirport;
            runwaySelect = (
                <div>
                    <label htmlFor="runway">Runway: </label>
                    <Form.Control as="select" id="runway" selected="Any Runway" onChange={()=>this.onRunwayFilterChanged()}>
                        <option key="Any Runway"> Any Runway </option>
                        {
                            runways[airport].map(runway => ( <option key={runway.name}>{runway.name}</option> ))
                        }
                    </Form.Control>
                </div>
            );
        }
        console.log(this.state);
        let runwayList = runways[this.state.selectedAirport].map(runway => runway.name);

        let form = (
            <div>
                <TimeHeader
                    name="Flight Filters"
                    airframes={[]}
                    startYear={this.state.startYear}
                    startMonth={this.state.startMonth}
                    endYear={this.state.endYear}
                    endMonth={this.state.endMonth}
                    datesChanged={this.state.datesChanged}
                    dateChange={() => this.onFetchClicked()}
                    updateStartYear={(newStartYear) => this.onUpdateStartYear(newStartYear)}
                    updateStartMonth={(newStartMonth) => this.onUpdateStartMonth(newStartMonth)}
                    updateEndYear={(newEndYear) => this.onUpdateEndYear(newEndYear)}
                    updateEndMonth={(newEndMonth) => this.onUpdateEndMonth(newEndMonth)}
                    airport={this.state.selectedAirport}
                    airports={airports}
                    airportChange={(airport) => this.onAirportFilterChanged(airport)}
                    runway={this.state.selectedRunway}
                    runways={runwayList}
                    runwayChange={(runway) => this.onRunwayFilterChanged(runway)}
                />
                <br/>
            </div>
        );

        return form;
    }
}

let ttfCard = null;
//check to see if flights has been defined already. unfortunately
//the navbar includes flights.js (bad design) for the navbar buttons
//to toggle flights, etc. So this is a bit of a hack.
ttfCard = ReactDOM.render(
    <TTFCard />,
    document.querySelector('#ttf-card')
);

console.log("rendered ttfCard!");

export { ttfCard };
