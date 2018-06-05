function update(name, d)  {
	var filter = filters[name];
	 var set = keys[name];
	 if (d) {
		 if (set.has(d.data.key)) {
			 set.delete(d.data.key);
		 } else {
			 set.add(d.data.key);
		 }
	 } else {
		 set.clear();
	 }
	 if (set.size == size[name]) {
		 set.clear();
	 }
	 if (set.size == 0) {
		 filter.filterAll();
	 } else {
		 filter.filter(function(d){
			 var sp = d.split(",");
			 if (sp.length == 1) {
				 return set.has(d);
			 } else {
				 var result = false;
				 sp.forEach(function(s){
					 if (set.has(s)) {
						 result = true;
					 }
				 })
				 return result;
			 }
		 });
	 }
	 d3.map(tags).keys().forEach(function(name) {
		d3s[name].refresh(name);
	});

	table.refresh();
}

function newPieChart (options) {
	var color = d3.scaleOrdinal(d3.schemeCategory10);
	var animationDuration = 700;
	var innerRadius = 0;
	var outerRadius = 100;
	var labelMargin = 50;
	var arc = d3.arc()
		.outerRadius(outerRadius)
		.innerRadius(innerRadius);
	var labelArc = d3.arc()
		.outerRadius(outerRadius - labelMargin)
		.innerRadius(outerRadius - labelMargin);

	var title = null;
	var dom = null;
	var data = [];

	var pie = d3.pie()
		.sort(null)
		.value(function (d) {
			return d.value;
	});

	function updateTween (d) {
		var interpolate = d3.interpolate(this._current, d);
		this._current = interpolate(0);
		return function(t) {
			return arc(interpolate(t));
		};
	}

	function exitTween (d) {
		var end = Object.assign({}, this._current, { startAngle: this._current.endAngle });
		var interpolate = d3.interpolate(d, end);
		return function(t) {
			return arc(interpolate(t));
		};
	}

	function joinKey (d) {
		return d.data.key;
	}

	function pieChart (context) {
		var fans = context.selectAll(".fan").data(pie(data), joinKey);
		var oldFans = fans.exit();
		var newFans = fans.enter()
			.append("path")
			.each(function(d) { this._current = Object.assign({}, d, { startAngle: d.endAngle }); })
			.classed("fan", true)
			.style("fill", function (d) { return color(joinKey(d)); });

		fans
			.transition()
			.duration(animationDuration)
			.attrTween("d", updateTween);
		oldFans
			.transition()
			.duration(animationDuration)
			.attrTween("d", exitTween)
			.remove();
		newFans
			.transition()
			.duration(animationDuration)
			.attrTween("d", updateTween);

		var texts = context.selectAll(".label").data(pie(data), joinKey);
		var newTexts = texts.enter()
			.append("text")
			.attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
			.style("text-anchor", "middle")
			.attr("opacity", 0)
			.classed("label", true)
			.text(function(d) {
				var sum = d3.sum(data.map(function(d){return d.value;}));
				if (d.data.value == 0) {
					return null;
				} else if (d.data.value/sum <0.01 ) {
					return null;
				} else {
					return d.data.key;
				}
			})

		newTexts.transition()
			.duration(animationDuration)
			.attr("opacity", 1.0);
		texts
			.attr("opacity", function(d){return 0;})
			.attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
			.transition()
			.duration(function(d){
				if (d.value) {
					return animationDuration;
				} else {
					return 0;
				}
			})
			.attr("opacity", function(d){
				if (d.value) {
					return 1.0;
				} else {
					return 0;
				}
			});
		texts.exit()
			.transition()
			.duration(0)
			.attr("opacity", 0)
			.remove();

		newFans.on("click", function(d){update(title, d);});

		context.selectAll(".list").remove();

		var list =context.append("g")
			.attr("transform", "translate(100, -80)")
			.classed("list", true);

		var item = list.selectAll(".item")
			.data(pie(data))
			.enter()
			.append("g")
			.classed("item", "true")
			.attr("transform", function(d, i) {
				return "translate(" + (20 +280 * Math.floor(i / 11)) + "," + 18 * (i % 11) + ")";
			});

		var rectWidth = 180;
		if (data.length > 11) {
			rectWidth = 270;
		}
		item.append("rect")
			.attr("width", rectWidth)
			.attr("height", 14)
			.attr("transform", function(d, i) { return "translate(0, -16)"; })
			.attr("fill", function(d){return "#64B5F6"})
			.attr("opacity", function(d){
				var key = keys[title];
				if (key.has(d.data.key)) {
					return "1.0"
				} else {
					return "0"
				}
			});

		item.append("rect")
			.attr("width", 10)
			.attr("height", 10)
			.attr("transform", function(d, i) { return "translate(2, -14)"; })
			.attr("fill", function(d){return color(joinKey(d))});

		var name = item.append("text")
			.attr("transform", function(d, i) { return "translate(15, -5)"; })
			.classed("name", true)
			.text(function(d){return d.data.key});

		var valueLeft = 100;
		if (data.length > 11) {
			valueLeft = 190;
		}
		var value = item.append("text")
			.attr("transform", function(d, i) { return "translate(" + valueLeft + ", -5)"; })
			.classed("value", true)
			.text(function(d){return d.data.value});

		var percentageLeft = 130;
		if (data.length > 11) {
			percentageLeft = 220;
		}
		var percentage = item.append("text")
			.attr("transform", function(d, i) { return "translate(" + percentageLeft + ", -5)"; })
			.classed("percentage", true)
			.text(function(d){
				var sum = d3.sum(data.map(function(d){return d.value;}));
				if (sum == 0) {
					return null;
				} else {
					return d3.format(".1%")(d.value/sum);
				}
			});
		item.on("click", function(d){update(title, d);});
	}

	 function mergeWeapon(org){
		 var data = {};
		 org.forEach(function(d){
			var s = d.key.split(",");
			s.forEach(function(s){
				if (data[s]) {
					data[s] = data[s] + d.value;
				 } else {
					 data[s] = d.value;
				 }
			 })
		 })
		 var array = [];
		 for (key in data) {
			 array.push({"key": key, "value": data[key]});
		 }
		 return array;
	 }


	pieChart.data = function (_) {
		return arguments.length ? (data = _, chart) : data;
	};

	pieChart.create = function(name){

		title = name;

		var width = 450;
		var height = 200;

		var id = tags[name];
		var dimen = dimens[name];

		var data = dimen.group().top(Infinity);
		if (name == "得意武器") {
			data = mergeWeapon(data);
		}
		if (data.length > 11) {
			width = 800;
		}

		// タイトル
		d3.select(id).append("div")
				.append("p")
				.classed("title", true)
				.text(name)
				.on("click", function(d){update(title);});

		// SVG領域の作成
		var svg = d3.select(id).append("svg")
			.attr("width", width)
			.attr("height", height);

		dom = svg.append("g")
			.classed("fans", true)
			.attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

		dom.call(chart.data(data));

		return chart;
	}

	pieChart.refresh = function(name) {
		var data = dimens[name].group().top(Infinity);
		if (name == "得意武器") {
			data = mergeWeapon(data);
		}

		dom.call(chart.data(data));
		return chart;
	}

	var chart = pieChart;
	return chart;
}

function createTable(data){
	 var table = d3.select("#table").append("table").attr("class", "table");
	 var thead = table.append("thead");
	 var tbody = table.append("tbody");

	 var headers= d3.map(data[0]).keys();

	 var $th = thead.append("tr")
		.selectAll("th")
		.data(headers)
		.enter()
		.append("th")
		.append("span")
		.text(function(key){return key});

	 var refresh = function(){

		 var top = tableDimen.top(Infinity);

		tbody.selectAll("tr")
		.remove();

		 $td = tbody.selectAll("tr")
			 .data(top)
			 .enter()
			.append("tr")
			.selectAll("td")
			.data(function (row) {
				return d3.entries(row) })
			.enter()
			.append("td")
			.text(function(d){ return d.value });
	 }

	 refresh();
	 return {refresh: refresh};
}

var tags = {"陣営": "#chart_realm", "ﾚｱ度": "#chart_rare", "艦種": "#chart_type", "装甲": "#chart_armor" };

var dimens = {};
var filters = {};
var d3s = {};
var keys = {};
var size = {}
var table = null;
var tableDimen = null;

d3.csv("./data/azurlane.csv").then(function(data) {

	var cf = crossfilter(data);
	tableDimen = cf.dimension(function(p) { return -Number(p["No."]); });

	var names = d3.map(tags).keys();
	names.forEach(function(name) {
		 dimens[name] = cf.dimension(function(p) { return p[name]; });
		 filters[name] = cf.dimension(function(p) { return p[name]; });
		 d3s[name] = newPieChart();
		 keys[name] = new Set();
		 size[name] = dimens[name].group().all().length;
		d3s[name].create(name);
	});
	table = createTable(data);
});
