import 'bootstrap';

import React, { Component } from "react";
import ReactDOM from "react-dom";

import { errorModal } from "./error_modal.js";
import SignedInNavbar from "./signed_in_navbar.js";


var navbar = ReactDOM.render(
    <SignedInNavbar activePage="account" waitingUserCount={waitingUserCount} fleetManager={fleetManager} unconfirmedTailsCount={unconfirmedTailsCount} modifyTailsAccess={modifyTailsAccess} plotMapHidden={plotMapHidden}/>,
    document.querySelector('#navbar')
);

class SystemIdsCard extends React.Component {
    constructor(props) {
        super(props);

        systemIds.forEach(systemId => {
            if (systemId.confirmed === true) {
                systemId.modified = false;
            } else {
                systemId.modified = true;
            }
            systemId.originalTail = systemId.tail;
        });

        this.state = {
            systemIds : systemIds
        };
    }

    validateTail(systemId) {
        console.log("original tail: '" + systemId.originalTail + "', current value: '" + systemId.tail + "'");

        let newTail = $("#" + systemId.systemId + "-tail-number-form").val();

        if (systemId.confirmed === 1) {
            if (newTail === "") {
                systemId.modified = false;
            } else if (systemId.originalTail !== newTail) {
                systemId.modified = true;
            } else {
                systemId.modified = false;
            }
        } else {
            systemId.modified = true;
        }
        systemId.tail = newTail;

        console.log(systemId);
        this.setState(this.state);
    }

    updateSystemId(systemId) {
        let newTail = $("#" + systemId.systemId + "-tail-number-form").val();
        console.log("updating system id on server -- original tail: '" + systemId.originalTail + "', current value: '" + systemId.tail + "', newTail: '" + newTail + "'");
        if (systemId.tail === "") systemId.tail = systemId.originalTail;

        var submissionData = {
            systemId : systemId.systemId,
            tail : systemId.tail
        };

        let systemIdCard = this;

        $.ajax({
            type: 'POST',
            url: '/protected/update_tail',
            data : submissionData,
            dataType : 'json',
            success : function(response) {
                console.log("received response: ");
                console.log(response);

                systemId.confirmed = true;
                systemId.modified = false;

                systemIdCard.setState(systemIdCard.state);

                navbar.state.unconfirmedTailsCount--;
                navbar.setState(navbar.state);
            },   
            error : function(jqXHR, textStatus, errorThrown) {
                errorModal.show("Error Updating Tail Number", errorThrown);
            },   
            async: true 
        });  
    }

    getSystemIdCard(name, type) {
        return (
            <div style={{marginTop:"4", padding:"0 0 0 0"}}>
                <div className="col-sm-12" style={{padding:"0 0 0 0"}}>
                    <div className="card mb-1 m-1" style={{background : "rgba(248,259,250,0.8)"}}>
                        <h5 className="card-header">
                            {name}
                        </h5>

                        <div className="card-body">
                            <div className="form-row align-items-center justify-content-center">
                                <div className="col-sm-5 my-1" style={{margin:"0"}}>
                                    <label style={{marginBottom:"0"}}>System Id</label>
                                </div>
                                <div className="col-sm-6 my-1" style={{margin:"0"}}>
                                    <label style={{marginBottom:"0"}}>Tail Number</label>
                                </div>
                                <div className="col-sm-1 my-1" style={{margin:"0"}}>
                                    <label style={{marginBottom:"0"}}>Submit </label>
                                </div>
                            </div>

                            <hr style={{padding:"0", margin:"0 0 5 0"}}></hr>

                            {
                                systemIds.map((systemId, systemIdIndex) => {
                                    if (systemId.confirmed == type) {
                                        return (
                                            <form key={systemIdIndex} style={{marginBottom:"0px"}}>
                                                <div className="form-row align-items-center justify-content-center">
                                                    <div className="col-sm-5 my-1">
                                                        <label className="sr-only" htmlFor={systemId.systemId + "-system-id-form"}>Name</label>
                                                        <input type="text" className="form-control" id={systemId.systemId + "-system-id-form"} placeholder={systemId.systemId} readOnly></input>
                                                    </div>
                                                    <div className="col-sm-6 my-1">
                                                        <label className="sr-only" htmlFor={systemId.systemId + "-tail-number-form"}>Tail Number</label>
                                                        <input type="text" className="form-control" id={systemId.systemId + "-tail-number-form"} placeholder={systemId.originalTail} onChange={() => this.validateTail(systemId)}></input>
                                                    </div>
                                                    <div className="col-sm-1 my-1">
                                                        <button type="button" className={"btn " + (systemId.modified ? "btn-outline-primary" : "btn-outline-secondary")} style={{height:"36", padding:"3 8 3 8", marginRight:"5"}} disabled={!systemId.modified} onClick={() => {this.updateSystemId(systemId)}}>
                                                            <i className='fa fa-check'></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        );
                                    } else {
                                        return ("");
                                    }
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>
        );

    }

    render() {
        //console.log(systemIds);

        let unconfirmedHtml = this.getSystemIdCard("Unconfirmed System Ids", false);
        let confirmedHtml = this.getSystemIdCard("Confirmed System Ids", true);

        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-lg-6" style={{paddingRight:"0"}}>
                        {unconfirmedHtml}
                    </div>
                    <div className="col-lg-6" style={{paddingLeft:"0"}}>
                        {confirmedHtml}
                    </div>
                </div>
            </div>
        );
    }
}

var profileCard = ReactDOM.render(
    <SystemIdsCard />,
    document.querySelector('#system-ids-card')
);