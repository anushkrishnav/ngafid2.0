package org.ngafid.flights;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;

import java.nio.charset.StandardCharsets;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.HashMap;

import javax.xml.bind.DatatypeConverter;

import org.ngafid.common.MutableDouble;
import org.ngafid.airports.Airport;
import org.ngafid.airports.Airports;
import org.ngafid.airports.Runway;
import org.ngafid.terrain.TerrainCache;


public class Flight {
    final static double MAX_AIRPORT_DISTANCE_FT = 10000;
    final static double MAX_RUNWAY_DISTANCE_FT = 100;

    private String filename;
    private String airframeType;
    private String md5Hash;

    private int numberRows;
    private String fileInformation;
    private ArrayList<String> dataTypes;
    private ArrayList<String> headers;

    private HashMap<String, DoubleTimeSeries> doubleTimeSeries = new HashMap<String, DoubleTimeSeries>();
    private HashMap<String, StringTimeSeries> stringTimeSeries = new HashMap<String, StringTimeSeries>();

    public int getNumberRows() {
        return numberRows;
    }

    private void setMD5Hash(InputStream inputStream) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(inputStream.readAllBytes());
            md5Hash = DatatypeConverter.printHexBinary(hash).toLowerCase();

        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            System.exit(1);
        } catch (IOException e) {
            e.printStackTrace();
            System.exit(1);
        }

        System.err.println("MD5 HASH: '" + md5Hash + "'");
    }

    private void initialize(InputStream inputStream) throws MalformedFlightFileException {
        numberRows = 0;
        ArrayList<ArrayList<String>> csvValues;

        try {
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));

            dataTypes = new ArrayList<String>();
            headers = new ArrayList<String>();

            //file information -- this is the first line
            fileInformation = bufferedReader.readLine();
            if (fileInformation.charAt(0) != '#') throw new MalformedFlightFileException("First line of the flight file should begin with a '#' and contain flight recorder information.");

            String[] infoParts = fileInformation.split(",");
            airframeType = null;
            try {
                for (int i = 1; i < infoParts.length; i++) {
                    //System.err.println("splitting key/value: '" + infoParts[i] + "'");
                    String subParts[] = infoParts[i].trim().split("=");
                    String key = subParts[0];
                    String value = subParts[1];

                    //System.err.println("key: '" + key + "'");
                    //System.err.println("value: '" + value + "'");

                    if (key.equals("airframe_name")) {
                        airframeType = value.substring(1, value.length() - 1);
                        break;
                    }
                }
            } catch (Exception e) {
                throw new MalformedFlightFileException("Flight information line was not properly formed with key value pairs.", e);
            }

            if (airframeType == null)  throw new MalformedFlightFileException("Flight information (first line of flight file) does not contain an 'airframe_name' key/value pair.");
            System.err.println("detected airframe type: '" + airframeType);


            //the next line is the column data types
            String dataTypesLine = bufferedReader.readLine();
            if (dataTypesLine.charAt(0) != '#') throw new MalformedFlightFileException("Second line of the flight file should begin with a '#' and contain column data types.");
            dataTypesLine = dataTypesLine.substring(1);

            dataTypes.addAll( Arrays.asList( dataTypesLine.split("\\,", -1) ) );
            dataTypes.replaceAll(String::trim);

            //the next line is the column headers
            String headersLine = bufferedReader.readLine();
            headers.addAll( Arrays.asList( headersLine.split("\\,", -1) ) );
            headers.replaceAll(String::trim);

            if (dataTypes.size() != headers.size()) {
                System.err.println("ERROR: number of columns in the header line (" + headers.size() + ") != number of columns in the dataTypes line (" + dataTypes.size() + ")");
                System.exit(1);
            }

            //initialize a sub-ArrayList for each column
            csvValues = new ArrayList<ArrayList<String>>();
            for (int i = 0; i < headers.size(); i++) {
                csvValues.add(new ArrayList<String>());
            }

            int lineNumber = 3;
            boolean lastLineWarning = false;

            String line;
            while ((line = bufferedReader.readLine()) != null) {
                //if the line is empty, skip it
                if (line.trim().length() == 0) continue;
                //this line is a comment, skip it
                if (line.charAt(0) == '#') continue;

                //split up the values by commas into our array of strings
                String[] values = line.split("\\,", -1);

                if (lastLineWarning) {
                    if (values.length != headers.size()) {
                        System.err.println("ERROR: line " + lineNumber + " had a different number of values (" + values.length + ") than the number of columns in the file (" + headers.size() + ").");
                        System.err.println("ERROR: Two line errors in a row means the flight file is corrupt.");
                        lastLineWarning = true;
                    } else {
                        System.err.println("ERROR: A line in the middle of the flight file was missing values, which means the flight file is corrupt.");
                        System.exit(1);
                    }
                } else {
                    if (values.length != headers.size()) {
                        System.err.println("WARNING: line " + lineNumber + " had a different number of values (" + values.length + ") than the number of columns in the file. Not an error if it was the last line in the file.");
                        lastLineWarning = true;
                        continue;
                    }
                }

                //for each CSV value
                for (int i = 0; i < values.length; i++) {
                    //add this to the respective column in the csvValues ArrayList, trimming the whitespace around it
                    csvValues.get(i).add( values[i].trim() );
                }

                lineNumber++;
                numberRows++;
            }

            if (lastLineWarning) {
                System.err.println("WARNING: last line of the file was cut short and ignored.");
            }

            for (int i = 0; i < csvValues.size(); i++) {
                //check to see if each column is a column of doubles or a column of strings

                //for each column, find the first non empty value and check to see if it is a double
                boolean isDoubleList = false;
                ArrayList<String> current = csvValues.get(i);

                for (int j = 0; j < current.size(); j++) {
                    String currentValue = current.get(j);
                    if (currentValue.length() > 0) {
                        try {
                            Double.parseDouble(currentValue);
                            isDoubleList = true;
                        } catch (NumberFormatException e) {
                            isDoubleList = false;
                            break;
                        }
                    }
                }

                if (isDoubleList) {
                    //System.out.println(headers.get(i) + " is a DOUBLE column, ArrayList size: " + current.size());
                    DoubleTimeSeries dts = new DoubleTimeSeries(headers.get(i), current);
                    if (dts.validCount() > 0) {
                        doubleTimeSeries.put(headers.get(i), dts);
                    } else {
                        System.err.println("WARNING: dropping double column '" + headers.get(i) + "' because all entries were empty.");
                    }

                } else {
                    //System.out.println(headers.get(i) + " is a STRING column, ArrayList size: " + current.size());
                    StringTimeSeries sts = new StringTimeSeries(headers.get(i), current);
                    if (sts.validCount() > 0) {
                        stringTimeSeries.put(headers.get(i), sts);
                    } else {
                        System.err.println("WARNING: dropping string column '" + headers.get(i) + "' because all entries were empty.");
                    }
                }
            }


        } catch (IOException ioException) {
            System.err.println("IOException while reading file: '" + filename + "'");
            ioException.printStackTrace();
            System.exit(1);
        }
    }

    private InputStream getReusableInputStream(InputStream inputStream) {
        try {
            if (inputStream.markSupported() == false) {
                InputStream reusableInputStream = new ByteArrayInputStream(inputStream.readAllBytes());
                inputStream.close();
                // now the stream should support 'mark' and 'reset'
                return reusableInputStream;
            } else {
                return inputStream;
            }
        } catch (IOException e) {
            e.printStackTrace();
            System.exit(1);
        }
        return null;
    }

    public Flight(String zipEntryName, InputStream inputStream) throws MalformedFlightFileException {
        this.filename = zipEntryName;
        
        inputStream = getReusableInputStream(inputStream);

        try {
            int length = inputStream.available();
            inputStream.mark(length);
            setMD5Hash(inputStream);

            inputStream.reset();
            initialize(inputStream);
        } catch (IOException e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    public Flight(String filename) throws MalformedFlightFileException {
        this.filename = filename;

        try {
            File file = new File(this.filename);
            FileInputStream fileInputStream = new FileInputStream(file);

            InputStream inputStream = getReusableInputStream(fileInputStream);

            int length = inputStream.available();
            inputStream.mark(length);
            setMD5Hash(inputStream);

            inputStream.reset();
            initialize(inputStream);
        } catch (FileNotFoundException e) {
            System.err.println("ERROR: could not find flight file '" + filename + "'");
            e.printStackTrace();
            System.exit(1);
        } catch (IOException e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    public void calculateAGL(String altitudeAGLColumnName, String altitudeMSLColumnName, String latitudeColumnName, String longitudeColumnName) {
        //calculates altitudeAGL (above ground level) from altitudeMSL (mean sea levl)
        headers.add(altitudeAGLColumnName);
        dataTypes.add("ft agl");
        
        DoubleTimeSeries altitudeAGLTS = new DoubleTimeSeries(altitudeAGLColumnName);
        doubleTimeSeries.put(altitudeAGLColumnName, altitudeAGLTS);

        DoubleTimeSeries altitudeMSLTS = doubleTimeSeries.get(altitudeMSLColumnName);
        DoubleTimeSeries latitudeTS = doubleTimeSeries.get(latitudeColumnName);
        DoubleTimeSeries longitudeTS = doubleTimeSeries.get(longitudeColumnName);

        for (int i = 0; i < altitudeMSLTS.size(); i++) {
            double altitudeMSL = altitudeMSLTS.get(i);
            double latitude = latitudeTS.get(i);
            double longitude = longitudeTS.get(i);

            System.err.println("getting AGL for latitude: " + latitude + ", " + longitude);

            if (Double.isNaN(altitudeMSL) || Double.isNaN(latitude) || Double.isNaN(longitude)) {
                altitudeAGLTS.add(Double.NaN);
                System.err.println("result is: " + Double.NaN);
                continue;
            }

            int altitudeAGL = TerrainCache.getAltitudeFt(altitudeMSL, latitude, longitude);

            altitudeAGLTS.add(altitudeAGL);

            //System.out.println("msl: " + altitudeMSL + ", agl: " + altitudeAGL);
        }
    }

    public void calculateAirportProximity(String latitudeColumnName, String longitudeColumnName) {
        //calculates if the aircraft is within maxAirportDistance from an airport
        headers.add("NearestAirport");
        dataTypes.add("IATA Code");

        headers.add("AirportDistance");
        dataTypes.add("ft");

        headers.add("NearestRunway");
        dataTypes.add("IATA Code");

        headers.add("RunwayDistance");
        dataTypes.add("ft");

        StringTimeSeries nearestAirportTS = new StringTimeSeries("NearestAirport");
        stringTimeSeries.put("NearestAirport", nearestAirportTS);
        DoubleTimeSeries airportDistanceTS = new DoubleTimeSeries("AirportDistance");
        doubleTimeSeries.put("AirportDistance", airportDistanceTS);

        StringTimeSeries nearestRunwayTS = new StringTimeSeries("NearestRunway");
        stringTimeSeries.put("NearestRunway", nearestRunwayTS);
        DoubleTimeSeries runwayDistanceTS = new DoubleTimeSeries("RunwayDistance");
        doubleTimeSeries.put("RunwayDistance", runwayDistanceTS);

        DoubleTimeSeries latitudeTS = doubleTimeSeries.get(latitudeColumnName);
        DoubleTimeSeries longitudeTS = doubleTimeSeries.get(longitudeColumnName);

        for (int i = 0; i < latitudeTS.size(); i++) {
            double latitude = latitudeTS.get(i);
            double longitude = longitudeTS.get(i);

            MutableDouble airportDistance = new MutableDouble();
            Airport airport = Airports.getNearestAirportWithin(latitude, longitude, MAX_AIRPORT_DISTANCE_FT, airportDistance);
            if (airport == null) {
                nearestAirportTS.add(null);
                airportDistanceTS.add(Double.NaN);
                nearestRunwayTS.add(null);
                runwayDistanceTS.add(Double.NaN);

                //System.out.println(latitude + ", " + longitude + ", null, null, null, null");
            } else {
                nearestAirportTS.add(airport.iataCode);
                airportDistanceTS.add(airportDistance.get());

                MutableDouble runwayDistance = new MutableDouble();
                Runway runway = airport.getNearestRunwayWithin(latitude, longitude, MAX_RUNWAY_DISTANCE_FT, runwayDistance);
                if (runway == null) {
                    nearestRunwayTS.add(null);
                    runwayDistanceTS.add(Double.NaN);
                    //System.out.println(latitude + ", " + longitude + ", " + airport.iataCode + ", " + airportDistance.get() + ", " + null + ", " + null);
                } else {
                    nearestRunwayTS.add(runway.name);
                    runwayDistanceTS.add(runwayDistance.get());
                    //System.out.println(latitude + ", " + longitude + ", " + airport.iataCode + ", " + airportDistance.get() + ", " + runway.name + ", " + runwayDistance.get());
                }
            }

        }
    }


    public void printValues(String[] requestedHeaders) {
        System.out.println("Values:");

        for (int i = 0; i < requestedHeaders.length; i++) {
            if (i > 0) System.out.print(",");
            System.out.printf("%16s", requestedHeaders[i]);
        }
        System.out.println();

        for (int i = 0; i < requestedHeaders.length; i++) {
            String header = requestedHeaders[i];
            if (i > 0) System.out.print(",");

            if (doubleTimeSeries.containsKey(header)) {
                System.out.printf("%16s", doubleTimeSeries.get(header).size());
            } else if (stringTimeSeries.containsKey(header)) {
                System.out.printf("%16s", stringTimeSeries.get(header).size());
            } else {
                System.out.println("ERROR: header '" + header + "' not present in flight file: '" + filename + "'");
                System.exit(1);
            }
        }
        System.out.println();

        for (int row = 0; row < numberRows; row++) {
            boolean first = true;
            for (int i = 0; i < requestedHeaders.length; i++) {
                String header = requestedHeaders[i];

                if (!first) System.out.print(",");
                first = false;

                if (doubleTimeSeries.containsKey(header)) {
                    System.out.printf("%16.8f", doubleTimeSeries.get(header).get(row));
                } else if (stringTimeSeries.containsKey(header)) {
                    System.out.printf("%16s", stringTimeSeries.get(header).get(row));
                } else {
                    System.out.println("ERROR: header '" + header + "' not present in flight file: '" + filename + "'");
                    System.exit(1);
                }
            }
            System.out.println();
        }
        System.out.println();
    }


    public void calculateEvents() {
    }

    public void updateDatabase(Connection connection, int fleetId, int uploaderId, int zipId) {
        try {
            PreparedStatement preparedStatement = connection.prepareStatement("INSERT INTO flights (fleet_id, uploader_id, zip_id, airframe_type, filename, md5_hash, number_rows) VALUES (?, ?, ?, ?, ?, ?, ?");
            preparedStatement.setInt(1, fleetId);
            preparedStatement.setInt(2, uploaderId);
            preparedStatement.setInt(3, zipId);
            preparedStatement.setString(4, airframeType);
            preparedStatement.setString(5, filename);
            preparedStatement.setString(6, md5Hash);
            preparedStatement.setInt(7, numberRows);

            System.out.println(preparedStatement);

            int flightId = -1; // get result id from mysql statement

            for (DoubleTimeSeries series : doubleTimeSeries.values()) {
                series.updateDatabase(connection, flightId);
            }

            for (StringTimeSeries series : stringTimeSeries.values()) {
                series.updateDatabase(connection, flightId);
            }

        } catch (SQLException e) {
            e.printStackTrace();
            System.exit(1);
        }

    }

}
