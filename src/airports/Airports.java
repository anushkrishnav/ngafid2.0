package src.airports;

import java.io.BufferedReader;
import java.io.FileReader;

import java.util.ArrayList;
import java.util.HashMap;

import src.common.MutableDouble;


public class Airports {
    public final static double AVERAGE_RADIUS_OF_EARTH_KM = 6371;

    private static HashMap<String, ArrayList<Airport>> geoHashToAirport;
    private static HashMap<String, Airport> siteNumberToAirport;

    public static final String AIRPORTS_FILE;
    public static final String RUNWAYS_FILE;

    static {
        //AIRPORTS_FILE = "/Users/travisdesell/Data/ngafid/airports/airports_parsed.csv";
        if (System.getProperty("AIRPORTS_FILE") == null) {
            System.err.println("WARNING: 'AIRPORTS_FILE' property not specified at runtime.");
            System.err.println("This can be specified with:");
            System.err.println("\tjava -DAIRPORTS_FILE=<path_to_terrain_data> ...");
            System.exit(1);
        }
        AIRPORTS_FILE = System.getProperty("AIRPORTS_FILE");

        //RUNWAYS_FILE = "/Users/travisdesell/Data/ngafid/runways/runways_parsed.csv";
        if (System.getProperty("RUNWAYS_FILE") == null) {
            System.err.println("WARNING: 'RUNWAYS_FILE' property not specified at runtime.");
            System.err.println("This can be specified with:");
            System.err.println("\tjava -DRUNWAYS_FILE=<path_to_terrain_data> ...");
            System.exit(1);
        }
        RUNWAYS_FILE = System.getProperty("RUNWAYS_FILE");

        geoHashToAirport = new HashMap<String, ArrayList<Airport>>();
        siteNumberToAirport = new HashMap<String, Airport>();

        int maxHashSize = 0;
        int numberAirports = 0;

        try {
            BufferedReader br = new BufferedReader(new FileReader(AIRPORTS_FILE));

            String line;
            while ((line = br.readLine()) != null) {
                // process the line.

                String[] values = line.split(",");
                String iataCode = values[1];
                String siteNumber = values[2];
                String type = values[3];
                double latitude = Double.parseDouble(values[4]);
                double longitude = Double.parseDouble(values[5]);

                Airport airport = new Airport(iataCode, siteNumber, type, latitude, longitude);
                String geoHash = airport.geoHash;

                //System.err.println(airport);

                ArrayList<Airport> hashedAirports = geoHashToAirport.get(airport.geoHash);
                if (hashedAirports == null) {
                    hashedAirports = new ArrayList<Airport>();
                    geoHashToAirport.put(airport.geoHash, hashedAirports);
                }
                hashedAirports.add(airport);

                if (siteNumberToAirport.get(siteNumber) != null) {
                    System.err.println("ERROR: Airport " + airport + " already existed in siteNumberToAirport hash as " + siteNumberToAirport.get(siteNumber));
                    System.exit(1);

                }
                siteNumberToAirport.put(airport.siteNumber, airport);

                if (hashedAirports.size() > maxHashSize) maxHashSize = hashedAirports.size();
                //System.err.println("hashedAirports.size() now: " + hashedAirports.size() + ", max: " + maxHashSize);
                numberAirports++;
            }

            //now read the runways file and add runways to airports
            br = new BufferedReader(new FileReader(RUNWAYS_FILE));

            while ((line = br.readLine()) != null) {
                String[] values = line.split(",");

                String id = values[0];
                String siteNumber = values[1];
                String name = values[2];

                Runway runway = null;
                if (values.length == 3) {
                    runway = new Runway(siteNumber, name);
                } else if (values.length == 7) {
                    double lat1 = Double.parseDouble(values[3]);
                    double lon1 = Double.parseDouble(values[4]);
                    double lat2 = Double.parseDouble(values[5]);
                    double lon2 = Double.parseDouble(values[6]);

                    runway = new Runway(siteNumber, name, lat1, lon1, lat2, lon2);
                } else {
                    System.err.println("ERROR: incorrect number of values in runways file: " + values.length);
                    System.err.println("line: '" + line + "'");
                    System.exit(1);
                }

                Airport airport = siteNumberToAirport.get(siteNumber);

                if (airport == null) {
                    System.err.println("ERROR: parsed runway for unknown airport, site number: " + siteNumber);
                    System.err.println("line: '" + line + "'");
                    System.exit(1);
                }

                airport.addRunway(runway);
                //System.out.println("Adding " + runway + " to " + airport);
             }
 
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }

        System.out.println("Read " + numberAirports + " airports.");
        System.out.println("airports HashMap size: " + geoHashToAirport.size());
        System.out.println("max airport ArrayList: " + maxHashSize);
    }

    public final static double calculateDistanceInKilometer(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat1 - lat2);
        double lngDistance = Math.toRadians(lon1 - lon2);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return AVERAGE_RADIUS_OF_EARTH_KM * c;
    }

    public final static double calculateDistanceInMeter(double lat1, double lon1, double lat2, double lon2) {
        return calculateDistanceInKilometer(lat1, lon1, lat2, lon2) * 1000.0;
    }

    public final static double calculateDistanceInFeet(double lat1, double lon1, double lat2, double lon2) {
        return calculateDistanceInKilometer(lat1, lon1, lat2, lon2) * 3280.84;
    }


    public static Airport getNearestAirportWithin(double latitude, double longitude, double maxDistanceFt, MutableDouble airportDistance) {
        String geoHashes[] = GeoHash.getNearbyGeoHashes(latitude, longitude);

        double minDistance = maxDistanceFt;
        Airport nearestAirport = null;

        for (int i = 0; i < geoHashes.length; i++) {
            ArrayList<Airport> hashedAirports = geoHashToAirport.get(geoHashes[i]);

            if (hashedAirports != null) {
                //System.out.println("\t" + geoHashes[i] + " resulted in " + hashedAirports.size() + " airports.");
                for (int j = 0; j < hashedAirports.size(); j++) {
                    Airport airport = hashedAirports.get(j);
                    double distanceFt = calculateDistanceInFeet(latitude, longitude, airport.latitude, airport.longitude);
                    //System.out.println("\t\t" + airport + ", distanceFt: " + distanceFt);

                    if (distanceFt < minDistance) {
                        nearestAirport = airport;
                        minDistance = distanceFt;
                        airportDistance.set(minDistance);
                    }
                }
            }
        }

        /*
        if (nearestAirport != null) {
            System.out.println("nearest airport: " + nearestAirport + ", " + minDistance);
        } else {
            System.out.println("nearest airport: NULL");
        }
        */


        return nearestAirport;
    }
}