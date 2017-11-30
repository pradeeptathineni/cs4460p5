var mousePosition;
var offset = [0,0];
var div;
var isDown = false;

$( "#years-slider" ).slider({
    range: true,
    min: 1995,
    max: 2016,
    step: 1,
    values: [1995, 2016],
    slide: function( event, ui ) {
        console.log(ui);
    }
});

var geo = d3.select("svg#geo-area");
var details = d3.select("svg#details-area");
var svgWidth = geo.attr("width");
var svgHeight = geo.attr("height");

var margin = {top: 0, right: 0, bottom: 0, left: 0};
var geoWidth = svgWidth - margin.left - margin.right;
var geoHeight = svgHeight - margin.top - margin.bottom;

var fullScale = svgWidth / 2 / Math.PI;

d3.queue()
    .defer(d3.json, "./data/countries.topojson")
    .defer(d3.csv, "./data/airport_codes.csv", function(row) {
        row["Coords"] = [+row["Longitude"], +row["Latitude"]];
        return row;
    }).defer(d3.csv, "./data/aircraft_incidents.csv", function(row) {
        row["Total_Fatal_Injuries"] = +row["Total_Fatal_Injuries"];
        row["Total_Serious_Injuries"] = +row["Total_Serious_Injuries"];
        row["Total_Uninjured"] = +row["Total_Uninjured"];
        return row;
    }).await(ready);

function ready(error, mapData, portData, planeData) {
    if (error) {
        console.error("Error while queuing data.");
        console.error(error);
        return;
    }
    planeData.forEach(function(d, i) {
        if (d.Latitude == "" && d.Airport_Code == "") {
            planeData.splice(i, 1);
        }
    });
    console.log(planeData);

    var airports = {};
    portData.forEach(function(d) {
        airports[d["Airport_Code"]] = d["Coords"];
    });

    var countries = topojson.feature(mapData, mapData.objects.countries).features;

    var projection = d3.geoMercator()
        .translate([svgWidth / 2, svgHeight / 2])
        .scale(fullScale);

    geo.call(d3.zoom().on("zoom", function() {console.log("hi");}));

    var path = d3.geoPath()
        .projection(projection);

    var countries = geo.selectAll(".country")
        .data(countries)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path);

    var dots = geo.selectAll(".incident-dot")
        .data(planeData)
        .enter().append("circle")
        .attr("class", "incident-dot")
        .attr("r", 3)
        .attr("cx", function(d) {
            if (d.Longitude != "" && d.Latitude != "") {
                coords = projection([d.Longitude, d.Latitude]);
            } else {
                coords = projection([d.Longitude, d.Latitude]);
            }
            return coords[0];
        }).attr("cy", function(d) {
            if (d.Longitude != "" && d.Latitude != "") {
                coords = projection([d.Longitude, d.Latitude]);
            } else {
                coords = projection([d.Longitude, d.Latitude]);
            }
            return coords[1];
        }).on("mouseover", incidentMouseover)
        .on("mouseout", incidentMouseout)
        .on("click", incidentClick);

}

function incidentMouseover(d, i) {

}

function incidentMouseout(d, i) {

}

function incidentClick(d, i) {
    $(".incident-dot").removeClass("active-dot");
    $(this).addClass("active-dot");
    details.selectAll("text").remove();
    var y = 25;
    details.append("text")
        .attr("x", 15)
        .attr("y", y)
        .text("Accident Number: " + d.Accident_Number);
    details.append("text")
        .attr("x", 15)
        .attr("y", 2*y)
        .text("Event Date: " + d.Event_Date);
    details.append("text")
        .attr("x", 15)
        .attr("y", 3*y)
        .text("Location: " + d.Location);
    details.append("text")
        .attr("x", 15)
        .attr("y", 4*y)
        .text("Country: " + d.Country);
    details.append("text")
        .attr("x", 15)
        .attr("y", 5*y)
        .text("Latitude: " + d.Latitude);
    details.append("text")
        .attr("x", 15)
        .attr("y", 6*y)
        .text("Longitude: " + d.Longitude);
    details.append("text")
        .attr("x", 15)
        .attr("y", 7*y)
        .text("Airport Code: " + d.Airport_Code);
    details.append("text")
        .attr("x", 15)
        .attr("y", 8*y)
        .text("Airport Name: " + d.Airport_Name);
    details.append("text")
        .attr("x", 15)
        .attr("y", 9*y)
        .attr("fill", "red")
        .text("Injury Severity: " + d.Injury_Severity);
    details.append("text")
        .attr("x", 15)
        .attr("y", 10*y)
        .attr("fill", "red")
        .text("Aircraft Damage: " + d.Aircraft_Damage);
    details.append("text")
        .attr("x", 15)
        .attr("y", 11*y)
        .attr("fill", "red")
        .text("Make: " + d.Make);
    details.append("text")
        .attr("x", 15)
        .attr("y", 12*y)
        .attr("fill", "red")
        .text("Model: " + d.Model);
    details.append("text")
        .attr("x", 15)
        .attr("y", 13*y)
        .attr("fill", "red")
        .text("Air_Carrier: " + d.Air_Carrier);
    details.append("text")
        .attr("x", 15)
        .attr("y", 14*y)
        .attr("fill", "red")
        .text("Total Fatal Injuries: " + d.Total_Fatal_Injuries);
    details.append("text")
        .attr("x", 15)
        .attr("y", 15*y)
        .attr("fill", "red")
        .text("Total Serious Injuries: " + d.Total_Serious_Injuries);
    details.append("text")
        .attr("x", 15)
        .attr("y", 16*y)
        .attr("fill", "red")
        .text("Total Uninjured: " + d.Total_Uninjured);
    details.append("text")
        .attr("x", 15)
        .attr("y", 17*y)
        .text("Schedule: " + d.Schedule);
    details.append("text")
        .attr("x", 15)
        .attr("y", 18*y)
        .text("Weather Condition: " + d.Weather_Condition);
    details.append("text")
        .attr("x", 15)
        .attr("y", 19*y)
        .text("Broad Phase of Flight: " + d.Broad_Phase_of_Flight);
    details.selectAll("text")
        .attr("class", "info-line");
}

function updateYear(year) {

}
