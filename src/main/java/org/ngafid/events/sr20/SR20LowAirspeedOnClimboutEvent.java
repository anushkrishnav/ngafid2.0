package org.ngafid.events;

import java.util.ArrayList;

import org.ngafid.events.Event;

//Condition: Low Airspeed on Climbout: indicated_airspeed < 52 AND vertical_airspeed > 0 AND (radio_altitude_derived BETWEEN 100 AND 500)
public class SR20LowAirspeedOnClimboutEvent extends Event {

    private static final int sr20IndicatedAirspeedColumn = 10;
    private static final int sr20VerticalAirspeedColumn = 12;
    private static final int sr20RadioAltitudeColumn = 6;
    private static final double sr20AirspeedLimit = 52;
    private static final double sr20VertialAirspeedLimit = 0;
    private static final double sr20RadioAltitudeDerivedLowLimit = 100;
    private static final double sr20RadioAltitudeDerivedHighLimit = 500;

    public SR20LowAirspeedOnClimboutEvent(String startTime, String endTime, int startLine, int endLine) {
        super(startTime, endTime, startLine, endLine, 5);
    }

    public static boolean isOccuring(ArrayList<String> lineValues) {
        double sr20IndicatedAirspeed = Double.parseDouble(lineValues.get(sr20IndicatedAirspeedColumn));
        double sr20VerticalAirspeed = Double.parseDouble(lineValues.get(sr20VerticalAirspeedColumn));
        double sr20RadioAltitude = Double.parseDouble(lineValues.get(sr20RadioAltitudeColumn));

        if ((sr20IndicatedAirspeed < sr20AirspeedLimit & sr20VerticalAirspeed > sr20VertialAirspeedLimit) && (sr20RadioAltitude < sr20RadioAltitudeDerivedLowLimit & sr20RadioAltitude > sr20RadioAltitudeDerivedHighLimit)) {
            return true;
        } else {
            return false;
        }
    }

    public String toString() {
        return "LOW AIR SPEED ON APPROACH EVENT " + super.toString();
    }
}