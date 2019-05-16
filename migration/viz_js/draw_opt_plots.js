// USA map parameters
const mapWidth = 960;
const mapHeight = 600;

const sankeyHeight = 450;
const sankeyWidth = 830;

// general margin parameters
const margin = {top: 10, right: 10, bottom: 20, left: 40};
const sankeyMargin = {top: 20, right: 20, bottom: 30, left: 50}

var chosen_msa = null;

// Choose maps & force heights/widths
var metro_svg = d3.select("div#opt-map")
   .append("div")
   .classed("svg-container", true) //container class to make it responsive
   .append("svg")
   //responsive SVG needs these 2 attributes and no width and height attr
   // .attr("width", 100%)
   // .attr("height", 100%)
   .attr("preserveAspectRatio", "xMidYMid meet")
   .attr("viewBox", "0 0 960 600")
   //class to make it responsive
   .classed("svg-content-responsive", true);

// var sankey_svg = d3.select("#sankey").append("svg").attr("height", sankeyHeight).attr("width", sankeyWidth)

// Set the tooltip parameters for the hover
var tooltip = d3.select("body")
                .append("div")
                .style("position", "absolute")
                .style("font-family", "'Open Sans', sans-serif")
                .style("font-size", "12px")
                .style("color", "#e7eeef")
                .style("padding", "5px")
                .style("opacity", "1")
                .style("z-index", "10")
                .style("visibility", "hidden")
                .style("text-align", "center")
                .style("width", "120px");

// Color schemes for OPT data (reds) & H1B data (purples)
const opt_colors = ["#550900", "#660A00", "#770C00", "#880E00", "#990F00", "#AA1100",
            "#BA1200", "#C02717", "#C63D2E", "#CC5245", "#D3685C", "#D97D73",
            "#DF938B", "#E5A8A2", "#ECBEB9", "#F2D3D0"];

const h1b_colors = ["#535166", "#5E5C74", "#6A6883", "#767391",
            "#817E9F", "#8C89A7", "#9795B0", "#A3A1B9", "#AEACC1", "#BAB8CA",
            "#C5C4D3", "#D1D0DC", "#DCDBE4", "#E8E7ED"]

// Convert a number to a number with commas after the thousands
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Filter a dataset such that the field given has the specified value
function filter(data, field, value) {
    output = [];
    data.forEach(d => d[field] == value ? output.push(d) : 0);
    return output;
}

// Load OPT data
opt = d3.csv("https://gist.githubusercontent.com/apaarty/45aef751a3124c57e23ca971f67916b8/raw/d4827970c216a5ee8e49b449d454e18a1ad8ca8c/gistfile1.txt").then(
function(data) {
var opt_data = data;

// Convert the various OPT data of interest to datasets for each data type rather than one row for each MSA
var msas = []; // Array of msa names
var students_by_msa = {}; // Number of students who attended school in each MSA
var opt_by_msa = {}; // Number of students who had an OPT position in each MSA
var retention_by_msa = {}; // Retention rate of students -> OPT positions in each MSA
var attraction_by_msa = {}; // Attraction rate of students from other MSAs to do OPT in this MSA

// Iterate through the OPT data and compute the relevant data for each MSA (1 MSA = 1 row in OPT data)
opt_data.forEach(function(row) {
    students_by_msa[row["Metro area"]] = {
        "value": +row["Number who attended school in area"]
    };

    opt_by_msa[row["Metro area"]] = {
        "value": +row["Total number who worked in area following school"]
    };

    retention = (+row["Number who attended school in area"] - +row["Number who left area for work"]) / +row["Number who attended school in area"];
    retention_by_msa[row["Metro area"]] = {
        "value": retention
    };

    attraction = +row["Number who entered area to work"] / +row["Total number who worked in area following school"]
    attraction_by_msa[row["Metro area"]] = {
        "value": attraction
    }

    msas.push(row["Metro area"]);
});

// Obtain the values observed for students_by_msa
var student_values = [];
Object.values(students_by_msa).forEach(d => student_values.push(d.value));
// console.log(student_values);

// Obtain the values observed for opt_by_msa
var opt_values = [];
Object.values(opt_by_msa).forEach(d => opt_values.push(d.value));

// Create a color scale that converts the log(opt_by_msa) data into a color range
var optColor = d3.scaleQuantize()
    .domain([Math.log(d3.min(opt_values))-1,
             Math.log(d3.max(opt_values))])
    .range(opt_colors.reverse());

// Create a color scale that converts the log(students_by_msa) data into a color range
var studentColor = d3.scaleQuantize()
    .domain([Math.log(d3.min(student_values))-1,
             Math.log(d3.max(student_values))])
    .range(opt_colors);

// Create a color scale that converts a rate variable (i.e. retention or attraction) to a color range
var rateColor = d3.scaleQuantize()
    .domain([0, 1])
    .range(opt_colors);


// Update the by-MSA data to include the color associated with each value
for (var i in msas) {
    var this_msa = msas[i];
    // console.log(this_msa);
    // console.log(students_by_msa[this_msa].value + " --> " + studentColor(Math.log(students_by_msa[this_msa].value)))
    students_by_msa[this_msa].color = studentColor(Math.log(students_by_msa[this_msa].value));
    opt_by_msa[this_msa].color = optColor(Math.log(opt_by_msa[this_msa].value));
    retention_by_msa[this_msa].color = rateColor(retention_by_msa[this_msa].value);
    attraction_by_msa[this_msa].color = rateColor(attraction_by_msa[this_msa].value);
}

// Load USA topojson
d3.json("https://gist.githubusercontent.com/nbailey/5a4d2fcb6d344a31b017dd98822e0ce1/raw/7a042b265e32c48f96254d6c4802f4e306b6e4bc/usa_states.geojson").then(function(data) {
const usa = data;

// Load MSA topojson
d3.json("https://gist.githubusercontent.com/apaarty/70843364dbbb62b751e66cec56b73ad5/raw/ca77ba829fd05fef636fd1288c6a1bbe6d9e347d/cb_2013_us_cbsa_5m.geojson").then(function(data) {
const msa = data;

// Load H1B data
d3.csv("https://gist.githubusercontent.com/nbailey/d1efa74f6dec9b58f17237a60d6499bf/raw/8c74891bb4a957352bebcff7739a8bf10547b1c1/h1b_msa_2009_to_2019.csv").then(function(data) {
const raw_h1b_data = data;

// Filter h1b data to only the MSAs found in the OPT dataset
h1b_data = [];
msas.forEach(d => h1b_data.push(filter(raw_h1b_data, "metro", d)[0]))

    // Get the years for the dataset (first two columns are metro id and metro name)
    const years = Object.keys(h1b_data[0]).slice(2);

    //Convert the H1B data from categorized by MSA to categorized by variable type
    var h1b_msas = []; // Array of MSAs in H1B dataset
    var current_by_msa = {}; // Current number of H1Bs in each MSA
    var growth_by_msa = {}; // Growth rate of H1B positions from 2009 -> 2019
    // Iterate through H1B data as OPT data before
    h1b_data.forEach(function(row) {
        // console.log(row);
        h1b_msas.push(row.metro)
        current_by_msa[row.metro] = {"value": +row["2018"]};
        if (+row["2009"] > 0) {
            growth_by_msa[row.metro] = {"value": (+row["2018"] - +row["2009"]) / +row["2009"]};
        }
    });

    // console.log(h1b_msas)

    // console.log(filter(h1b_data, "metro", "Nashville-Davidson-Murfreesboro-Franklin, TN"));

    var current_values = [];
    Object.values(current_by_msa).forEach(d => current_values.push(d.value));

    var growth_values = [];
    Object.values(growth_by_msa).forEach(d => growth_values.push(d.value));
    var max_growth = d3.max(growth_values)
    var min_growth = d3.min(growth_values)

    // Map the growth values such that either min->0 or max->1 (depending on which is larger)
    // and that a growth of 0 is tied to 0.5
    // Because we use interpolateRdBu for the color scheme, where the midpoint is 0.5
    // var growth_map;
    // if (Math.abs(min_growth) > Math.abs(max_growth) & min_growth < 0) {
    //     growth_map = d => 0.5 - (0.5 * d) / min_growth;
    // } else {
    //     growth_map = d => 0.5 + (0.5 * d) / max_growth;
    // }

    // growth_map = function(d
    function growth_map(d) {
        lower_values = 0;
        growth_values.forEach(x => x < d ? lower_values += 1 : 0);
        return lower_values / growth_values.length;
    }

    // Create a color scale to map log(current_by_msa) to a color using the h1b colors
    var currentColor = d3.scaleQuantize()
        .domain([d3.max([Math.log(d3.min(current_values)), 0]),
                 Math.log(d3.max(current_values))])
        .range(h1b_colors.reverse());

    // Create a color scale to convert the mapped growth_by_msa to a color between red and blue
    // var growthColor = d3.scaleQuantize()
    //     .domain([0, 1])
    //     // .domain(d3.extent(growth_values))
    //     .range(d3.schemeRdBu[9].reverse())

    var growthColor = d3.scaleLinear()
        .domain([0, 0.5, 1])
        // .range(d3.schemeRdBu[3])
        .range(["#BA1200", "#9795B0", "#274C77"])

    // console.log(current_by_msa)

    // Update the by-MSA data to include the color
    for (var i in h1b_msas) {
        var this_msa = h1b_msas[i];

        if (Object.keys(current_by_msa).includes(this_msa)) {
            current_by_msa[this_msa].color = currentColor(d3.max([Math.log(current_by_msa[this_msa].value), 0]));
        }

        if (Object.keys(growth_by_msa).includes(this_msa)) {
            growth_by_msa[this_msa].color = growthColor(growth_map(growth_by_msa[this_msa].value));
            // growth_by_msa[this_msa].color = growthColor(growth_by_msa[this_msa].value);
        }
    }

    // console.log(growth_by_msa);

    // This value stores the selected MSA
    var selected_metro = null;

    var g_states = metro_svg.append("g")
    var g_metros = metro_svg.append("g")

    // Set functions to set the tooltip text and color and MSA path fill for each MSA object
    tooltipText = d => numberWithCommas(students_by_msa[d.properties.name].value) + " students in " + d.properties.name;
    tooltipColor = d => students_by_msa[d.properties.name].color;
    fillColor = d => (Object.keys(students_by_msa).includes(d.properties.name) ? students_by_msa[d.properties.name].color : "none");

    function showTooltip(elemData) {
        var metro_name = elemData.properties.name;
        tooltip.style("visibility", "visible")
               .style("background", selected_metro == metro_name ? "#9ad1d4" : tooltipColor(elemData))
               .style("color", selected_metro == metro_name ? "black" : "white")
               .text(tooltipText(elemData));
    }

    function moveTooltip(elemData) {
        var metro_name = elemData.properties.name;
        tooltip.style("top", (d3.event.pageY-10)+"px")
               .style("left", (d3.event.pageX+10)+"px")
               .style("color", selected_metro == metro_name ? "black" : "white")
               .html(tooltipText(elemData));
    }

    var projPath = d3.geoPath().projection(d3.geoAlbers());

    g_states.selectAll("path")
        .data(usa.features)
        .enter().append("path")
        .attr("d", projPath)
            .style("fill", "#e7eeef")
            .style("stroke", "black");

    const outlineClick = metro_svg.append("path")
        .attr("fill", "#9ad1d4")
        .attr("stroke", "black")
        .attr("pointer-events", "none");

    g_metros.selectAll("path")
        .data(msa.features)
        .enter().append("path")
        .attr("d", projPath)
        .attr("class", "metro-path")
            .style("fill", fillColor)
            .style("stroke", d => Object.keys(students_by_msa).includes(d.properties.name) ? "black" : "none")
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseout", d => tooltip.style("visibility", "hidden"))
            .on("click", function(d) {
                metro_name = d.properties.name;
                const node = metro_svg.node();
                node.value = selected_metro = selected_metro === metro_name ? null : metro_name;
                node.dispatchEvent(new CustomEvent("input"));
                outlineClick.attr("d", selected_metro ? projPath(d) : null)
                if (selected_metro === metro_name) {
                    tooltip.style("background", "#9ad1d4")
                           .style("color", "black");
                } else {
                    tooltip.style("background", students_by_msa[d.properties.name].color)
                           .style("color", "white");
                }
            });

        legend = function(g) {
            const yScale = d3.scaleLinear()
                .domain(d3.extent(studentColor.domain()))
                .rangeRound([0, 240]);

            g.selectAll("rect")
                .data(studentColor.range().map(d => studentColor.invertExtent(d)))
                .join("rect")
                    .attr("width", 8)
                    .attr("y", d => yScale(d[0]))
                    .attr("height", d => yScale(d[1]) - yScale(d[0]))
                    .attr("fill", d => studentColor(d[0]));

            g.append("text")
                .attr("x", 0)
                .attr("y", -8)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .attr("id", "legend-text")
                .text("Log number of students in area who obtained an OPT position");

            g.call(d3.axisRight(yScale)
                .tickSize(13)
                .tickFormat(d => d)
                .tickValues(studentColor.range().slice(1).map(d => studentColor.invertExtent(d)[0].toFixed(1))))
                .select(".domain")
                    .remove()
        }

        metro_svg.append("g")
               .attr("transform", "translate(800, 300)")
               .attr("id", "metro-legend")
               .call(legend);


    // console.log(g_metros);

    d3.select("#opt-metric-select").on("change", function() {
        // Update drawing with data computed for that metric
        // console.log("OPT Metric changed!")
        // console.log("To: " + d3.select("#opt-metric-select").node().value)

        switch(d3.select("#opt-metric-select").node().value) {
            case "students":
                d3.select("#legend-text")
                    .text("Log number of students in area who obtained an OPT position")

                tooltipText = d => numberWithCommas(students_by_msa[d.properties.name].value) + " students in " + d.properties.name;
                tooltipColor = d => students_by_msa[d.properties.name].color;
                fillColor = d => (Object.keys(students_by_msa).includes(d.properties.name) ? students_by_msa[d.properties.name].color : "none");

                updateData(students_by_msa);

                legend = function(g) {
                    const yScale = d3.scaleLinear()
                        .domain(d3.extent(studentColor.domain()))
                        .rangeRound([0, 240]);

                    g.selectAll("rect")
                        .data(studentColor.range().map(d => studentColor.invertExtent(d)))
                        .join("rect")
                            .attr("width", 8)
                            .attr("y", d => yScale(d[0]))
                            .attr("height", d => yScale(d[1]) - yScale(d[0]))
                            .attr("fill", d => studentColor(d[0]));

                    g.append("text")
                        .attr("x", 0)
                        .attr("y", -8)
                        .attr("fill", "currentColor")
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("id", "legend-text")
                        .text("Log number of students in area who obtained an OPT position");

                    g.call(d3.axisRight(yScale)
                        .tickSize(13)
                        .tickFormat(d => d)
                        .tickValues(studentColor.range().slice(1).map(d => studentColor.invertExtent(d)[0].toFixed(1))))
                        .select(".domain")
                            .remove()
                }

                metro_svg.append("g")
                       .attr("transform", "translate(800, 300)")
                       .attr("id", "metro-legend")
                       .call(legend);

                break;
            case "opts":
                d3.select("#legend-text")
                    .text("Log number of OPT positions in area")

                tooltipText = d => numberWithCommas(opt_by_msa[d.properties.name].value) + " OPTs in " + d.properties.name;
                tooltipColor = d => opt_by_msa[d.properties.name].color;
                fillColor = d => (Object.keys(opt_by_msa).includes(d.properties.name) ? opt_by_msa[d.properties.name].color : "none");

                updateData(opt_by_msa);

                legend = function(g) {
                    const yScale = d3.scaleLinear()
                        .domain(d3.extent(optColor.domain()))
                        .rangeRound([0, 240]);

                    g.selectAll("rect")
                        .data(optColor.range().map(d => optColor.invertExtent(d)))
                        .join("rect")
                            .attr("width", 8)
                            .attr("y", d => yScale(d[0]))
                            .attr("height", d => yScale(d[1]) - yScale(d[0]))
                            .attr("fill", d => optColor(d[0]));

                    g.append("text")
                        .attr("x", 0)
                        .attr("y", -8)
                        .attr("fill", "currentColor")
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("id", "legend-text")
                        .text("Log number of students in area who obtained an OPT position");

                    g.call(d3.axisRight(yScale)
                        .tickSize(13)
                        .tickFormat(d => d)
                        .tickValues(optColor.range().slice(1).map(d => optColor.invertExtent(d)[0].toFixed(1))))
                        .select(".domain")
                            .remove()
                }

                metro_svg.append("g")
                       .attr("transform", "translate(800, 300)")
                       .attr("id", "metro-legend")
                       .call(legend);

                break;
            case "retention":
                tooltipText = d => d.properties.name + ": " + (100*retention_by_msa[d.properties.name].value).toFixed(1) + "%"
                tooltipColor = d => retention_by_msa[d.properties.name].color;
                fillColor = d => (Object.keys(retention_by_msa).includes(d.properties.name) ? retention_by_msa[d.properties.name].color : "none");

                updateData(retention_by_msa);

                legend = function(g) {
                    const yScale = d3.scaleLinear()
                        .domain(d3.extent(rateColor.domain()))
                        .rangeRound([0, 240]);

                    g.selectAll("rect")
                        .data(rateColor.range().map(d => rateColor.invertExtent(d)))
                        .join("rect")
                            .attr("width", 8)
                            .attr("y", d => yScale(d[0]))
                            .attr("height", d => yScale(d[1]) - yScale(d[0]))
                            .attr("fill", d => rateColor(d[0]));

                    g.append("text")
                        .attr("x", 0)
                        .attr("y", -8)
                        .attr("fill", "currentColor")
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("id", "legend-text")
                        .text("Log number of students in area who obtained an OPT position");

                    g.call(d3.axisRight(yScale)
                        .tickSize(13)
                        .tickFormat(d => d)
                        .tickValues(rateColor.range().slice(1).map(d => rateColor.invertExtent(d)[0].toFixed(1))))
                        .select(".domain")
                            .remove()
                }

                metro_svg.append("g")
                       .attr("transform", "translate(800, 300)")
                       .attr("id", "metro-legend")
                       .call(legend);

                break;
            case  "attraction":
                tooltipText = d => d.properties.name + ": " + (100*attraction_by_msa[d.properties.name].value).toFixed(1) + "%"
                tooltipColor = d => attraction_by_msa[d.properties.name].color;
                fillColor = d => (Object.keys(attraction_by_msa).includes(d.properties.name) ? attraction_by_msa[d.properties.name].color : "none");

                updateData(attraction_by_msa);

                legend = function(g) {
                    const yScale = d3.scaleLinear()
                        .domain(d3.extent(rateColor.domain()))
                        .rangeRound([0, 240]);

                    g.selectAll("rect")
                        .data(rateColor.range().map(d => rateColor.invertExtent(d)))
                        .join("rect")
                            .attr("width", 8)
                            .attr("y", d => yScale(d[0]))
                            .attr("height", d => yScale(d[1]) - yScale(d[0]))
                            .attr("fill", d => rateColor(d[0]));

                    g.append("text")
                        .attr("x", 0)
                        .attr("y", -8)
                        .attr("fill", "currentColor")
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("id", "legend-text")
                        .text("Log number of students in area who obtained an OPT position");

                    g.call(d3.axisRight(yScale)
                        .tickSize(13)
                        .tickFormat(d => d)
                        .tickValues(rateColor.range().slice(1).map(d => rateColor.invertExtent(d)[0].toFixed(1))))
                        .select(".domain")
                            .remove()
                }

                metro_svg.append("g")
                       .attr("transform", "translate(800, 300)")
                       .attr("id", "metro-legend")
                       .call(legend);

                break;
        }

        // d3.select("#legend-text").text("") // Update legend label to represent the selected metric

    });

    d3.select("#h1b-metric-select").on("change", function() {
        // Update drawing with data computed for that metric

        switch (d3.select("#h1b-metric-select").node().value) {
            case "current":
                tooltipText = d => numberWithCommas(current_by_msa[d.properties.name].value) + " H1B positions in 2018 in " + d.properties.name;
                tooltipColor = d => current_by_msa[d.properties.name].color;
                fillColor = d => (Object.keys(current_by_msa).includes(d.properties.name) ? current_by_msa[d.properties.name].color : "none");

                updateData(current_by_msa);

                legend = function(g) {
                    const yScale = d3.scaleLinear()
                        .domain(d3.extent(currentColor.domain()))
                        .rangeRound([0, 240]);

                    g.selectAll("rect")
                        .data(currentColor.range().map(d => currentColor.invertExtent(d)))
                        .join("rect")
                            .attr("width", 8)
                            .attr("y", d => yScale(d[0]))
                            .attr("height", d => yScale(d[1]) - yScale(d[0]))
                            .attr("fill", d => currentColor(d[0]));

                    g.append("text")
                        .attr("x", 0)
                        .attr("y", -8)
                        .attr("fill", "currentColor")
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("id", "legend-text")
                        .text("Log number of H1B positions in 2018");

                    g.call(d3.axisRight(yScale)
                        .tickSize(13)
                        .tickFormat(d => d)
                        .tickValues(currentColor.range().slice(1).map(d => currentColor.invertExtent(d)[0].toFixed(1))))
                        .select(".domain")
                            .remove()
                }

                metro_svg.append("g")
                       .attr("transform", "translate(800, 300)")
                       .attr("id", "metro-legend")
                       .call(legend);

                break;
            case "growth":
                tooltipText = function(d) {
                    var metro_name = d.properties.name;
                    var growth = growth_by_msa[d.properties.name].value;
                    if (growth > 0) {
                        return "H1B positions in " + metro_name + " have grown by " + (100*growth).toFixed(1) + "% since 2009";
                    } else {
                        return "H1B positions in " + metro_name + " have decreased by " + (100*Math.abs(growth)).toFixed(1) + "% since 2009";
                    }
                };
                tooltipColor = d => growth_by_msa[d.properties.name].color;
                fillColor = d => (Object.keys(growth_by_msa).includes(d.properties.name) ? growth_by_msa[d.properties.name].color : "none");

                updateData(growth_by_msa);

                legend = function(g) {
                    const yScale = d3.scaleLinear()
                        .domain(d3.extent(growthColor.domain()))
                        .rangeRound([0, 240]);

                    var defs = metro_svg.append("defs")

                    var linearGradient = defs.append("linearGradient")
                        .attr("id", "linear-gradient")
                        .attr("x1", "0%")
                        .attr("y1", "0%")
                        .attr("x2", "0%")
                        .attr("y2", "100%")

                    g.selectAll("rect")
                        .data(growthColor.range().map(d => growthColor.invertExtent(d)))
                        .join("rect")
                            .attr("width", 8)
                            .attr("y", d => yScale(d[0]))
                            .attr("height", d => yScale(d[1]) - yScale(d[0]))
                            .attr("fill", d => growthColor(d[0]));

                    g.append("text")
                        .attr("x", 0)
                        .attr("y", -8)
                        .attr("fill", "currentColor")
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("id", "legend-text")
                        .text("Percentile of growth in H1B positions since 2009");

                    g.call(d3.axisRight(yScale)
                        .tickSize(13)
                        .tickFormat(d => d)
                        .tickValues(growthColor.range().slice(1).map(d => growthColor.invertExtent(d)[0].toFixed(1))))
                        .select(".domain")
                            .remove()
                }

                metro_svg.append("g")
                       .attr("transform", "translate(800, 300)")
                       .attr("id", "metro-legend")
                       .call(legend);

                break;
        }

        d3.select("#legend-text").text("") // Update legend label to represent the selected metric

    });

    d3.selectAll("input").on("change", function() {
        switch(d3.select("input[name='data']:checked").node().value) {
            case "OPT":
                // Update which dropdown is shown
                d3.select("#opt-metric-select").style("visibility", "visible");
                d3.select("#h1b-metric-select").style("visibility", "hidden");

                document.getElementById("opt-metric-select").value = "students";

                tooltipText = d => numberWithCommas(students_by_msa[d.properties.name].value) + " students in " + d.properties.name;
                tooltipColor = d => students_by_msa[d.properties.name].color;
                fillColor = d => (Object.keys(students_by_msa).includes(d.properties.name) ? students_by_msa[d.properties.name].color : "none");

                updateData(students_by_msa);

                legend = function(g) {
                    const yScale = d3.scaleLinear()
                        .domain(d3.extent(studentColor.domain()))
                        .rangeRound([0, 240]);

                    g.selectAll("rect")
                        .data(studentColor.range().map(d => studentColor.invertExtent(d)))
                        .join("rect")
                            .attr("width", 8)
                            .attr("y", d => yScale(d[0]))
                            .attr("height", d => yScale(d[1]) - yScale(d[0]))
                            .attr("fill", d => studentColor(d[0]));

                    g.append("text")
                        .attr("x", 0)
                        .attr("y", -8)
                        .attr("fill", "currentColor")
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("id", "legend-text")
                        .text("Log number of students in area who obtained an OPT position");

                    g.call(d3.axisRight(yScale)
                        .tickSize(13)
                        .tickFormat(d => d)
                        .tickValues(studentColor.range().slice(1).map(d => studentColor.invertExtent(d)[0].toFixed(1))))
                        .select(".domain")
                            .remove()
                }

                metro_svg.append("g")
                       .attr("transform", "translate(800, 300)")
                       .attr("id", "metro-legend")
                       .call(legend);

                break;
            case "H1B":
                d3.select("#opt-metric-select").style("visibility", "hidden");
                d3.select("#h1b-metric-select").style("visibility", "visible");

                document.getElementById("h1b-metric-select").value = "current";

                tooltipText = d => numberWithCommas(current_by_msa[d.properties.name].value) + " H1B positions in 2018 in " + d.properties.name;
                tooltipColor = d => current_by_msa[d.properties.name].color;
                fillColor = d => (Object.keys(current_by_msa).includes(d.properties.name) ? current_by_msa[d.properties.name].color : "none");

                updateData(current_by_msa);

                legend = function(g) {
                    const yScale = d3.scaleLinear()
                        .domain(d3.extent(currentColor.domain()))
                        .rangeRound([0, 240]);

                    g.selectAll("rect")
                        .data(currentColor.range().map(d => currentColor.invertExtent(d)))
                        .join("rect")
                            .attr("width", 8)
                            .attr("y", d => yScale(d[0]))
                            .attr("height", d => yScale(d[1]) - yScale(d[0]))
                            .attr("fill", d => currentColor(d[0]));

                    g.append("text")
                        .attr("x", 0)
                        .attr("y", -8)
                        .attr("fill", "currentColor")
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("id", "legend-text")
                        .text("Log number of H1B positions in 2018");

                    g.call(d3.axisRight(yScale)
                        .tickSize(13)
                        .tickFormat(d => d)
                        .tickValues(currentColor.range().slice(1).map(d => currentColor.invertExtent(d)[0].toFixed(1))))
                        .select(".domain")
                            .remove()
                }

                metro_svg.append("g")
                       .attr("transform", "translate(800, 300)")
                       .attr("id", "metro-legend")
                       .call(legend);

                break;
        }
        // Update drawing with default data for that option

        d3.select("#legend-text").text("") // Update legend label to represent default metric for that option

    })

    function updateData(data) {
        // console.log("Redrawing...")
        // console.log(data)
        metro_svg.selectAll("*").remove();

        var g_states = metro_svg.append("g")
        var g_metros = metro_svg.append("g")

        g_states.selectAll("path")
            .data(usa.features)
            .enter().append("path")
            .attr("d", projPath)
                .style("fill", "#e7eeef")
                .style("stroke", "black");

        const outlineClick = metro_svg.append("path")
            .attr("fill", "#9ad1d4")
            .attr("stroke", "black")
            .attr("pointer-events", "none");

        g_metros.selectAll("path")
            .data(msa.features)
            .enter().append("path")
            .attr("d", projPath)
            .attr("class", "metro-path")
                .style("fill", fillColor)
                .style("stroke", d => Object.keys(data).includes(d.properties.name) ? "black" : "none")
                .on("mouseover", showTooltip)
                .on("mousemove", moveTooltip)
                .on("mouseout", d => tooltip.style("visibility", "hidden"))
                .on("click", function(d) {
                    metro_name = d.properties.name;
                    const node = metro_svg.node();
                    node.value = selected_metro = selected_metro === metro_name ? null : metro_name;
                    node.dispatchEvent(new CustomEvent("input"));
                    outlineClick.attr("d", selected_metro ? projPath(d) : null)
                    if (selected_metro === metro_name) {
                        tooltip.style("background", "#9ad1d4")
                               .style("color", "black");
                    } else {
                        tooltip.style("background", data[d.properties.name].color)
                               .style("color", "white");
                    }
                });

    }

    // // START SANKEY ---------------------------------------------
    // function drawSankey() {
    //     opt_sankey_data = filter(opt_data, "Metro area", selected_metro)[0]

    //     const nodeWidth = 15;
    //     console.log(d3.sankey)
    //     var mySankey = d3.sankey()
    //         .nodeWidth(120)
    //         .nodePadding(110)
    //         .size([[margin.left, margin.top], [sankeyWidth - margin.left, sankeyHeight - margin.top]]);
    //     console.log(mySankey)

    //     const data = {
    //         nodes: [{"name": "Studied in this MSA"},
    //                 {"name": "Other MSAs"},
    //                 {"name": "Did OPT in this MSA"}
    //             ],
    //         links: [
    //             {source: 0, target: 2, value: (+opt_sankey_data["Number who attended school in this area"] - +opt_sankey_data["Number who left area for work"])},
    //             {source: 0, target: 1, value: +opt_sankey_data["Number who left area for work"]},
    //             {source: 1, target: 2, value: +opt_sankey_data["Number who entered area for work"]}
    //             ]
    //     };

    //     const graph = mySankey(data);

    //     const link = sankey_svg.append("g")
    //         .attr("fill", "none")
    //         .attr("stroke-opacity", 0.5)
    //         .selectAll("g")
    //         .data(graph.links)
    //         .enter().append("g")
    //             .style("stroke", "#9ad1df");

    //     const node = sankey_svg.append("g")
    //         .selectAll("g")
    //         .data(graph.nodes)
    //         .enter()
    //         .append("g")
    //         .attr("transform", d => 'translate(${d.x0}, ${d.y0})');

    //     node.append("rect")
    //         .attr("x", d => (console.log(d), d.x0))
    //         .attr("y", d => d.y0)
    //         .attr("height", d => d.y1 - d.y0)
    //         .attr("width", d => d.x1 - d.x0)
    //         .style("fill", function(d) {
    //             if (d.index == 0) {
    //                 return "#817e9f"
    //             } else if (d.index == 1) {
    //                 return "#BA1200"
    //             } else {
    //                 return "#274C77"
    //             }
    //         });

    //     node.attr("cursor", "move")
    //         .call(d3.drag()
    //             .on("start", dragStart)
    //             .on("drag", dragMove)
    //             .on("end", dragEnd));

    //     const path = link.append("path")
    //         .attr("d", d3.sankeyLinkHorizontal())
    //         //.attr('transform', d => `translate(${d.x0}, ${d.y0 + 200})`)
    //         .attr("stroke", d => d.uid)
    //         .attr("stroke", d =>`translate(${d.x0}, ${d.y0})`)
    //         .style("stroke", "#9AD1DF")
    //         .attr("stroke-width", d => Math.max(1, d.width));

    //     node.append("text")
    //         .attr("class", "texts")
    //         .attr("x", function(d){
    //             if(d.index==0) {
    //                 return -115 + (d.x1 - d.x0)
    //             } else if (d.index==1) {
    //                 return -93 + (d.x1 - d.x0)
    //             } else {
    //                 return 110;
    //             }})
    //         .attr("y", d => (d.y1 - d.y0) / 2)
    //         .attr("dy", "0.35em")
    //         .attr("text-anchor", d => d.x0 < sankeyWidth / 2 ? "start" : "end")
    //         .attr('font-size', 12)
    //         .attr('fill',"#FFFFFF")
    //         .text(d => d.name);


    //     function dragStart (d) {
    //         // this.parentNode.appendChild(this);
    //         // if (this.nextSibling) this.parentNode.appendChild(this);

    //         if (!d.__x) d.__x = d3.event.x;
    //         if (!d.__y) d.__y = d3.event.y;
    //         if (!d.__x0) d.__x0 = d.x0;
    //         if (!d.__y0) d.__y0 = d.y0;
    //         if (!d.__x1) d.__x1 = d.x1;
    //         if (!d.__y1) d.__y1 = d.y1;
    //     }

    //     function dragMove(d) {
    //         d3.select(this)
    //             .attr('transform', function (d) {
    //             const dx = d3.event.x - d.__x;
    //             const dy = d3.event.y - d.__y;
    //             d.x0 = d.__x0 + dx;
    //             d.x1 = d.__x1 + dx;
    //             d.y0 = d.__y0 + dy;
    //             d.y1 = d.__y1 + dy;

    //             // 防止超出边界
    //             if (d.x0 < 0) {
    //                 d.x0 = 0;
    //                 d.x1 = nodeWidth;
    //             }
    //             if (d.x1 > sankeyWidth) {
    //                 d.x0 = sankeyWidth - nodeWidth;
    //                 d.x1 = sankeyWidth;
    //             }
    //             if (d.y0 < 0) {
    //                 d.y0 = 0;
    //                 d.y1 = d.__y1 - d.__y0;
    //             }
    //             if (d.y1 > height) {
    //                 d.y0 = height - (d.__y1 - d.__y0);
    //                 d.y1 = height;
    //             }
    //             console.log(`translate(${d.x0}, ${d.y0})`)
    //             return `translate(${d.x0}, ${d.y0})`;
    //         });
    //             mySankey.update(graph);
    //             path.attr('d', d3.sankeyLinkHorizontal());
    //     }

    //     function dragEnd(d) {
    //         delete d.__x;
    //         delete d.__y;
    //         delete d.__x0;
    //         delete d.__x1;
    //         delete d.__y0;
    //         delete d.__y1;
    //     }
    // }

    // g_metros.on("click", function(d) {
    //     if (selected_metro != null) {
    //         drawSankey();
    //         d3.select("#sankey").style("visibility", "visible");
    //     } else {
    //         d3.select("#sankey").style("visibility", "hidden");
    //     }
    // });

}) // End loading of H1B data
}) // End loading of MSA topojson
}) // End loading of USA topojson
}) // End loading of OPT data