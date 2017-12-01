var geo = d3.select("svg#geo-area");
var details = d3.select("svg#details-area");
var svgWidth = geo.attr("width");
var svgHeight = geo.attr("height");

var margin = {top: 0, right: 0, bottom: 0, left: 0};
var geoWidth = svgWidth - margin.left - margin.right;
var geoHeight = svgHeight - margin.top - margin.bottom;

var fullScale = svgWidth / 2 / Math.PI;

var airports_IATA = {};
var airports_ICAO = {};

var maxZoom = 20;
var maxRadius = 4;
var minStrokeWidth = 0.05;

$("#years-slider").slider({
    tooltip: "always",
    tooltip_position: "bottom",

});

$("#years-slider").on("change", function(event, value){
    updateYear(event.value.newValue[0],event.value.newValue[1])
});

d3.queue()
    .defer(d3.json, "./data/countries.topojson")
    .defer(d3.csv, "./data/airports.csv", function(row) {
        row["Coords"] = [+row["Longitude"], +row["Latitude"]];
        return row;
    }).defer(d3.csv, "./data/aircraft_incidents.csv", function(row) {
        row["Total_Fatal_Injuries"] = +row["Total_Fatal_Injuries"];
        row["Total_Serious_Injuries"] = +row["Total_Serious_Injuries"];
        row["Total_Uninjured"] = +row["Total_Uninjured"];
        var parse = d3.timeParse("%m/%d/%y")(row.Event_Date);
        var a = parse.getFullYear();
        row["Year"] = a;
        return row;
    }).await(ready);

function ready(error, mapData, portData, planeData) {
    if (error) {
        console.error("Error while queuing data.");
        console.error(error);
        return;
    }

    portData.forEach(function(d) {
        airports_IATA[d["IATA_Code"]] = d["Coords"];
        airports_ICAO[d["ICAO_Code"]] = d["Coords"];
    });

    planeData = planeData.filter(function(d) {
        if ((d.Longitude != "" && d.Latitude != "") || d.Airport_Code != "") {
            return d;
        }
    });

    var countries = topojson.feature(mapData, mapData.objects.countries).features;

    var projection = d3.geoMercator()
        .translate([svgWidth / 2, svgHeight / 2])
        .scale(fullScale);

    var g = geo.append("g");
    g.append("rect")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("fill", "lightsteelblue");

    function zoomed() {
        var evt = d3.event.transform;
        g.selectAll("*")
            .attr("transform", evt);

        var radius = d3.scaleLog()
            .domain([1,maxZoom])
            .range([maxRadius,0.3]);

        var fillOpacity = d3.scaleLinear()
            .domain([1,maxZoom])
            .range([0.5,1]);

        g.selectAll(".incident-dot")
            .attr("r", radius(evt.k))
            .attr("fill-opacity", fillOpacity(evt.k));
    }
    g.call(d3.zoom()
        .scaleExtent([1, maxZoom])
        .on("zoom", zoomed));

    var path = d3.geoPath()
        .projection(projection);

    var countries = g.selectAll(".country")
        .data(countries)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path);

    var dots = g.selectAll(".incident-dot")
        .data(planeData)
        .enter().append("circle")
        .attr("class", "incident-dot")
        .attr("fill", function(d) {
            return getColor(d);
        })
        .attr("r", maxRadius)
        .attr("cx", function(d) {
            var coords;
            if (d.Longitude != "" && d.Latitude != "") {
                coords = projection([d.Longitude, d.Latitude]);
            } else if (d.Airport_Code != "") {
                if (airports_IATA[d.Airport_Code.toString()]) {
                    var port = airports_IATA[d.Airport_Code.toString()];
                    coords = projection([port[0], port[1]]);
                } else if (airports_ICAO[d.Airport_Code.toString()]) {
                    var port = airports_ICAO[d.Airport_Code.toString()];
                    coords = projection([port[0], port[1]]);
                } else {
                    coords = projection([d.Longitude, d.Latitude]);
                }
            } else {
                coords = projection([d.Longitude, d.Latitude]);
            }
            return coords[0];
        }).attr("cy", function(d) {
            var coords;
            if (d.Longitude != "" && d.Latitude != "") {
                coords = projection([d.Longitude, d.Latitude]);
            } else if (d.Airport_Code != "") {
                if (airports_IATA[d.Airport_Code.toString()]) {
                    var port = airports_IATA[d.Airport_Code.toString()];
                    coords = projection([port[0], port[1]]);
                } else if (airports_ICAO[d.Airport_Code.toString()]) {
                    var port = airports_ICAO[d.Airport_Code.toString()];
                    coords = projection([port[0], port[1]]);
                } else {
                    coords = projection([d.Longitude, d.Latitude]);
                }
            } else {
                coords = projection([d.Longitude, d.Latitude]);
            }
            return coords[1];
        }).on("mouseover", incidentMouseover)
        .on("mouseout", incidentMouseout)
        .on("click", incidentClick);
    console.log("All appended dots:",dots._groups);
} // end ready()

function incidentMouseover(d, i) {

}

function incidentMouseout(d, i) {
    // details.selectAll("*").remove();
    // d3.select("#t"+d.Accident_Number).remove();
}

function incidentClick(d, i) {
    $(".incident-dot").removeClass("active-dot");
    $(this).addClass("active-dot");
    details.selectAll("text").remove();
    var y = 20;
    details.append("a")
        .attr("target", "_blank")
        .attr("href", "https://www.google.com/search?q=NTSB%20" + d.Accident_Number)
        .append("text")
        .attr("x", 15)
        .attr("y", y)
        .attr("font-weight", "bold")
        .text("Accident Number: " + d.Accident_Number + " ⇗");
    details.append("text")
        .attr("x", 15)
        .attr("y", 2*y)
        .attr("opacity", function() {
            return (d.Event_Date != "") ? 1 : 0.3;
        })
        .text("Event Date: " + d.Event_Date);
    details.append("text")
        .attr("x", 15)
        .attr("y", 3*y)
        .attr("opacity", function() {
            return (d.Location != "") ? 1 : 0.3;
        })
        .text("Location: " + d.Location);
    details.append("text")
        .attr("x", 15)
        .attr("y", 4*y)
        .attr("opacity", function() {
            return (d.Country != "") ? 1 : 0.3;
        })
        .text("Country: " + d.Country);
    details.append("text")
        .attr("x", 15)
        .attr("y", 5*y)
        .attr("opacity", function() {
            return (d.Latitude != "") ? 1 : 0.3;
        })
        .text("Latitude: " + d.Latitude);
    details.append("text")
        .attr("x", 15)
        .attr("y", 6*y)
        .attr("opacity", function() {
            return (d.Longitude != "") ? 1 : 0.3;
        })
        .text("Longitude: " + d.Longitude);
    details.append("text")
        .attr("x", 15)
        .attr("y", 7*y)
        .attr("opacity", function() {
            return (d.Airport_Code != "") ? 1 : 0.3;
        })
        .text("Airport Code: " + d.Airport_Code);
    details.append("text")
        .attr("x", 15)
        .attr("y", 8*y)
        .attr("opacity", function() {
            return (d.Airport_Name != "") ? 1 : 0.3;
        })
        .text("Airport Name: " + d.Airport_Name);
    details.append("text")
        .attr("x", 15)
        .attr("y", 9*y)
        .attr("fill", function() {
            return getColor(d);
        })
        .attr("opacity", function() {
            return (d.Injury_Severity != "") ? 1 : 0.3;
        })
        .text("Injury Severity: " + d.Injury_Severity);
    details.append("text")
        .attr("x", 15)
        .attr("y", 10*y)
        .attr("fill", function() {
            return getColor(d);
        })
        .attr("opacity", function() {
            return (d.Aircraft_Damage != "") ? 1 : 0.3;
        })
        .text("Aircraft Damage: " + d.Aircraft_Damage);
    details.append("text")
        .attr("x", 15)
        .attr("y", 11*y)
        .attr("fill", function() {
            return getColor(d);
        })
        .attr("opacity", function() {
            return (d.Make != "") ? 1 : 0.3;
        })
        .text("Make: " + d.Make);
    details.append("text")
        .attr("x", 15)
        .attr("y", 12*y)
        .attr("fill", function() {
            return getColor(d);
        })
        .attr("opacity", function() {
            return (d.Model != "") ? 1 : 0.3;
        })
        .text("Model: " + d.Model);
    details.append("text")
        .attr("x", 15)
        .attr("y", 13*y)
        .attr("fill", function() {
            return getColor(d);
        })
        .attr("opacity", function() {
            return (d.Air_Carrier != "") ? 1 : 0.3;
        })
        .text("Air_Carrier: " + d.Air_Carrier);
    details.append("text")
        .attr("x", 15)
        .attr("y", 14*y)
        .attr("fill", function() {
            return getColor(d);
        })
        .text("Total Fatal Injuries: " + d.Total_Fatal_Injuries);
    details.append("text")
        .attr("x", 15)
        .attr("y", 15*y)
        .attr("fill", function() {
            return getColor(d);
        })
        .text("Total Serious Injuries: " + d.Total_Serious_Injuries);
    details.append("text")
        .attr("x", 15)
        .attr("y", 16*y)
        .attr("fill", function() {
            return getColor(d);
        })
        .text("Total Uninjured: " + d.Total_Uninjured);
    details.append("text")
        .attr("x", 15)
        .attr("y", 17*y)
        .attr("opacity", function() {
            return (d.Schedule != "") ? 1 : 0.3;
        })
        .text("Schedule: " + d.Schedule);
    details.append("text")
        .attr("x", 15)
        .attr("y", 18*y)
        .attr("opacity", function() {
            return (d.Weather_Condition != "" || d.Weather_Condition == "UKN") ? 1 : 0.3;
        })
        .text(function() {
            var weatherMeaning = "";
            if (d.Weather_Condition === "IMC") {
                weatherMeaning = d.Weather_Condition + " (cloudy/bad)";
            } else if (d.Weather_Condition === "VMC") {
                weatherMeaning = d.Weather_Condition + " (sun/clear)";
            } else {
                weatherMeaning = ""
            }
            return "Weather Condition: " + weatherMeaning;
        });

    details.selectAll("text")
        .attr("class", "info-line");

    if (d.Broad_Phase_of_Flight == "" || d.Broad_Phase_of_Flight == "UNKNOWN" || d.Broad_Phase_of_Flight == "OTHER" || d.Broad_Phase_of_Flight == "MANEUVERING"){
        details.append("text").attr("x", 11).attr("y", 20*y).text("Phase of Flight: N/A");
        details.append("svg:image")
            .attr('x', 10)
            .attr('y', 20.5*y)
            .attr('width', 144)
            .attr('height', 121)
            .attr("xlink:href", "images/idk.png")
    } else {
        details.append("text").attr("x", 11).attr("y", 20*y).text("Phase of Flight: " + d.Broad_Phase_of_Flight);
        if (d.Broad_Phase_of_Flight == "STANDING") { //stand
            details.append("svg:image")
                .attr('x', 10)
                .attr('y', 20.5*y)
                .attr('width', 144)
                .attr('height', 121)
                .attr("xlink:href", "images/stand.png")
        } else if (d.Broad_Phase_of_Flight == "TAKEOFF" || d.Broad_Phase_of_Flight == "CLIMB") { //up
            details.append("svg:image")
                .attr('x', 10)
                .attr('y', 20.5*y)
                .attr('width', 144)
                .attr('height', 121)
                .attr("xlink:href", "images/up.png")
        } else if (d.Broad_Phase_of_Flight == "CRUISE") { //cruise
            details.append("svg:image")
                .attr('x', 10)
                .attr('y', 20.5*y)
                .attr('width', 144)
                .attr('height', 121)
                .attr("xlink:href", "images/cruise.png")
        } else if (d.Broad_Phase_of_Flight == "TAXI" || d.Broad_Phase_of_Flight == "LANDING" || d.Broad_Phase_of_Flight == "DESCENT" || d.Broad_Phase_of_Flight == "APPROACH") { //down
            details.append("svg:image")
                .attr('x', 10)
                .attr('y', 20.5*y)
                .attr('width', 144)
                .attr('height', 121)
                .attr("xlink:href", "images/down.png")
        }
    }

    //pie legend
    var valueColors = ["red","orange","green"];
    for (i = 0; i < valueColors.length; i++) {
        details.append("rect")
            .attr("x", 58)
            .attr("y", 27.2*y + i*20)
            .style("fill", valueColors[i])
            .attr("width", 20)
            .attr("height", 20);
            var string = "";
            if (i == 0) {
                string = "Fatal";
            } else if (i == 1) {
                string = "Serious";
            } else if (i == 2) {
                string = "Uninjured";
            }
        details.append("text").attr("transform", "translate(80, "+ (  28*y + 20*i)+")").text(string);
    }

    var arc = d3.arc().innerRadius(0).outerRadius(60);
    var pie = d3.pie().value(function(d) { return d.count; }).sort(null);

    var pieData;
    if (d.Total_Fatal_Injuries == 0 && d.Total_Serious_Injuries == 0 && d.Total_Uninjured == 0) {
        pieData = [
            {label: 'Fatal', count: 0},
            {label: 'Severe', count: 0},
            {label: 'Uninjured', count: 1}
        ];
    } else {
        pieData = [
            {label: 'Fatal', count: d.Total_Fatal_Injuries},
            {label: 'Severe', count: d.Total_Serious_Injuries},
            {label: 'Uninjured', count: d.Total_Uninjured}
        ];
    }

    details.selectAll("path").remove();
    var path = details.selectAll('path')
        .data(pie(pieData))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) {
        return valueColors[i];
    }).attr("transform", "translate(220,"+(25.5*y + 20*valueColors.length)+")");

    getDotsNearClick();
} // end incidentClick()

function getDotsNearClick() {
    var clicked = $(this);
    var radius = clicked.attr("r");
    var nearbyDots = geo.select("g")
        .selectAll("circle.incident-dot")
        .filter(function(d){
            if ($(this).attr("display") != "none") {
                // returning d here gets the non-hidden elements correctly
                // but the following if statement returns nothing
                if ((Math.abs($(this).attr("cx") - clicked.attr("cx")) <= 2*radius)
                        && (Math.abs($(this).attr("cy") - clicked.attr("cy")) <= 2*radius)) {
                        return d;
                }
                // We must check cx and cy against the clicked dot
                // if absolutevalue(someDot-clickedDotPos) <= clickedDot diameter
                // then we return d
            }
        });
    console.log("Dots nearby click:", nearbyDots._groups);
} // end getDotsNearClick()

function updateYear(year1, year2) {
    $('.slider-time').html(year1);
    $('.slider-time2').html(year2);
    geo.select("g")
        .selectAll("circle")
        .filter(function(d){
            if (year1 <= d.Year && d.Year <= year2) {
                return true;
            }
        }).attr("display", "inline");

    geo.select("g")
        .selectAll("circle.incident-dot")
        .filter(function(d){
            if (!(year1 <= d.Year && d.Year <= year2)) {
                return true;
            }
        }).attr("display", "none");
} // end updateYear()

function getColor(d) {
    if (d.Total_Fatal_Injuries > 0) {
        return "red";
    } else if (d.Total_Serious_Injuries > 0) {
        return "orange";
    } else {
        return "green";
    }
} // end getColor()

document.body.addEventListener("click", function() {
    $(".active-dot").removeClass("active-dot");
}, true);
