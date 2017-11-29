// // Creates a bootstrap-slider element

// console.log("hello world");

$("#yearSlider").slider({
    tooltip: "always",
    tooltip_position: "bottom"
});

$("#yearSlider").on("change", function(event){
    // Update the chart on the new value
    // updateYear(event.value.newValue);
    console.log("hi");
});

var svg = d3.select("svg#chart-area");
var svgWidth = svg.attr("width");
var svgHeight = svg.attr("height");

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
        row["Latitude"] = +row["Latitude"];
        row["Longitude"] = +row["Longitude"];
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

    var airports = {};

    portData.forEach(function(d) {
        airports[d["Airport_Code"]] = d["Coords"];
    });

    var countries = topojson.feature(mapData, mapData.objects.countries).features;

    var projection = d3.geoMercator()
        .translate([svgWidth / 2, svgHeight / 2])
        .scale(fullScale);

    var path = d3.geoPath()
        .projection(projection);

    svg.selectAll(".country")
        .data(countries)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path);

    svg.selectAll(".incident-dot")
        .data(planeData)
        .enter().append("circle")
        .attr("class", "incident-dot")
        .attr("r", 2)
        .attr("cx", function(d) {
            if (d.Longitude && d.Latitude) {
                coords = projection([d.Longitude, d.Latitude]);
            } else if (d.Airport_Code) {
                try {
                    var port = airports[d.Airport_Code];
                    coords = projection([port[0], port[1]]);
                } catch (e) {
                    coords = projection([d.Longitude, d.Latitude]);
                }
            } else {
                coords = projection([d.Longitude, d.Latitude]);
            }
            return coords[0];
        }).attr("cy", function(d) {
            if (d.Longitude && d.Latitude) {
                coords = projection([d.Longitude, d.Latitude]);
            } else if (d.Airport_Code) {
                try {
                    var port = airports[d.Airport_Code];
                    coords = projection([port[0], port[1]]);
                } catch (e) {
                    coords = projection([d.Longitude, d.Latitude]);
                }
            } else {
                coords = projection([d.Longitude, d.Latitude]);
            }
            return coords[1];
        });
}

function updateYear(year) {

}
