import 'bootstrap';
import React, { Component } from "react";
import ReactDOM from "react-dom";
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import {Alert, Button, InputGroup, Form, Col} from 'react-bootstrap';

import { confirmModal } from "./confirm_modal.js";
import { errorModal } from "./error_modal.js";
import SignedInNavbar from "./signed_in_navbar.js";
import { map, styles, layers, Colors } from "./map.js";
import { View } from 'ol'

import {fromLonLat, toLonLat} from 'ol/proj.js';
import {Group, Vector as VectorLayer} from 'ol/layer.js';
import {Vector as VectorSource} from 'ol/source.js';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style.js';
import Draw from 'ol/interaction/Draw.js';

import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import Point from 'ol/geom/Point.js';
import { Filter } from './filter.js';
import { Itinerary } from './itinerary_component.js';
import { TraceButtons } from './trace_buttons_component.js';
import { Tags } from './tags_component.js';
import { Events } from './events_component.js';


var moment = require('moment');


import Plotly from 'plotly.js';

var navbar = ReactDOM.render(
    <SignedInNavbar activePage="flights" waitingUserCount={waitingUserCount} fleetManager={fleetManager} unconfirmedTailsCount={unconfirmedTailsCount} modifyTailsAccess={modifyTailsAccess} plotMapHidden={plotMapHidden}/>,
    document.querySelector('#navbar')
);

global.plotlyLayout = { 
    shapes : []
};

/*
var airframes = [ "PA-28-181", "Cessna 172S", "PA-44-180", "Cirrus SR20"  ];
var tailNumbers = [ "N765ND", "N744ND", "N771ND", "N731ND", "N714ND", "N766ND", "N743ND" , "N728ND" , "N768ND" , "N713ND" , "N732ND", "N718ND" , "N739ND" ];
var doubleTimeSeriesNames = [ "E1 CHT1", "E1 CHT2", "E1 CHT3" ];
var visitedAirports = [ "GFK", "FAR", "ALB", "ROC" ];
*/
// var tagNames = ["Tag A", "Tag B"];

var rules = [
    {
        name : "Airframe",
        conditions : [
            { 
                type : "select",
                name : "condition",
                options : [ "is", "is not" ]
            },
            { 
                type : "select",
                name : "airframes",
                options : airframes
            }
        ]
    },

    {
        name : "Tail Number",
        conditions : [
            { 
                type : "select",
                name : "condition",
                options : [ "is", "is not" ]
            },
            {
                type : "select",
                name : "tail numbers",
                options : tailNumbers
            }
        ]
    },

    {
        name : "System ID",
        conditions : [
            { 
                type : "select",
                name : "condition",
                options : [ "is", "is not" ]
            },
            {
                type : "select",
                name : "system id",
                options : systemIds 
            }
        ]
    },


    {
        name : "Duration",
        conditions : [
            { 
                type : "select",
                name : "condition",
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type : "number",
                name : "hours"
            },
            {
                type : "number",
                name : "minutes"
            },
            {
                type : "number",
                name : "seconds"
            }
        ]
    },

    {
        name : "Start Date and Time",
        conditions : [
            {
                type : "select",
                name : "condition", 
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "datetime-local",
                name : "date and time"
            }
        ]
    },

    {
        name : "End Date and Time",
        conditions : [
            {
                type : "select",
                name : "condition", 
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "datetime-local",
                name : "date and time"
            }
        ]
    },

    {
        name : "Start Date",
        conditions : [
            {
                type : "select",
                name : "condition", 
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "date",
                name : "date"
            }
        ]
    },

    {
        name : "End Date",
        conditions : [
            {
                type : "select",
                name : "condition", 
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "date",
                name : "date"
            }
        ]
    },


    {
        name : "Start Time",
        conditions : [
            {
                type : "select",
                name : "condition",
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "time",
                name : "time"
            }
        ]
    },

    {
        name : "End Time",
        conditions : [
            {
                type : "select",
                name : "condition",
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "time",
                name : "time"
            }
        ]
    },


    {
        name : "Parameter",
        conditions : [
            {
                type : "select",
                name : "statistic",
                options : [ "min", "avg", "max" ]
            },
            {
                type : "select",
                name : "doubleSeries",
                options : doubleTimeSeriesNames
            },
            {
                type : "select",
                name : "condition",
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "number",
                name : "number"
            }
        ]
    },

    {
        name : "Airport",
        conditions : [
            { 
                type : "select",
                name : "airports",
                options : visitedAirports
            },
            { 
                type : "select",
                name : "condition",
                options : [ "visited", "not visited" ]
            }
        ]
    },

    {
        name : "Runway",
        conditions : [
            { 
                type : "select",
                name : "runways",
                options : visitedRunways
            },
            { 
                type : "select",
                name : "condition",
                options : [ "visited", "not visited" ]
            }
        ]
    },

    {
        name : "Event Count",
        conditions : [
            {
                type : "select",
                name : "eventNames",
                options : eventNames
            },
            {
                type : "select",
                name : "condition",
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "number",
                name : "number"
            }
        ]
    },

    {
        name : "Event Severity",
        conditions : [
            {
                type : "select",
                name : "eventNames",
                options : eventNames
            },
            {
                type : "select",
                name : "condition",
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "number",
                name : "number"
            }
        ]
    },

    {
        name : "Event Duration",
        conditions : [
            {
                type : "select",
                name : "eventNames",
                options : eventNames
            },
            {
                type : "select",
                name : "condition",
                options : [ "<=", "<", "=", ">", ">=" ]
            },
            {
                type  : "number",
                name : "number"
            }
        ]
    },

    {
        name : "Tag",
        conditions : [
            {
                type : "select",
                name : "flight_tags",
                options : tagNames
            },
            {
                type : "select",
                name : "condition",
                options : [ "Is Associated", "Is Not Associated"]
            },
        ]
    },


];


class Flight extends React.Component {
    constructor(props) {
        super(props);

        let color = Colors.randomValue();
        console.log("flight color: " );
        console.log(color);

        this.state = {
            pathVisible : false,
			pageIndex : props.pageIndex,
            mapLoaded : false,
            eventsLoaded : false,
            commonTraceNames : null,
            uncommonTraceNames : null,
            traceIndex : [],
            traceVisibility : [],
            traceNamesVisible : false,
            eventsVisible : false,
            tagsVisible : false,
            itineraryVisible : false,
            tags : props.tags,
            layer : null,
            parent : props.parent,
            color : color,

            eventsMapped : [],                              // Bool list to toggle event icons on map flightpath
            eventPoints : [],                               // list of event Features
            eventLayer : null,
            itineraryLayer : null,
            eventOutlines : [],
            eventOutlineLayer : null
        }
    }

    componentWillUnmount() {
        console.log("unmounting:");
        console.log(this.props.flightInfo);

        if (this.props.flightInfo.has_coords === "0") return;

        console.log("hiding flight path");
        this.state.pathVisible = false;
        this.state.itineraryVisible = false;
        if (this.state.layer) {
            this.state.layer.setVisible(false);
        }

        // hiding events
        if (this.state.eventLayer) {
            // map
            this.state.eventLayer.setVisible(false);
            this.state.eventOutlineLayer.setVisible(false);

            // plot
            let shapes = global.plotlyLayout.shapes;
            shapes.length = 0;
        }
        
        // hiding phases
        if (this.state.itineraryLayer) {
            this.state.itineraryLayer.setVisible(false);
        }


        console.log("hiding plots");
        if (this.state.commonTraceNames) {
            let visible = false;

            for (let i = 0; i < this.state.commonTraceNames.length; i++) {
                let seriesName = this.state.commonTraceNames[i];

                if (seriesName in this.state.traceIndex) {

                    //this will make make a trace visible if it was formly set to visible and the plot button this flight is clicked on
                    //otherwise it will hide them
                    Plotly.restyle('plot', { visible: (visible && this.state.traceVisibility[seriesName]) }, [ this.state.traceIndex[seriesName] ])
                }
            }

            for (let i = 0; i < this.state.uncommonTraceNames.length; i++) {
                let seriesName = this.state.uncommonTraceNames[i];

                if (seriesName in this.state.traceIndex) {

                    //this will make make a trace visible if it was formly set to visible and the plot button this flight is clicked on
                    //otherwise it will hide them
                    Plotly.restyle('plot', { visible: (visible && this.state.traceVisibility[seriesName]) }, [ this.state.traceIndex[seriesName] ])
                }
            }
        }
        this.state.traceNamesVisible = false;
    }

    plotClicked() {
        if (this.state.commonTraceNames == null) {
            var thisFlight = this;

            var submissionData = {
                flightId : this.props.flightInfo.id
            };

            $.ajax({
                type: 'POST',
                url: '/protected/double_series_names',
                data : submissionData,
                dataType : 'json',
                success : function(response) {
                    console.log("received response: ");
                    console.log(response);

                    var names = response.names;

                    /*
                     * Do these common trace parameters first:
                     * Altitiude AGL
                     * Altitude MSL
                     * E1 MAP
                     * E2 MAP
                     * E1 RPM
                     * E2 RPM
                     * IAS
                     * Normal Acceleration
                     * Pitch
                     * Roll
                     * Vertical Speed
                     */
                    var preferredNames = ["AltAGL", "AltMSL", "E1 MAP", "E2 MAP", "E1 RPM", "E2 RPM", "IAS", "NormAc", "Pitch", "Roll", "VSpd"];
                    var commonTraceNames = [];
                    var uncommonTraceNames = [];

                    for (let i = 0; i < response.names.length; i++) {
                        let name = response.names[i];

                        //console.log(name);
                        if (preferredNames.includes(name)) {
                            commonTraceNames.push(name);
                        } else {
                            uncommonTraceNames.push(name);
                        }
                    }

                    //set the trace number for this series
                    thisFlight.state.commonTraceNames = commonTraceNames;
                    thisFlight.state.uncommonTraceNames = uncommonTraceNames;
                    thisFlight.state.traceNamesVisible = true;
                    thisFlight.setState(thisFlight.state);
                },
                error : function(jqXHR, textStatus, errorThrown) {
                    this.state.commonTraceNames = null;
                    this.state.uncommonTraceNames = null;
                    errorModal.show("Error Getting Potentail Plot Parameters", errorThrown);
                },
                async: true
            });
        } else {
            let visible = !this.state.traceNamesVisible;

            for (let i = 0; i < this.state.commonTraceNames.length; i++) {
                let seriesName = this.state.commonTraceNames[i];

                //check and see if this series was loaded in the past
                if (seriesName in this.state.traceIndex) {

                    //this will make make a trace visible if it was formly set to visible and the plot button this flight is clicked on
                    //otherwise it will hide them
                    Plotly.restyle('plot', { visible: (visible && this.state.traceVisibility[seriesName]) }, [ this.state.traceIndex[seriesName] ])
                }
            }

            for (let i = 0; i < this.state.uncommonTraceNames.length; i++) {
                let seriesName = this.state.uncommonTraceNames[i];

                //check and see if this series was loaded in the past
                if (seriesName in this.state.traceIndex) {

                    //this will make make a trace visible if it was formly set to visible and the plot button this flight is clicked on
                    //otherwise it will hide them
                    Plotly.restyle('plot', { visible: (visible && this.state.traceVisibility[seriesName]) }, [ this.state.traceIndex[seriesName] ])
                }
            }


            this.state.traceNamesVisible = !this.state.traceNamesVisible;
            this.setState(this.state);
        }
    }

    flightColorChange(target, event) {
        console.log("trace color changed!");
        console.log(event);
        console.log(event.target);
        console.log(event.target.value);

        let color = event.target.value;
        target.state.color = color;

        console.log(target);
        console.log(target.state);

        target.state.layer.setStyle(new Style({
            stroke: new Stroke({
                color: color,
                width: 1.5
            })
        }));
    }

    downloadClicked() {
        window.open("/protected/get_kml?flight_id=" + this.props.flightInfo.id);
    }

    exclamationClicked() {
        console.log ("exclamation clicked!");

        if (!this.state.eventsLoaded) {
            console.log("loading events!");

            this.state.eventsLoaded = true;
            this.state.eventsVisible = true;

            var thisFlight = this;

            var submissionData = {
                flightId : this.props.flightInfo.id,
                eventDefinitionsLoaded : eventDefinitionsLoaded
            };

            $.ajax({
                type: 'POST',
                url: '/protected/events',
                data : submissionData,
                dataType : 'json',
                success : function(response) {
                    console.log("received response: ");
                    console.log(response);

                    if (!eventDefinitionsLoaded) {
                        eventDefinitions = response.definitions;
                        eventDefinitionsLoaded = true;
                    }

                    var events = response.events;
                    for (let i = 0; i < events.length; i++) {
                        for (let j = 0; j < eventDefinitions.length; j++) {

                            if (events[i].eventDefinitionId == eventDefinitions[j].id) {
                                events[i].eventDefinition = eventDefinitions[j];
                                console.log("set events[" + i + "].eventDefinition to:");
                                console.log(events[i].eventDefinition);
                            }
                        }
                    }
                    thisFlight.state.events = events;

                    // create list of event Features to display on map //
                    for (let i = 0; i < events.length; i++) {
                        var points;
                        var eventPoint;
                        var eventOutline;
                        let event = events[i];

                        // Create Feature for event
                        if (!thisFlight.state.mapLoaded){              // if points (coordinates) have not been fetched
                            // create eventPoint with placeholder coordinates
                            eventPoint = new Feature({
                                geometry : new LineString( [0,0] ),
                                name: 'Event'
                            });

                            // create outlines
                            eventOutline = new Feature({
                                geometry : new LineString( [0,0] ),
                                name: 'EventOutline'
                            });

                        } else {
                            // create eventPoint with preloaded coordinates
                            points = thisFlight.state.points;
                            eventPoint = new Feature({
                                 geometry: new LineString(points.slice(event.startLine, event.endLine + 2)),
                                 name: 'Event'
                            });

                            // create outlines
                            eventOutline = new Feature({
                                 geometry: new LineString(points.slice(event.startLine, event.endLine + 2)),
                                 name: 'EventOutline'
                            });
                        }

                        // add eventPoint to flight
                        thisFlight.state.eventsMapped.push(false);
                        thisFlight.state.eventPoints.push(eventPoint);
                        thisFlight.state.eventOutlines.push(eventOutline);
                    }

                    // create eventLayer & add eventPoints
                    thisFlight.state.eventLayer = new VectorLayer({
                        style: new Style({
                            stroke: new Stroke({
                                color: [0,0,0,0],
                                width: 3
                            })
                        }),

                        source : new VectorSource({
                            features: thisFlight.state.eventPoints
                        })
                    });

                    // create eventLayer & add eventPoints
                    thisFlight.state.eventOutlineLayer = new VectorLayer({
                        style: new Style({
                            stroke: new Stroke({
                                color: [0,0,0,0],
                                width: 4
                            })
                        }),

                        source : new VectorSource({
                            features: thisFlight.state.eventOutlines
                        })
                    });

                    //thisFlight.state.eventLayer.flightState = thisFlight;
                    thisFlight.state.eventOutlineLayer.setVisible(true);
                    thisFlight.state.eventLayer.setVisible(true);

                    // add to map only if flightPath loaded
                    if (thisFlight.state.mapLoaded){
                        map.addLayer(thisFlight.state.eventOutlineLayer);
                        map.addLayer(thisFlight.state.eventLayer);
                    }

                    thisFlight.setState(thisFlight.state);
                },
                error : function(jqXHR, textStatus, errorThrown) {
                    thisFlight.state.mapLoaded = false;
                    thisFlight.setState(thisFlight.state);

                    errorModal.show("Error Loading Flight Events", errorThrown);
                },
                async: true
            });

        } else {
            console.log("events already loaded!");

            //toggle visibility if already loaded
            this.state.eventsVisible = !this.state.eventsVisible;
            this.setState(this.state);
        }
    }

    cesiumClicked() {
        window.open("/protected/ngafid_cesium?flight_id=" + this.props.flightInfo.id);
    }

    tagClicked(){
        console.log ("tag clicked!");

        if (!this.state.eventsLoaded) {
            console.log("loading events!");

            var thisFlight = this;

            var submissionData = {
                flightId : this.props.flightInfo.id,
            };

            $.ajax({
                type: 'POST',
                url: '/protected/flight_tags',
                data : submissionData,
                dataType : 'json',
                success : function(response) {
                    console.log("received response: ");
                    console.log(response);

                    if(response != null){
                        thisFlight.state.tags = response;
                    }

                    thisFlight.setState(thisFlight.state);
                },   
                error : function(jqXHR, textStatus, errorThrown) {
                    thisFlight.state.mapLoaded = false;
                    thisFlight.setState(thisFlight.state);

                    errorModal.show("Error Loading Flight Tags", errorThrown);
                },   
                async: true 
            });  

        } else {
            console.log("tags already loaded!");

            //toggle visibility if already loaded
            this.state.tagsVisible = !this.state.tagsVisible;
            this.setState(this.state);
        }
        this.state.tagsVisible = !this.state.tagsVisible;
    }

    globeClicked() {
        if (this.props.flightInfo.has_coords === "0") return;

        if (!this.state.mapLoaded) {
            flightsCard.showMap();
            this.state.mapLoaded = true;

            var thisFlight = this;

            var submissionData = {
                request : "GET_COORDINATES",
                id_token : "TEST_ID_TOKEN",
                //id_token : id_token,
                //user_id : user_id
                user_id : 1,
                flightId : this.props.flightInfo.id,
            };

            $.ajax({
                type: 'POST',
                url: '/protected/coordinates',
                data : submissionData,
                dataType : 'json',
                success : function(response) {
                    //console.log("received response: ");
                    //console.log(response);

                    var coordinates = response.coordinates;

                    var points = [];
                    for (var i = 0; i < coordinates.length; i++) {
                        var point = fromLonLat(coordinates[i]);
                        points.push(point);
                    }

                    var color = thisFlight.state.color;
                    console.log(color);

                    thisFlight.state.trackingPoint = new Feature({
                                    geometry : new Point(points[0]),
                                    name: 'TrackingPoint'
                                });

                    thisFlight.state.layer = new VectorLayer({
                        style: new Style({
                            stroke: new Stroke({
                                color: color,
                                width: 3
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

                        source : new VectorSource({
                            features: [
                                new Feature({
                                    geometry: new LineString(points),
                                    name: 'Line'
                                }),
                                thisFlight.state.trackingPoint
                            ]
                        })
                    });

                    thisFlight.state.layer.flightState = thisFlight;

                    thisFlight.state.layer.setVisible(true);
                    thisFlight.state.pathVisible = true;
                    thisFlight.state.itineraryVisible = true;
                    thisFlight.state.nanOffset = response.nanOffset;
                    thisFlight.state.coordinates = response.coordinates;
                    thisFlight.state.points = points;

                    map.addLayer(thisFlight.state.layer);

                    // adding itinerary (approaches and takeoffs) to flightpath 
                    var itinerary = thisFlight.props.flightInfo.itinerary;
                    var flight_phases = [];

                    // Create flight phase styles
                    var takeoff_style = new Style({
                                stroke: new Stroke({
                                    color: "#34eb52",
                                    width: 3
                                })
                            });

                    var approach_style = new Style({
                                stroke: new Stroke({
                                    color: "#347deb",
                                    width: 3
                                })
                            });

                    // create and add Features to flight_phases for each flight phase in itinerary
                    for (let i = 0; i < itinerary.length; i++) {
                        var stop = itinerary[i];
                        var approach = null;
                        var takeoff = null;

                        // creating Linestrings
                        if (stop.startOfApproach != -1 && stop.endOfApproach != -1) {
                            approach = new LineString( points.slice( stop.startOfApproach, stop.endOfApproach ) );
                        }
                        if (stop.startOfTakeoff != -1 && stop.endOfTakeoff != -1) {
                            takeoff = new LineString( points.slice( stop.startOfTakeoff, stop.endOfTakeoff ) );
                        }

                        // set styles and add phases to flight_phases list
                        if (approach != null) {
                            let phase = new Feature({
                                             geometry: approach,
                                             name: 'Approach'
                                         });
                            phase.setStyle(approach_style);
                            flight_phases.push( phase );
                        }
                        if (takeoff != null) {
                            let phase = new Feature({
                                             geometry: takeoff,
                                             name: 'Takeoff'
                                         });
                            phase.setStyle(takeoff_style);
                            flight_phases.push( phase );
                        }
                    }

                    // create itineraryLayer
                    thisFlight.state.itineraryLayer = new VectorLayer({
                        style: new Style({
                            stroke: new Stroke({
                                color: [1,1,1,1],
                                width: 3
                            })
                        }),

                        source : new VectorSource({
                            features: flight_phases
                        })
                    });

                    // add itineraryLayer to map
                    map.addLayer(thisFlight.state.itineraryLayer);

                    // adding coordinates to events, if needed //
                    var events = [];
                    var eventPoints = [];
                    var eventOutlines = [];
                    if (thisFlight.state.eventsLoaded){
                        events = thisFlight.state.events;
                        eventPoints = thisFlight.state.eventPoints;
                        eventOutlines = thisFlight.state.eventOutlines;
                        for (let i = 0; i < events.length; i++){
                            let line = new LineString(points.slice(events[i].startLine, events[i].endLine + 2));
                            eventPoints[i].setGeometry(line);                   // set geometry of eventPoint Features
                            eventOutlines[i].setGeometry(line);
                        }

                        // add eventLayer to front of map
                        let eventLayer = thisFlight.state.eventLayer;
                        let outlineLayer = thisFlight.state.eventOutlineLayer;
                        map.addLayer(outlineLayer);
                        map.addLayer(eventLayer);
                    }

                    let extent = thisFlight.state.layer.getSource().getExtent();
                    console.log(extent);
                    map.getView().fit(extent, map.getSize());

                    thisFlight.setState(thisFlight.state);
                },   
                error : function(jqXHR, textStatus, errorThrown) {
                    thisFlight.state.mapLoaded = false;
                    thisFlight.setState(thisFlight.state);

                    errorModal.show("Error Loading Flight Coordinates", errorThrown);
                },   
                async: true 
            });  
        } else {
            //toggle visibility if already loaded
            this.state.pathVisible = !this.state.pathVisible;
            this.state.itineraryVisible = !this.state.itineraryVisible;
            this.state.layer.setVisible(this.state.pathVisible);


            // toggle visibility of events
            if (this.state.eventLayer != null) {
                this.state.eventLayer.setVisible(!this.state.eventLayer.getVisible());
                this.state.eventOutlineLayer.setVisible(!this.state.eventOutlineLayer.getVisible());
            }
            // toggle visibility of itinerary
            this.state.itineraryLayer.setVisible(this.state.pathVisible);

            if (this.state.pathVisibile) {
                flightsCard.showMap();
            }

            this.setState(this.state);

            if (this.state.pathVisible) {
                let extent = this.state.layer.getSource().getExtent();
                console.log(extent);
                map.getView().fit(extent, map.getSize());
            }
        }
    }

	/**
	 * Changes all the flights on a given page by calling the parent function
	 */
	updateFlights(flights){
		this.props.updateParentState(flights);
	}

	/**
	 * Changes the tags associated with this flight
	 */
	invokeUpdate(tags){
		this.state.tags = tags;
		this.setState(this.state);
	}

	/**
	 * Called when props are updated
	 * changes state if props have in fact changed
	 * @param oldProps the old props before the update
	 */
	componentDidUpdate(oldProps) {
		console.log("props updated");
		const newProps = this.props;
	  	if(oldProps.tags !== newProps.tags) {
			this.state.tags = this.props.tags;
			this.setState(this.state);
	  	}
	}

    render() {
        let buttonClasses = "p-1 mr-1 expand-import-button btn btn-outline-secondary";
        let lastButtonClasses = "p-1 expand-import-button btn btn-outline-secondary";
        const styleButton = { };

        let firstCellClasses = "p-1 card mr-1"
        let cellClasses = "p-1 card mr-1"

        let flightInfo = this.props.flightInfo;

        let startTime = moment(flightInfo.startDateTime);
        let endTime = moment(flightInfo.endDateTime);

        let globeClasses = "";
        let traceDisabled = false;
        let globeTooltip = "";

        let tagTooltip = "Click to tag a flight for future queries and grouping";

        //console.log(flightInfo);
        if (!flightInfo.hasCoords) {
            //console.log("flight " + flightInfo.id + " doesn't have coords!");
            globeClasses += " disabled";
            globeTooltip = "Cannot display flight on the map because the flight data did not have latitude/longitude.";
            traceDisabled = true;
        } else {
            globeTooltip = "Click the globe to display the flight on the map.";
        }

        let visitedAirports = [];
        for (let i = 0; i < flightInfo.itinerary.length; i++) {
            if ($.inArray(flightInfo.itinerary[i].airport, visitedAirports) < 0) {
                visitedAirports.push(flightInfo.itinerary[i].airport);
            }
        }

        let itineraryRow = "";
        if (this.state.itineraryVisible) {
            itineraryRow = (
                <Itinerary showMap={() => {flightsCard.showMap();}} itinerary={flightInfo.itinerary} color={this.state.color} coordinates={this.state.coordinates} nanOffset={this.state.nanOffset} parent={this} flightColorChange={this.flightColorChange}/>
            );
        }

        let eventsRow = "";
        if (this.state.eventsVisible) {
            eventsRow = (
                <Events events={this.state.events} parent={this} />
            );
        }

        let tagsRow = "";
        if (this.state.tagsVisible) {
            tagsRow = (
                    <Tags tags={this.state.tags} flightIndex={this.state.pageIndex} flightId={flightInfo.id} parent={this} />
            );
        }

        let tracesRow = "";
        if (this.state.traceNamesVisible) {
            tracesRow = 
                (
                    <TraceButtons showPlot={() => {flightsCard.showPlot();}} parentFlight={this} flightId={flightInfo.id}/>
                );
        }

        let tagPills = "";
        if(this.state.tags != null){
            tagPills = 
            this.state.tags.map((tag, index) => {
                let style = {
                    backgroundColor : tag.color,
                    marginRight : '4px',
                    lineHeight : '2',
					opacity : '75%'
                }
                return(
					<span key={index} className="badge badge-primary" style={{lineHeight : '1.5', marginRight : '4px', backgroundColor : '#e3e3e3', color : '#000000'}} title={tag.description}>
                        <span className="badge badge-pill badge-primary" style={style} page={this.state.page}>
							<i className="fa fa-tag" aria-hidden="true"></i>
						</span>   {tag.name}
					</span>
                );
            });
        }

        return (
            <div className="card mb-1">
                <div className="card-body m-0 p-0">
                    <div className="d-flex flex-row p-1">
                        <div className={firstCellClasses} style={{flexBasis:"100px", flexShrink:0, flexGrow:0}}>
                            <i className="fa fa-plane p-1"> <a href={'/protected/flight?flight_id=' + flightInfo.id}>{flightInfo.id}</a></i>
                        </div>

                        <div className={cellClasses} style={{flexBasis:"100px", flexShrink:0, flexGrow:0}}>
                            {flightInfo.tailNumber}
                        </div>

                        <div className={cellClasses} style={{flexBasis:"100px", flexShrink:0, flexGrow:0}}>
                            {flightInfo.systemId}
                        </div>


                        <div className={cellClasses} style={{flexBasis:"120px", flexShrink:0, flexGrow:0}}>

                            {flightInfo.airframeType}
                        </div>

                        <div className={cellClasses} style={{flexBasis:"200px", flexShrink:0, flexGrow:0}}>

                            {flightInfo.startDateTime}
                        </div>

                        <div className={cellClasses} style={{flexBasis:"200px", flexShrink:0, flexGrow:0}}>

                            {flightInfo.endDateTime}
                        </div>

                        <div className={cellClasses} style={{flexBasis:"80px", flexShrink:0, flexGrow:0}}>

                            {moment.utc(endTime.diff(startTime)).format("HH:mm:ss")}
                        </div>

                        <div className={cellClasses} style={{flexBasis:"200px", flexShrink:0, flexGrow:0}}>
                            {visitedAirports.join(", ")}
                        </div>

                        <div className={cellClasses} style={{
							flexGrow:1,
							//textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
						}}>

                            <div>
                                {tagPills}
                            </div>
                        </div>

                        <div className="p-0">
                            <button className={buttonClasses} data-toggle="button" aria-pressed="false" style={styleButton} onClick={() => this.exclamationClicked()}>
                                <i className="fa fa-exclamation p-1"></i>
                            </button>

                            <button className={buttonClasses} data-toggle="button" title={tagTooltip} aria-pressed="false" style={styleButton} onClick={() => this.tagClicked()}>
                                <i className="fa fa-tag p-1"></i>
                            </button>

                            <button className={buttonClasses + globeClasses} data-toggle="button" title={globeTooltip} aria-pressed="false" style={styleButton} onClick={() => this.globeClicked()}>
                                <i className="fa fa-map-o p-1"></i>
                            </button>

                            <button className={buttonClasses} style={styleButton} data-toggle="button" aria-pressed="false" onClick={() => this.plotClicked()}>
                                <i className="fa fa-area-chart p-1"></i>
                            </button>

                            <button className={buttonClasses + globeClasses} disabled={traceDisabled} style={styleButton} onClick={() => this.cesiumClicked()}>
                                <i className="fa fa-globe p-1"></i>
                            </button>

                            <button className={buttonClasses + " disabled"} style={styleButton} onClick={() => this.replayClicked()}>
                                <i className="fa fa-video-camera p-1"></i>
                            </button>

                            <button className={lastButtonClasses + globeClasses} disabled={traceDisabled} style={styleButton} onClick={() => this.downloadClicked()}>
                                <i className="fa fa-download p-1"></i>
                            </button>
                        </div>
                    </div>

                    {itineraryRow}

                    {tagsRow}

                    {eventsRow}

                    {tracesRow}
                </div>
            </div>
        );
    }
}


class FlightsCard extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mapVisible : false,
            plotVisible : false,
            filterVisible : true,
            page : 0,
            buffSize : 10,   //def size of flights to show per page is 10
            numPages : 0
        };

       this.previousPage = this.previousPage.bind(this);
       this.nextPage = this.nextPage.bind(this);
       this.repaginate = this.repaginate.bind(this);
       this.updateState = this.updateState.bind(this);
       this.filterRef = React.createRef();
    }

    setFlights(flights) {
        this.state.flights = flights;
        this.setState(this.state);
    }

	//used to update the state from a child component
	updateState(newFlights){
		this.setFlights(newFlights);
	}

    setIndex(index){
        this.state.page = index;
        this.setState(this.state);
    }

    setSize(size){
        this.state.numPages = size;
        this.setState(this.state);
    }

    mapSelectChanged(style) {
        //layers and styles from plots.js
        for (var i = 0, ii = layers.length; i < ii; ++i) {

            console.log("setting layer " + i + " to:" + (styles[i] === style));
            layers[i].setVisible(styles[i] === style);
        }   
    }

    showMap() {
        if (this.state.mapVisible) return;

        if ( !$("#map-toggle-button").hasClass("active") ) { 
            $("#map-toggle-button").addClass("active");
            $("#map-toggle-button").attr("aria-pressed", true);
        }

        this.state.mapVisible = true;
        this.setState(this.state);

        $("#plot-map-div").css("height", "50%");
        $("#map").show();

        if (this.state.plotVisible) {
            $("#map").css("width", "50%");
            map.updateSize();
            $("#plot").css("width", "50%");
            Plotly.Plots.resize("plot");
        } else {
            $("#map").css("width", "100%");
            map.updateSize();
        }

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

        if (this.state.plotVisible) {
            $("#plot").css("width", "100%");
            var update = { width : "100%" };
            Plotly.Plots.resize("plot");
        } else {
            $("#plot-map-div").css("height", "0%");
        }
    }

    toggleMap() {
        if (this.state.mapVisible) {
            this.hideMap();
        } else {
            this.showMap();
        }
    }

    showPlot() {
        if (this.state.plotVisible) return;

        if ( !$("#plot-toggle-button").hasClass("active") ) { 
            $("#plot-toggle-button").addClass("active");
            $("#plot-toggle-button").attr("aria-pressed", true);
        }

        this.state.plotVisible = true;
        this.setState(this.state);

        $("#plot").show();
        $("#plot-map-div").css("height", "50%");

        if (this.state.mapVisible) {
            $("#map").css("width", "50%");
            map.updateSize();
            $("#plot").css("width", "50%");
            Plotly.Plots.resize("plot");
        } else {
            $("#plot").css("width", "100%");
            Plotly.Plots.resize("plot");
        }
    }

    hidePlot() {
        if (!this.state.plotVisible) return;

        if ( $("#plot-toggle-button").hasClass("active") ) { 
            $("#plot-toggle-button").removeClass("active");
            $("#plot-toggle-button").attr("aria-pressed", false);
        }   

        this.state.plotVisible = false;
        this.setState(this.state);

        $("#plot").hide();

        if (this.state.mapVisible) {
            $("#map").css("width", "100%");
            map.updateSize();
        } else {
            $("#plot-map-div").css("height", "0%");
        }
    }

    togglePlot() {
        if (this.state.plotVisible) {
            this.hidePlot();
        } else {
            this.showPlot();
        }
    }

    showFilter() {
        if (this.state.filterVisible) return;

        if ( !$("#filter-toggle-button").hasClass("active") ) { 
            $("#filter-toggle-button").addClass("active");
            $("#filter-toggle-button").attr("aria-pressed", true);
        }

        this.state.filterVisible = true;
        this.setState(this.state);

        //$("#filter").show();
    }

    hideFilter() {
        if (!this.state.filterVisible) return;

        if ( $("#filter-toggle-button").hasClass("active") ) { 
            $("#filter-toggle-button").removeClass("active");
            $("#filter-toggle-button").attr("aria-pressed", false);
        }   

        this.state.filterVisible = false;
        this.setState(this.state);

        //$("#filter").hide();
    }

    toggleFilter() {
        if (this.state.filterVisible) {
            this.hideFilter();
        } else {
            this.showFilter();
        }
    }

	/**
	 * Jumps to a page in this collection of queried flights
	 * @param pg the page to jump to
	 */
    jumpPage(pg){
        if(pg < this.state.numPages && pg >= 0){
            this.state.page = pg;
            this.submitFilter();
        }
    }

	/**
	 * jumps to the next page in this collection of queried flights
	 */
    nextPage(){
        this.state.page++;
        this.submitFilter();
    }

	/**
	 * jumps to the previous page in this collection of queried flights
	 */
    previousPage(){
        this.state.page--;
        this.submitFilter();
    }

	/**
	 * Repaginates the page configuration when the numPerPage field has been changed by the user
	 */
    repaginate(pag){
        console.log("Re-Paginating");
        this.state.buffSize = pag;
        this.submitFilter();
    }

    submitFilter() {
        //console.log( this.state.filters );

        let query = this.filterRef.current.getQuery();

        console.log("Submitting filters:");
        console.log( query );


        $("#loading").show();

        var submissionData = {
            filterQuery : JSON.stringify(query),
            pageIndex : this.state.page,
            numPerPage : this.state.buffSize
        };

        console.log(submissionData);

        $.ajax({
            type: 'POST',
            url: '/protected/get_flights',
            data : submissionData,
            dataType : 'json',
            success : function(response) {

                console.log(response);

                $("#loading").hide();

                if (response.errorTitle) {
                    console.log("displaying error modal!");
                    errorModal.show(response.errorTitle, response.errorMessage);
                    return false;
                }

                console.log("got response: "+response+" "+response.size);

                //get page data
				if(response == "NO_RESULTS"){
					errorModal.show("No flights found with the given parameters!", "Please try a different query.");
				}else{
					flightsCard.setFlights(response.data);
					flightsCard.setIndex(response.index);
					flightsCard.setSize(response.sizeAll);
				}
            },
            error : function(jqXHR, textStatus, errorThrown) {
                errorModal.show("Error Loading Flights", errorThrown);
            },   
            async: true 
        });  
    }

	/**
	 * Generates an array representing all the pages in this collection of 
	 * queried flights
	 * @return an array of String objects containing page names
	 */
    genPages(){
        var page = [];
        for(var i = 0; i<this.state.numPages; i++){
            page.push({
                value : i,
                name : "Page "+(i+1)
            });
        }
        return page;
    }
	
	/**
	 * Renders the flightsCard
	 */
    render() {
        console.log("rendering flights!");

        let flights = [];
        if (typeof this.state.flights != 'undefined') {
            flights = this.state.flights;

        }

        let pages = this.genPages();

        let style = null;
        if (this.state.mapVisible || this.state.plotVisible) {
            console.log("rendering half");
            style = { 
                overflow : "scroll",
                height : "calc(50% - 56px)"
            };  
        } else {
            style = { 
                overflow : "scroll",
                height : "calc(100% - 56px)"
            };  
        }

        style.padding = "5";
        if(flights == null || flights.length > 0){
            var begin = this.state.page == 0;
            var end = this.state.page == this.state.numPages-1;
            var prev = <button className="btn btn-primary btn-sm" type="button" onClick={this.previousPage}>Previous Page</button>
            var next = <button className="btn btn-primary btn-sm" type="button" onClick={this.nextPage}>Next Page</button>

            if(begin) {
                prev = <button className="btn btn-primary btn-sm" type="button" onClick={this.previousPage} disabled>Previous Page</button>
            }
            if(end){
                next = <button className="btn btn-primary btn-sm" type="button" onClick={this.nextPage} disabled>Next Page</button>
            }


            return (
                <div className="card-body" style={style}>
                    <Filter ref={this.filterRef} hidden={!this.state.filterVisible} depth={0} baseIndex="[0-0]" key="[0-0]" parent={null} type="GROUP" submitFilter={() => {this.submitFilter()}} rules={rules} submitButtonName="Apply Filter"/>
                        <div className="card mb-1 m-1 border-secondary">
                            <div className="p-2">
                                <button className="btn btn-sm btn-info pr-2" disabled>Page: {this.state.page + 1} of {this.state.numPages}</button>
                                <div className="btn-group mr-1 pl-1" role="group" aria-label="First group">
                                    <DropdownButton  className="pr-1" id="dropdown-item-button" title={this.state.buffSize + " flights per page"} size="sm">
                                        <Dropdown.Item as="button" onClick={() => this.repaginate(10)}>10 flights per page</Dropdown.Item>
                                        <Dropdown.Item as="button" onClick={() => this.repaginate(15)}>15 flights per page</Dropdown.Item>
                                        <Dropdown.Item as="button" onClick={() => this.repaginate(25)}>25 flights per page</Dropdown.Item>
                                        <Dropdown.Item as="button" onClick={() => this.repaginate(50)}>50 flights per page</Dropdown.Item>
                                        <Dropdown.Item as="button" onClick={() => this.repaginate(100)}>100 flights per page</Dropdown.Item>
                                    </DropdownButton>
                                  <Dropdown className="pr-1">
                                    <Dropdown.Toggle variant="primary" id="dropdown-basic" size="sm">
                                        {"Page " + (this.state.page + 1)}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu  style={{ maxHeight: "256px", overflowY: 'scroll' }}>
                                            {
                                                pages.map((pages, index) => {
                                                    return (
                                                            <Dropdown.Item key={index} as="button" onClick={() => this.jumpPage(pages.value)}>{pages.name}</Dropdown.Item>
                                                    );
                                                })
                                            }
                                    </Dropdown.Menu>
                                  </Dropdown>
                                    {prev}
                                    {next}
                                </div>
                            </div>
                        </div>
						{
							flights.map((flightInfo, index) => {
								if(flightInfo != null){
									return (
										<Flight flightInfo={flightInfo} pageIndex={index}
										updateParentState={(newFlights) => this.updateState(newFlights)}
										parent={this} tags={flightInfo.tags.value} key={flightInfo.id}/>
									);
								}
							})
						}
                        <div className="card mb-1 m-1 border-secondary">
                            <div className="p-2">
                                <button className="btn btn-sm btn-info pr-2" disabled>Page: {this.state.page + 1} of {this.state.numPages}</button>
                                <div className="btn-group mr-2 pl-1" role="group" aria-label="First group">
                                    {prev}
                                    {next}
                                </div>
						</div>
                    </div>


                    <div id="load-more"></div>
                </div>
            );
        } else {
            return(
                <div className="card-body" style={style}>
                <Filter ref={this.filterRef} hidden={!this.state.filterVisible} depth={0} baseIndex="[0-0]" key="[0-0]" parent={null} type="GROUP" submitFilter={() => {this.submitFilter()}} rules={rules} submitButtonName="Apply Filter"/>
                    </div>
            );
        }
    }
}

let flightsCard = null;
//check to see if flights has been defined already. unfortunately
//the navbar includes flights.js (bad design) for the navbar buttons
//to toggle flights, etc. So this is a bit of a hack.
if (typeof flights !== 'undefined') {
    flightsCard = ReactDOM.render(
        <FlightsCard />,
        document.querySelector('#flights-card')
    );
    navbar.setFlightsCard(flightsCard);

    console.log("rendered flightsCard!");

    $(document).ready(function() {

        Plotly.newPlot('plot', [], global.plotlyLayout);

        var myPlot = document.getElementById("plot");
        console.log("myPlot:");
        console.log(myPlot);

        myPlot.on('plotly_hover', function(data){
            var xaxis = data.points[0].xaxis,
                yaxis = data.points[0].yaxis;

            /*
            var infotext = data.points.map(function(d){
                return ('width: '+xaxis.l2p(d.x)+', height: '+yaxis.l2p(d.y));
            });
            */

            //console.log("in hover!");
            //console.log(data);
            let x = data.points[0].x;

            //console.log("x: " + x);

            map.getLayers().forEach(function(layer) {
                if (layer instanceof VectorLayer) {
                    if ('flightState' in layer) {
                        //console.log("VECTOR layer:");

                        var hiddenStyle = new Style({
                            stroke: new Stroke({
                                color: layer.flightState.state.color,
                                width: 1.5
                            }),
                            image: new Circle({
                                radius: 5,
                                stroke: new Stroke({
                                    color: [0,0,0,0],
                                    width: 2
                                })
                            })
                        });

                        var visibleStyle = new Style({
                            stroke: new Stroke({
                                color: layer.flightState.state.color,
                                width: 1.5
                            }),
                            image: new Circle({
                                radius: 5,
                                stroke: new Stroke({
                                    color: layer.flightState.state.color,
                                    width: 2
                                })
                            })
                        });

                        if (layer.getVisible()) {
                            if (x < layer.flightState.state.points.length) {
                                console.log("need to draw point at: " + layer.flightState.state.points[x]);
                                layer.flightState.state.trackingPoint.setStyle(visibleStyle);
                                layer.flightState.state.trackingPoint.getGeometry().setCoordinates(layer.flightState.state.points[x]);
                            } else {
                                console.log("not drawing point x: " + x + " >= points.length: " + layer.flightState.state.points.length);
                                layer.flightState.state.trackingPoint.setStyle(hiddenStyle);
                            }
                        }
                    }
                }
            });
        });

    });
}

export { flightsCard };
