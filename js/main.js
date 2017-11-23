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
