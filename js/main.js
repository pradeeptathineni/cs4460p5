// // Creates a bootstrap-slider element

// console.log("hello world");

$("#yearSlider").slider({
    tooltip: 'always',
    tooltip_position:'bottom',
    min: 1995,
    max: 2016,
    step: 1,
    range: true,
});

$("#yearSlider").on('change', function(event){
    // Update the chart on the new value
    updateYear(event.value.newValue);
});

var __data__;

var svg = d3.select("svg#chart-area");


d3.csv("./data/aircraft_incidents.csv", function(row) {
    row["Total_Fatal_Injuries"] = +row["Total_Fatal_Injuries"];
    row["Total_Serious_Injuries"] = +row["Total_Serious_Injuries"];
    row["Total_Uninjured"] = +row["Total_Uninjured"];
    return row;
}, function(error, data) {
    if (error) {
        console.error("Error while loading ./data/asia_urbanization.csv data.");
        console.error(error);
        return;
    }
    __data__ = data;
    console.log(__data__);


});

function updateYear(year) {

}
