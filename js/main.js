// // Creates a bootstrap-slider element

// console.log("hello world");
$("#yearSlider").slider({
    tooltip: "always",
    tooltip_position: "bottom"
});

$("#yearSlider").on("change", function(event, value){
    // Update the chart on the new value
    // updateYear(event.value.newValue);
    //console.log(event.value.newValue[0],event.value.newValue[1]);
    updateYear(event.value.newValue[0],event.value.newValue[1])
});

var svg = d3.select("svg#chart-area");
var details = d3.select("svg#details");
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
        })
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);
    // 
    //console.log(abc);
    updateYear(1995, 2016);


}

function handleMouseOver(d, i) {
    details.attr("id", "#t" + d.Accident_Number).append("rect").attr("x", 0).attr("y", 0).attr("width", 300)
    .attr("height", 500).style("fill", "#E9E9E9").attr("rx", 15).attr("ry", 15);

    details.append("text").attr("x", 10).attr("y", 26).text("Detailed Information")
        .style("text-decoration", "underline").style("font-size", "24px");//attr("font-weight", "bold");
    var hText = 15;
    details.append("text").attr("x", 10).attr("y", 3*hText).text("Accident Num: " + d.Accident_Number);
    details.append("text").attr("x", 10).attr("y", 4*hText).text("Country: " + d.Country);
    details.append("text").attr("x", 10).attr("y", 5*hText).text("Location: " + d.Location);
    details.append("text").attr("x", 10).attr("y", 6*hText).text("Airport Name: " + d.Airport_Name);
    details.append("text").attr("x", 10).attr("y", 7*hText).text("Date: " + d.Event_Date.toString());
    details.append("text").attr("x", 10).attr("y", 8*hText).text("Make: " + d.Make);
    details.append("text").attr("x", 10).attr("y", 9*hText).text("Model: " + d.Model);
    details.append("text").attr("x", 10).attr("y", 10*hText).text("Carrier: " + d.Air_Carrier);
    if (d.Broad_Phase_of_Flight == ""){
            details.append("text").attr("x", 11).attr("y", 11*hText).text("Phase of Flight: NOPE" + d.Broad_Phase_of_Flight);        
    } else {
            details.append("text").attr("x", 11).attr("y", 11*hText).text("Phase of Flight: " + d.Broad_Phase_of_Flight);
    }



    //pics of plane and weather
    //pie chart?
    
    //console.log(d);
    //note Currently it does not remove the element when you move the mouse away     
}
function handleMouseOut(d, i) {
    details.selectAll("*").remove();
    // d3.select("#t"+d.Accident_Number).remove();
}
function updateYear(year1, year2) {
    //svg.selectAll("circle").remove();
    svg.selectAll("circle").filter(function(d){
        var parse = d3.timeParse("%m/%d/%y")(d.Event_Date);
        var a = parse.getFullYear();
        if (year1 <= a && a <= year2) {
            return true;
        }
    })
    .attr("fill-opacity", 1);

    svg.selectAll("circle").filter(function(d){
        var parse = d3.timeParse("%m/%d/%y")(d.Event_Date);
        var a = parse.getFullYear();
        if (!(year1 <= a && a <= year2)) {
            return true;
        }
    })
    .attr("fill-opacity", .3);
}
