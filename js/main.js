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

$("#years-slider").slider({
    tooltip: "always",
    tooltip_position: "bottom",

});

$("#years-slider").on("change", function(event, value){
    updateYear(event.value.newValue[0],event.value.newValue[1])
});

var brush = d3.brush()
    .extent([[0, 0], [svgWidth, svgHeight]])
    .on("start", brushstart)
    .on("brush", brushmove)
    .on("end", brushend);


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

    var usefulPlaneData = [];
    planeData.forEach(function(d, i) {
        if ((d.Longitude != "" && d.Latitude != "")) {
            if (d.Longitude != "0" && d.Latitude != "0") {
                usefulPlaneData.push(d);
            }
        } else if (d.Airport_code != "") {
            if (airports_IATA[d.Airport_code] || airports_ICAO[d.Airport_code]) {
                usefulPlaneData.push(d);
            }
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

    var maxZoom = 20;
    var maxRadius = 4;
    var minStrokeWidth = 0.05;
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

    g.call(brush);

    var path = d3.geoPath()
        .projection(projection);

    var countries = g.selectAll(".country")
        .data(countries)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path);

    var dots = g.selectAll(".incident-dot")
        .data(usefulPlaneData)
        .enter().append("circle")
        .attr("class", "incident-dot")
        .attr("r", maxRadius)
        .attr("cx", function(d) {
            var coords;
            if (d.Longitude != "" && d.Latitude != "") {
                coords = projection([d.Longitude, d.Latitude]);
            } else if (d.Airport_Code != "") {
                if (airports_IATA[d.Airport_Code]) {
                    var port = airports_IATA[d.Airport_Code];
                    coords = projection([port[0], port[1]]);
                } else if (airports_ICAO[d.Airport_Code]) {
                    var port = airports_ICAO[d.Airport_Code];
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
                if (airports_IATA[d.Airport_Code]) {
                    var port = airports_IATA[d.Airport_Code];
                    coords = projection([port[0], port[1]]);
                } else if (airports_ICAO[d.Airport_Code]) {
                    var port = airports_ICAO[d.Airport_Code];
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
}

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
        .attr("href", "https://www.google.com/search?q=ntsb%20" + d.Accident_Number)
        .append("text")
        .attr("x", 15)
        .attr("y", y)
        .text("Accident Number: " + d.Accident_Number + " ⇗");
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
        .attr("fill", "severity-text")
        .attr("fill", "red")
        .text("Injury Severity: " + d.Injury_Severity);
    details.append("text")
        .attr("x", 15)
        .attr("y", 10*y)
        .attr("fill", "severity-text")
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
    var valueColors = ['#d44951','#fa8873','#fcc9b5'];
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

    //pie
    var arc = d3.arc().innerRadius(0).outerRadius(60);
    var pie = d3.pie().value(function(d) { return d.count; }).sort(null);

    // console.log(d.Total_Fatal_Injuries);
    // console.log(d.Total_Serious_Injuries);
    // console.log(d.Total_Uninjured);
    var pieData;
    if (d.Total_Fatal_Injuries == 0 && d.Total_Serious_Injuries == 0 && d.Total_Uninjured == 0) {
        pieData = [
          { label: 'Fatal', count: 0},
          { label: 'Severe', count: 0},
          { label: 'Uninjured', count: 1}
        ];
    } else {

        pieData = [
          { label: 'Fatal', count: d.Total_Fatal_Injuries},
          { label: 'Severe', count: d.Total_Serious_Injuries },
          { label: 'Uninjured', count: d.Total_Uninjured }
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
}// end function

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
}

function brushstart(cell) {
    // cell is the SplomCell object

    // Check if this g element is different than the previous brush
    if(brushCell !== this) {

        // Clear the old brush
        brush.move(d3.select(brushCell), null);

        // Update the global scales for the subsequent brushmove events
        xScale.domain(extentByAttribute[cell.x]);
        yScale.domain(extentByAttribute[cell.y]);

        // Save the state of this g element as having an active brush
        brushCell = this;
    }
}

function brushmove(cell) {
    // cell is the SplomCell object

    // Get the extent or bounding box of the brush event, this is a 2x2 array
    var e = d3.event.selection;
    if(e) {

        // Select all .dot circles, and add the "hidden" class if the data for that circle
        // lies outside of the brush-filter applied for this SplomCells x and y attributes
        geo.selectAll(".dot")
            .classed("hidden", function(d){
                return e[0][0] > xScale(d[cell.x]) || xScale(d[cell.x]) > e[1][0]
                    || e[0][1] > yScale(d[cell.y]) || yScale(d[cell.y]) > e[1][1];
            });

        // Challenge 1: FILTER ON BRUSH
        // xScale.domain(extentByAttribute[cell.x]);
        // yScale.domain(extentByAttribute[cell.y]);

        // var filtered = cars.filter(function(d){
        //     return (e[0][0] <= xScale(d[cell.x]) && xScale(d[cell.x]) <= e[1][0])
        //         && ((e[0][1] <= yScale(d[cell.y]) && yScale(d[cell.y]) <= e[1][1]));
        // });

        // geo.selectAll('.cell')
        //     .each(function(c){
        //         c.update(this, filtered);
        //     });
    }
}

function brushend() {
    // If there is no longer an extent or bounding box then the brush has been removed
    if(!d3.event.selection) {
        // Bring back all hidden .dot elements
        geo.selectAll('.hidden').classed('hidden', false);

        // Challenge 1: FILTER ON BRUSH
        // geo.selectAll('.cell')
        //     .each(function(c){
        //         c.update(this, cars);
        //     });

        // Return the state of the active brushCell to be undefined
        brushCell = undefined;
    }
}
