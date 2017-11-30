var geo = d3.select("svg#geo-area");
var details = d3.select("svg#details-area");
var svgWidth = geo.attr("width");
var svgHeight = geo.attr("height");

var margin = {top: 0, right: 0, bottom: 0, left: 0};
var geoWidth = svgWidth - margin.left - margin.right;
var geoHeight = svgHeight - margin.top - margin.bottom;

var fullScale = svgWidth / 2 / Math.PI;

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

var brush = d3.brush()
    .extent([[0, 0], [svgWidth, svgHeight]])
    .on("start", brushstart)
    .on("brush", brushmove)
    .on("end", brushend);


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

        console.log(evt.k, radius(evt.k),fillOpacity(evt.k));
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
        .data(planeData)
        .enter().append("circle")
        .attr("class", "incident-dot")
        .attr("r", maxRadius)
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
    // details.attr("id", "#t" + d.Accident_Number).append("rect").attr("x", 0).attr("y", 0).attr("width", 300)
    // .attr("height", 500).style("fill", "#E9E9E9").attr("rx", 15).attr("ry", 15);
    //
    // details.append("text").attr("x", 10).attr("y", 26).text("Detailed Information")
    //     .style("text-decoration", "underline").style("font-size", "24px");//attr("font-weight", "bold");
    // var hText = 15;
    // details.append("text").attr("x", 10).attr("y", 3*hText).text("Accident Num: " + d.Accident_Number);
    // details.append("text").attr("x", 10).attr("y", 4*hText).text("Country: " + d.Country);
    // details.append("text").attr("x", 10).attr("y", 5*hText).text("Location: " + d.Location);
    // details.append("text").attr("x", 10).attr("y", 6*hText).text("Airport Name: " + d.Airport_Name);
    // details.append("text").attr("x", 10).attr("y", 7*hText).text("Date: " + d.Event_Date.toString());
    // details.append("text").attr("x", 10).attr("y", 8*hText).text("Make: " + d.Make);
    // details.append("text").attr("x", 10).attr("y", 9*hText).text("Model: " + d.Model);
    // details.append("text").attr("x", 10).attr("y", 10*hText).text("Carrier: " + d.Air_Carrier);
    // if (d.Broad_Phase_of_Flight == "" || d.Broad_Phase_of_Flight == "UNKNOWN" || d.Broad_Phase_of_Flight == "OTHER" || d.Broad_Phase_of_Flight == "MANEUVERING"){
    //     details.append("text").attr("x", 11).attr("y", 11*hText).text("Phase of Flight: N/A");
    //     details.append("svg:image")
    //         .attr('x', 10)
    //         .attr('y', 11.5*hText)
    //         .attr('width', 144)
    //         .attr('height', 121)
    //         .attr("xlink:href", "resources/phase/idk.png")
    // } else {
    //     details.append("text").attr("x", 11).attr("y", 11*hText).text("Phase of Flight: " + d.Broad_Phase_of_Flight);
    //     if (d.Broad_Phase_of_Flight == "STANDING") { //stand
    //         details.append("svg:image")
    //             .attr('x', 10)
    //             .attr('y', 11.5*hText)
    //             .attr('width', 144)
    //             .attr('height', 121)
    //             .attr("xlink:href", "resources/phase/stand.png")
    //     } else if (d.Broad_Phase_of_Flight == "TAKEOFF" || d.Broad_Phase_of_Flight == "CLIMB") { //up
    //         details.append("svg:image")
    //             .attr('x', 10)
    //             .attr('y', 11.5*hText)
    //             .attr('width', 144)
    //             .attr('height', 121)
    //             .attr("xlink:href", "resources/phase/up.png")
    //     } else if (d.Broad_Phase_of_Flight == "CRUISE") { //cruise
    //         details.append("svg:image")
    //             .attr('x', 10)
    //             .attr('y', 11.5*hText)
    //             .attr('width', 144)
    //             .attr('height', 121)
    //             .attr("xlink:href", "resources/phase/cruise.png")
    //     } else if (d.Broad_Phase_of_Flight == "TAXI" || d.Broad_Phase_of_Flight == "LANDING" || d.Broad_Phase_of_Flight == "DECENT" || d.Broad_Phase_of_Flight == "APPROACH") { //down
    //         details.append("svg:image")
    //             .attr('x', 10)
    //             .attr('y', 11.5*hText)
    //             .attr('width', 144)
    //             .attr('height', 121)
    //             .attr("xlink:href", "resources/phase/down.png")
    //     }
    //
    // }



    //pics of plane and weather
    //pie chart?

    //console.log(d);
    //note Currently it does not remove the element when you move the mouse away
}

function incidentMouseout(d, i) {
    // details.selectAll("*").remove();
    // d3.select("#t"+d.Accident_Number).remove();
}

function incidentClick(d, i) {
    $(".incident-dot").removeClass("active-dot");
    $(this).addClass("active-dot");
    details.selectAll("text").remove();
    var y = 25;
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
}

function updateYear(year1, year2) {
    //svg.selectAll("circle").remove();
    svg.selectAll("circle").filter(function(d){
        var parse = d3.timeParse("%m/%d/%y")(d.Event_Date);
        var a = parse.getFullYear();
        if (year1 <= a && a <= year2) {
            return true;
        }
    }).attr("fill-opacity", 1);

    svg.selectAll("circle").filter(function(d){
        var parse = d3.timeParse("%m/%d/%y")(d.Event_Date);
        var a = parse.getFullYear();
        if (!(year1 <= a && a <= year2)) {
            return true;
        }
    }).attr("fill-opacity", .2);
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
