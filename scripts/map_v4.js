var countriesISO;
var trackEarnings;
var width = 960;
var height = 580;

var color = d3.scaleOrdinal(d3.schemeCategory10);

var projection = d3.geoKavrayskiy7()
	.scale(170)
  .translate([width / 2, height / 2])
	.precision(.1);

var path = d3.geoPath()
  .projection(projection);

var graticule = d3.geoGraticule();

var svg = d3.select("body")
	.append("svg")
	.attr('width', width)
	.attr('height', height);

svg.append("defs").append("path")
    .datum({type: "Sphere"})
    .attr("id", "sphere")
    .attr("d", path)
		.attr("fill", "#b8c1da");

svg.append("use")
    .attr("class", "stroke")
    .attr("xlink:href", "#sphere");

svg.append("use")
    .attr("class", "fill")
    .attr("xlink:href", "#sphere");

svg.append("path")
	.datum(graticule)
	.attr("class", "graticule")
	.attr("d", path);

var url = "../data/world-50m.json"

svg.append("path")
	.datum(graticule)
	.attr("class", "graticule")
	.attr("d", path);

d3.queue()
	.defer(d3.json, '../data/iso_3166_country_codes.json')
	.defer(d3.json, '../data/world-50m.json')
	.defer(d3.json, '../data/log_earnings_2012.json')
	.await(mainMap);

function zeroPad(num, places) {
	var zero = places - num.toString().length + 1;
	return Array(+(zero > 0 && zero)).join("0") + num;
}

function mainMap(error, iso_3166_country_codes, world, earnings){
	countriesISO = iso_3166_country_codes;
	var countries = topojson.feature(world, world.objects.countries).features;

	var max_earnings = d3.max(d3.values(earnings));
	var min_earnings = d3.min(d3.values(earnings));
	var colorScale = d3.scaleSequential(d3.interpolateOrRd)
		.domain([min_earnings - 2, max_earnings * 1.4]);
	
	svg.selectAll(".country")
		.data(countries)
		.enter()
		.insert("path", ".graticule")
		.attr("class", "country")
		.attr("d", path)
		.style("fill", function(d, i) {
        var countryName = iso_3166_country_codes[zeroPad(d.id, 3)];
				color = earnings[countryName] ? colorScale(earnings[countryName]) : 'white';
				return color
			})
		.style("stroke", 'black')
		.style("stroke-width", '0.2')
		.on("click", update);

  svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

}

d3.queue()
	.defer(d3.json, '../data/track_earnings_2012_top_5.json')
	.await(earningsBox);

function update(countryFeature){
	var countryName = countriesISO[zeroPad(countryFeature.id, 3)];
	var earnings = trackEarnings[countryName];
	var songsBox = d3.select("#songs_box");
	songsBox.style("visibility", "visible");
	songsBox.selectAll("h2")
		.data([countryName])
		.text(countryName);
	
	var songBoxSvg = d3.select("#song_box_svg .bars");
	var max_earnings = earnings[0].earnings
	var min_earnings = earnings[earnings.length-1].earnings
	
	var margin = {top: 20, right: 20, bottom: 30, left: 100};
	var width = 300,
			height = 200;
	
	var xScale = d3.scaleLinear()
		.domain([0, max_earnings])
		.range([0, width - margin.left - margin.right]);
	var yScale = d3.scaleBand()
		.domain(earnings.map(function(d, i) {return d.name}))
		.rangeRound([0, height - margin.top - margin.bottom])
		.padding(0.1);
	
	var rect = songBoxSvg.selectAll("rect")
		.data(trackEarnings[countryName]);

	rect.exit().remove();
	var rectEnter = rect.enter().append("rect");
	rect.transition().duration(500).attr('x', 0)
		.attr('width', function(d, i){return xScale(d.earnings)})
		.attr('y', function(d, i){return yScale(d.name)})
		.attr('height', yScale.bandwidth);
	rectEnter.transition().duration(500).attr('x', 0)
		.attr('width', function(d, i){return xScale(d.earnings)})
		.attr('y', function(d, i){return yScale(d.name)})
		.attr('height', yScale.bandwidth);

	var yAxis = d3.select("#song_box_svg .axis--y");
	yAxis.call(d3.axisLeft(yScale).ticks(10, "%"));
}

function earningsBox(error, earnings){
  trackEarnings = earnings;
	var earnings = earnings.Australia
	songs_box = d3.select("body")
		.append("div")
		.attr("id", "songs_box")
		.style("visibility", "hidden");

	songs_box.selectAll("h2")
		.data(['foobar'])
		.enter()
		.append("h2")
		.text("foobarbaz");

	max_earnings = earnings[0].earnings
	min_earnings = earnings[earnings.length-1].earnings
	
	var margin = {top: 20, right: 20, bottom: 30, left: 100};
	var width = 300,
			height = 200;
	
	var xScale = d3.scaleLinear()
		.domain([0, max_earnings])
		.range([0, width - margin.left - margin.right]);
	var yScale = d3.scaleBand()
		.domain(earnings.map(function(d, i) {return d.name}))
		.rangeRound([0, height - margin.top - margin.bottom])
		.padding(0.1);

	countryBox = songs_box.append('svg')
		.attr("width", width)
		.attr("height", height)
		.attr("id", "song_box_svg");

	var g = countryBox.append("g")
		.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

	yAxis = g.append("g")
		.attr("class", "axis, axis--y")
		.call(d3.axisLeft(yScale).ticks(10, "%"))
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", "0.71em")
		.attr("text-anchor", "end")
		.text("a");
	
	bars = g.append("g")
		.attr("class", "bars");

	bars.selectAll('rect')
		.data(earnings)
		.enter()
		.append('rect')
		.attr('x', 0)
		.attr('width', function(d, i){return xScale(d.earnings)})
		.attr('y', function(d, i){return yScale(d.name)})
		.attr('height', yScale.bandwidth);
}

d3.select(self.frameElement).style("height", height + "px");
