const mapWidth = 1000;
const mapHeight = 600;

const height = 300;
const width = 975;
const margin = {top: 10, right: 10, bottom: 20, left: 40};

const niv_svg = d3.select("div#niv-chart")
                  .append("div")
                  .classed("svg-container", true) //container class to make it responsive
                  .append("svg")
                  .attr("preserveAspectRatio", "xMidYMid meet")
                  .attr("viewBox", "0 0 975 300")
                  .classed("svg-content-responsive", true);
const sevis_svg = d3.select("div#sevis-chart")
                  .append("div")
                  .classed("svg-container", true) //container class to make it responsive
                  .append("svg")
                  .attr("preserveAspectRatio", "xMidYMid meet")
                  .attr("viewBox", "0 0 975 300")
                  .classed("svg-content-responsive", true);
const world_svg = d3.select("div#world-select")
                  .append("div")
                  .classed("svg-container", true) //container class to make it responsive
                  .append("svg")
                  // .attr("preserveAspectRatio", "xMidYMid meet")
                  .attr("viewBox", "0 0 1000 600")
                  .classed("svg-content-responsive", true);

const degrees = ["VOCATIONAL", "LANGUAGE TRAINING", "ASSOCIATE", "BACHELOR'S", "MASTER'S", "DOCTORATE"];
const visas = ["h_1b","f_1", "j_1", "m_1"];

const niv_color_scheme = ({
  'M_1': "#BA1200",
  'J_1': "#9ad1d4",
  'F_1': "#274C77",
  'H_1B': "#817E9F"
});

const sevis_color_scheme = ({
  'DOCTORATE': "#203F62",
  'MASTER\'S': "#274C77",
  'BACHELOR\'S': "#4E6C8F",
  'ASSOCIATE': "#899DB4",
  'LANGUAGE TRAINING': "#C4CED9",
  'VOCATIONAL': niv_color_scheme['M_1']
});



function filter(dataframe, field, search_term) {
  output = [];
  dataframe.forEach(function(row) {
    if (row[field] == search_term) { output.push(row) }
  });
  return output;
}


function mouseoverHighlight(elemData) {
var key = elemData.key.toLowerCase().replace("\'", "").replace(" ","-");

  d3.select("#path-"+key)
    .attr("stroke", "#e7eeef")
    .attr("stroke-width", "5px")
    .attr("z-index", 100);

  d3.select("#legend-"+key)
    .attr("stroke", "#e7eeef")
    .attr("stroke-width", "3px");
  }

function mouseoutHighlight(elemData) {
  var key = elemData.key.toLowerCase().replace("\'", "").replace(" ","-");

  d3.select("#path-"+key)
    .attr("stroke", "none")
    .attr("z-index", "initial");

  d3.select("#legend-"+key)
    .attr("stroke", "none");
}

d3.json("https://gist.githubusercontent.com/jk979/e36a0b630a3f9565e7c2aeeaba002984/raw/e01abe1dc330e28484dbaafd44a7f2ae62f802ba/countries_110.json").then(
function(data) {
var world_topo = data;

projection = d3.geoEquirectangular()
	.scale(160)
	.translate([mapWidth/2, mapHeight/2])
	.precision(0.1);

geoPath = d3.geoPath().projection(projection);

d3.csv('https://gist.githubusercontent.com/jk979/a1c394355e2cf1874ca0ac6ee609107b/raw/4215d6114baae284641d7e6fe1afb374818fcf31/world-countries-flags.csv').then(
function(data) {

var flags_csv = data;

d3.csv("https://gist.githubusercontent.com/nbailey/2d8027ea9158b4bac7466672f0639041/raw/2ba3e99da682bf091942446009c94975636ced22/sevis_2014_to_2019.csv").then(
function(data) {
var sevis_data = data

let flag_array = []
for(let i=0; i<flags_csv.length; i++){
	//add a column with the parsed flag name
	let name = {name:(flags_csv[i].url).substring((flags_csv[i].url).lastIndexOf("/") + 1, (flags_csv[i].url).lastIndexOf(".")).slice(8).replace(/_/g," "),url:flags_csv[i].url}
	flag_array.push(name)
}

rerun_sorted = flag_array.sort(function(a, b) {
    var textA = a.name.toUpperCase();
    var textB = b.name.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
});

rerun_sorted[195].name = "The Bahamas"
rerun_sorted[199].name = "Central African Republic"
rerun_sorted[201].name = "Comoros"
rerun_sorted[203].name = "Czech Republic"
rerun_sorted[204].name = "Democratic Republic of the Congo"
rerun_sorted[206].name = "Dominican Republic"
rerun_sorted[211].name = "Gambia"
rerun_sorted[213].name = "Marshall Islands"
rerun_sorted[214].name = "Netherlands"
rerun_sorted[216].name = "China"
rerun_sorted[217].name = "Philippines"
rerun_sorted[219].name = "Taiwan"
rerun_sorted[221].name = "Solomon Islands"
rerun_sorted[223].name = "United Arab Emirates"
rerun_sorted[224].name = "United Kingdom"
rerun_sorted[225].name = "United States of America"
rerun_sorted[228].name = "Vatican City"
rerun_sorted[92].name = "Burundi"
rerun_sorted[193].name = "United Republic of Tanzania"

var country = null;
var active = d3.select(null);

var centered;

var map_g = world_svg.append("g");
var countries = topojson.feature(world_topo, world_topo.objects.ne_110m_admin_0_countries).features;

var map_title = world_svg.append("text")
	.attr("x", mapWidth/2 - 400)
	.attr("y", mapHeight * 3/5 - 20)
	.attr("fill", "white");

var flag = world_svg.append("image")
	.attr("width", 150)
	.attr("height", 75)
	.attr("x", mapWidth/2 - 400)
	.attr("y", mapHeight * 3/5)
	.attr("preserveAspectRatio", "none")
	.style("border", "0.1px solid black");

const outline = world_svg.append("path")
	.attr("stroke", "green")
	.attr("stroke-width", "0.1px")
	.attr("stroke-linejoin", "round")
	.attr("fill", "green")
	.attr("pointer-events", "none");

const outlineClick = world_svg.append("path")
	.style("fill", "red")
	.style("stroke", "red")
	.style("stroke-width", "0.1px")
	.style("stroke-linejoin", "round")
	.style("pointer-events", "none");

function prettifyCountryName(country) {
	return country
			.toLowerCase()
			.replace(" ","-")
			// the next 3 are for Democratic Republic of the Congo for some reason ?!?!?!
			.replace(" ","-")
			.replace(" ","-")
			.replace(" ","-");
}

world_svg.selectAll("country")
	.data(countries)
	.enter().insert("path", ".graticule")
	.attr("class", d => "country")
	.attr("id", d => prettifyCountryName(d.properties.ADMIN) + "-path")
	.attr("d", geoPath)
	.attr("opacity", 1)
	.style("fill", "#e7eeef")
	.on("click", function (d) {
		console.log(d);
		country_name = d.properties.ADMIN;
		const node = world_svg.node();
		if (country) {
			oldPath = d3.select("#" + prettifyCountryName(country) + "-path")
			oldPath.style("fill", "#e7eeef");
		}
		node.value = country = country === country_name ? null : country_name;
		node.dispatchEvent(new CustomEvent("input"));
		countryPath = d3.select("#" + prettifyCountryName(country_name) + "-path")
		countryPath.style("fill", "#ba1200");
		// outlineClick.attr("d", country ? (console.log(d), geoPath(d)) : null);
		map_title.text(country_name);
		var for_graph = rerun_sorted.filter(p => p.name == country_name)[0].name;
		var for_graph_url = rerun_sorted.filter(p => p.name == country_name)[0].url;
		console.log(for_graph_url);
		flag.attr("xlink:href", for_graph_url);
	})

function clicked(d) {
	var x, y, k;
	if (d && centered !== d) {
		var centroid = geoPath.centroid(d);
		x = centroid[0];
		y = centroid[1];
		k = 4;
		centered = 4;
	} else {
		x = mapWidth / 2;
		y = mapHeight / 2;
		k = 1;
		centered = null;
	}
}

world_svg.append("g")

d3.csv(
  'https://gist.githubusercontent.com/nbailey/3e1c303416cc815d6aa3cbebc21decfb/raw/50318c6faa6ab27fee40f0c75b2c6c19695239e9/niv_all.csv',
  ({year,continent,country,a_1, a_2, a_3, b_1, b_1_b2, b_2, b_1_2_bcc, b_1_2_bcv, c_1, c_1_d, c_2, c_3, cw_1, cw_2, d, d_crew,
    e_1, e_2, e_2c, e_3, e_3d, f_1, f_2, f_3, g_1, g_2, g_3, g_4, g_5, h_1a, h_1b, h_1b1, h_1c, h_2a, h_2b, h_3, h_4, i, j_1,
    j_2, k_1, k_2, k_3, k_4, l_1, l_2, m_1, m_2, m_3, nato_1, nato_2, nato_3, nato_4, nato_5, nato_6, nato_7, n_8, n_9, o_1,
    o_2, o_3, p_1, p_2, p_3, p_4, q_1, q_2, q_3, r_1, r_2, s_5, s_6, s_7, tn, td, t_1, t_2, t_3, t_4, t_5, t_6, u_1, u_2, u_3,
    u_4, u_5, v_1, v_2, v_3, total_visas, bcc}) =>
  ({year: +year, continent, country,a_1: +a_1, a_2: +a_2, a_3: +a_3, b_1, b_1_b2, b_2, b_1_2_bcc, b_1_2_bcv, c_1, c_1_d, c_2, c_3,
    cw_1, cw_2, d, d_crew, e_1, e_2, e_2c, e_3, e_3d, f_1:+f_1, f_2, f_3, g_1, g_2, g_3, g_4, g_5, h_1a, h_1b:+h_1b,h_1b1, h_1c,
    h_2a, h_2b, h_3, h_4, i, j_1:+j_1, j_2, k_1, k_2, k_3, k_4, l_1, l_2, m_1:+m_1, m_2, m_3, nato_1, nato_2, nato_3, nato_4, nato_5,
    nato_6, nato_7, n_8, n_9, o_1, o_2, o_3, p_1, p_2, p_3, p_4, q_1, q_2, q_3, r_1, r_2, s_5, s_6, s_7, tn, td, t_1, t_2, t_3,
    t_4, t_5, t_6, u_1, u_2, u_3, u_4, u_5, v_1, v_2, v_3, total_visas:+total_visas, bcc})
  ).then(function(data) {
    var niv_data = data

    niv_total_data = [];
    sevis_total_data = [];

    // NIV data is annual so each unique date in the dataset represents a year's data for each country
    niv_dates = [];
    niv_data.forEach(r => niv_dates.includes(r.year) ? 0 : niv_dates.push(r.year));

    console.log(niv_dates)

    for (var i in niv_dates) {
    	var year = niv_dates[i];

    	var total_f1 = 0;
    	var total_m1 = 0;
    	var total_j1 = 0;
    	var total_h1b = 0;

    	niv_data.forEach(function(r) {
    		if (r.year == year) {
    			total_f1 += r.f_1;
    			total_m1 += r.m_1;
    			total_j1 += r.j_1;
    			total_h1b += r.h_1b;
    		}
    	});

    	niv_total_data.push({
    		Date: new Date(Date.parse(+year + 1, "YYYY")),
    		f_1: total_f1,
    		j_1: total_j1,
    		m_1: total_m1,
    		h_1b: total_h1b
    	});

    	console.log({Date: year, f_1: total_f1, j_1: total_j1, m_1: total_m1, h_1b: total_h1b});
    }

    console.log(niv_total_data);

    var sevis_dates = [];
    sevis_data.forEach(r => sevis_dates.includes(r.Time) ? 0 : sevis_dates.push(r.Time));

    for (var i in sevis_dates) {
    	var year = sevis_dates[i];

    	var sevis_totals = {};
    	degrees.forEach(degree => sevis_totals[degree] = 0);

    	sevis_data.forEach(function(r) {
    		if (r.Time == year) {
    			degrees.forEach(d => d != "VOCATIONAL" ? sevis_totals[d] += +r[d] : 0);
    			sevis_totals["VOCATIONAL"] += +r["FLIGHT TRAINING"] + +r["OTHER VOCATIONAL SCHOOL"];
    		}
    	});

    	var output = {};
    	output.Date = new Date(Date.parse(year, "YYYY-MM"));
    	degrees.forEach(d => output[d] = sevis_totals[d]);
    	sevis_total_data.push(output);
    }

    sevis_total_data.sort((a, b) => a.Date < b.Date);

    var sevis_series = d3.stack().keys(degrees)(sevis_total_data);

    var niv_series = d3.stack().keys(visas)(niv_total_data);

    var all_dates = [];
    sevis_total_data.forEach(r => (all_dates.push(r.Date)));
    niv_total_data.forEach(r => (all_dates.push(r.Date)));
    var dateDomain = d3.extent(all_dates);
    var dateScale = d3.scaleTime()
      .domain(dateDomain)
      .range([margin.left, width-margin.right]);

    var niv_y = d3.scaleLinear()
    //nested max: looping through series to find the max of the total
      .domain([0, d3.max(niv_series, d => d3.max(d, d => d[1]))]) //dynamic range
      .rangeRound([height - margin.bottom, margin.top]) //height of svg - bottom margin

    var sevis_y = d3.scaleLinear()
    //nested max: looping through series to find the max of the total
      .domain([0, d3.max(sevis_series, d => d3.max(d, d => d[1]))]) //dynamic range
      .rangeRound([height - margin.bottom, margin.top]) //height of svg - bottom margin

    var niv_area = d3.area()
    // .curve(d3.curveCatmullRom.alpha(1))
      .curve(d3.curveMonotoneX)
      .x(d => dateScale(d.data.Date))
      .y0(d => niv_y(d[0]))
      .y1(d => niv_y(d[1]))

    var sevis_area = d3.area()
    // .curve(d3.curveCatmullRom.alpha(1))
      .curve(d3.curveMonotoneX)
      .x(d => dateScale(d.data.Date))
      .y0(d => sevis_y(d[0]))
      .y1(d => sevis_y(d[1]))

    nivDateAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(d3.scaleTime()
          .domain(d3.extent(niv_total_data, d=>d.Date))
          .range([margin.left, dateScale(d3.max(niv_total_data, d=>d.Date))])
        ).ticks(width / 100).tickSizeOuter(0))

    sevisDateAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(d3.scaleTime()
          .domain(d3.extent(sevis_total_data, d=>d.Date))
          .range([dateScale(d3.min(sevis_total_data, d=>d.Date)), width-margin.right])
        ).ticks(width / 100).tickSizeOuter(0))

    var nivYAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .attr("id", "niv-y-axis")
      .call(d3.axisLeft(niv_y).ticks(null, "s"))
      .call(g => g.selectAll(".domain").remove())

    var sevisYAxis = g => g
      .attr("transform", `translate(${dateScale(d3.min(sevis_total_data, d=>d.Date))},0)`)
      .attr("id", "sevis-y-axis")
      .call(d3.axisLeft(sevis_y).ticks(null, "s"))
      .call(g => g.selectAll(".domain").remove())

    var niv_color = d3.scaleOrdinal()
      .domain(niv_series.map(d => d.key)) //reassembling array of the categories (key is the type)
      .range(Object.values(niv_color_scheme).reverse())
      .unknown("#ccc")

    var sevis_color = d3.scaleOrdinal()
      .domain(sevis_series.map(d => d.key)) //reassembling array of the categories (key is the type)
      .range(Object.values(sevis_color_scheme).reverse())
      .unknown("#ccc") //return the corresponding hex code, but if there's an unmatched key, color it gray

    var niv_legend = svg => {
      const g = svg //creating SVG for the legend
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .attr("transform", `translate(${width - margin.right},${margin.top})`)
        .selectAll("g")
        .data(niv_series.slice().reverse())
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

      g.append("rect")
        .attr("x", -19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => niv_color(d.key)) //put keys into color function
        .attr("id", d => "legend-" + d.key.toLowerCase().replace("\'", "").replace(" ","-"))
        .on("mouseover", mouseoverHighlight)
        .on("mouseout", mouseoutHighlight)

      g.append("text")
        .attr("x", -24)
        .attr("y", 9.5)
        .attr("dy", "0.5em")
        .attr("fill", "white")
        .text(d => d.key.toUpperCase().replace("_", "-"));
      //text.(replace("_","-"));
    }

    var sevis_legend = svg => {
      const g = svg //creating SVG for the legend
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .selectAll("g")
        .data(sevis_series.slice().reverse())
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 30})`);

      g.append("rect")
        .attr("x", 0)
        .attr("width", 25)
        .attr("height", 25)
        .attr("fill", d => sevis_color(d.key)) //put keys into color function
        .attr("id", d => "legend-" + d.key.toLowerCase().replace("\'", "").replace(" ","-"))
        .on("mouseover", mouseoverHighlight)
        .on("mouseout", mouseoutHighlight)

      g.append("text")
        .attr("x", 30)
        .attr("y", 9.5)
        .attr("dy", "0.5em")
        .attr("fill", "white")
        .text(d => d.key.toUpperCase());
        //text.(replace("_","-"));
    }

    console.log(niv_series);
    console.log(sevis_series);

	niv_svg.append("g")
		.selectAll("path")
		.data(niv_series)
		.join("path")
		    .attr("fill", d => niv_color(d.key))
		    .attr("d", d => niv_area(d))
		    .attr("id", d => "path-" + d.key.toLowerCase().replace("\'", "").replace(" ","-"))
		    .on("mouseover", mouseoverHighlight)
		    .on("mouseout", mouseoutHighlight);

    niv_svg.append("g").call(nivDateAxis);
    niv_svg.append("g").call(nivYAxis);
    niv_svg.append("g").call(niv_legend);

	sevis_svg.append("g")
			.selectAll("path")
			.data(sevis_series)
			.join("path")
	    		.attr("fill", d => sevis_color(d.key))
			    .attr("d", d => sevis_area(d))
			    .attr("id", d => "path-" + d.key.toLowerCase().replace("\'", "").replace(" ","-"))
			    .on("mouseover", mouseoverHighlight)
			    .on("mouseout", mouseoutHighlight);

    sevis_svg.append("g").call(sevisDateAxis);
    sevis_svg.append("g").call(sevisYAxis);
    sevis_svg.append("g").call(sevis_legend);

    world_svg.on("click", function() {
	    var niv_country_data = filter(niv_data, "country", country);
	    var sevis_country_data = filter(sevis_data, "Country of Citizenship", country);

	    draw_immigration_series(niv_country_data, sevis_country_data);
    })

	function draw_immigration_series(niv_country_data, sevis_country_data) {
	    sevis_country_data.forEach(r => (r.Date = new Date(Date.parse(r.Time, "YYYY-MM"))));
	    sevis_country_data.forEach(r => (r.VOCATIONAL = +r["FLIGHT TRAINING"] + +r["OTHER VOCATIONAL SCHOOL"]));
	    var sevis_series = d3.stack().keys(degrees)(sevis_country_data);

	    niv_country_data.forEach(r => (r.Date = new Date(Date.parse(r.year + 1, "YYYY"))));
	    var niv_series = d3.stack().keys(visas)(niv_country_data);

	    sevis_country_data.forEach(r => (all_dates.push(r.Date)));
	    niv_country_data.forEach(r => (all_dates.push(r.Date)));

	    var niv_y = d3.scaleLinear()
	    //nested max: looping through series to find the max of the total
	      .domain([0, d3.max(niv_series, d => d3.max(d, d => d[1]))]) //dynamic range
	      .rangeRound([height - margin.bottom, margin.top]) //height of svg - bottom margin

	    var sevis_y = d3.scaleLinear()
	    //nested max: looping through series to find the max of the total
	      .domain([0, d3.max(sevis_series, d => d3.max(d, d => d[1]))]) //dynamic range
	      .rangeRound([height - margin.bottom, margin.top]) //height of svg - bottom margin

	    var niv_area = d3.area()
	    // .curve(d3.curveCatmullRom.alpha(1))
	      .curve(d3.curveMonotoneX)
	      .x(d => dateScale(d.data.Date))
	      .y0(d => niv_y(d[0]))
	      .y1(d => niv_y(d[1]))

	    var sevis_area = d3.area()
	    // .curve(d3.curveCatmullRom.alpha(1))
	      .curve(d3.curveMonotoneX)
	      .x(d => dateScale(d.data.Date))
	      .y0(d => sevis_y(d[0]))
	      .y1(d => sevis_y(d[1]))

	    var nivYAxis = g => g
	      .attr("transform", `translate(${margin.left},0)`)
	      .call(d3.axisLeft(niv_y).ticks(null, "s"))
	      .call(g => g.selectAll(".domain").remove())

	    var sevisYAxis = g => g
	      .attr("transform", `translate(${dateScale(d3.min(sevis_country_data, d=>d.Date))},0)`)
	      .call(d3.axisLeft(sevis_y).ticks(null, "s"))
	      .call(g => g.selectAll(".domain").remove())

		niv_svg.selectAll("path")
			    .data(niv_series)
	    		.join("path")
	    		.transition()
				    .attr("fill", d => niv_color(d.key))
				    .attr("d", d => niv_area(d))
				    .attr("id", d => "path-" + d.key.toLowerCase().replace("\'", "").replace(" ","-"))

		niv_svg.selectAll("path")
		    .on("mouseover", mouseoverHighlight)
		    .on("mouseout", mouseoutHighlight);

		niv_svg.select("#niv-y-axis")
			.transition()
			.call(nivYAxis);

		sevis_svg.selectAll("path")
				.data(sevis_series)
				.join("path")
				.transition()
				    .attr("fill", d => sevis_color(d.key))
				    .attr("d", d => sevis_area(d))
				    .attr("id", d => "path-" + d.key.toLowerCase().replace("\'", "").replace(" ","-"))

		sevis_svg.selectAll("path")
		    .on("mouseover", mouseoverHighlight)
		    .on("mouseout", mouseoutHighlight);

	    sevis_svg.select("#sevis-y-axis")
	    	.transition()
	    	.call(sevisYAxis);
	}


  });


}); // End d3.csv SEVIS data call
}); // End d3.csv Flag CSV call
}); // End d3.json World Topo map call