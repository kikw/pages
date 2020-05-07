function update(name, d)  {

	var selectedOnly = $('input[type="checkbox"]').prop("checked");

	if (selectedOnly) {
		selectionFilter.filter(function(d, i){
			return selectedSet.has(d);
		});
	}

	if (name) {
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
				 var sp = d.split("/");
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
	}
	 d3.map(tags).keys().forEach(function(name) {
		d3s[name].refresh(name);
	});

	selectionFilter.filterAll();
	table.refresh();
}

function newPieChart (options) {
	var color = d3.scaleOrdinal(d3.schemeCategory10);
	var animationDuration = 700;
	var innerRadius = 0;
	var outerRadius = 70;
	var labelMargin = 35;
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
				} else if (d.data.value/sum <0.03 ) {
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
			.attr("transform", "translate(70, -50)")
			.classed("list", true);

		var item = list.selectAll(".item")
			.data(pie(data))
			.enter()
			.append("g")
			.attr("height", 7)
			.classed("item", "true")
			.attr("transform", function(d, i) {
					return "translate(" + (20 +230 * Math.floor(i / 11)) + "," + 13 * (i % 11) + ")";
			})
			.on("mouseover", function(d) {
				tooltip.transition()
				.duration(200)
				.style("opacity", 1);
				var sum = d3.sum(data.map(function(d){return d.value;}));
				if (sum == 0) {
					tooltip.html(d.data.key + " キャラ数[" + d.data.value + "]")
					.style("left", (d3.event.pageX + 10) + "px")
					.style("top", (d3.event.pageY - 40) + "px");
				} else {
					tooltip.html(d.data.key + " キャラ数[" + d.data.value + "] 比率[" + d3.format(".1%")(d.value/sum) + "]")
					.style("left", (d3.event.pageX + 10) + "px")
					.style("top", (d3.event.pageY - 40) + "px");
				}
			})
			.on("mouseout", function(d) {
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
			});

		var rectWidth = 135;
		if (data.length > 11) {
			rectWidth = 215;
		}

		var tooltip = d3.select(".tooltip");

		item.append("rect")
			.attr("width", rectWidth)
			.attr("height", 11)
			.attr("transform", function(d, i) { return "translate(0, -16)"; })
			.attr("fill", function(d){return "#64B5F6"})
			.attr("opacity", function(d){
				var key = keys[title];
				if (key.has(d.data.key)) {
					return "1.0"
				} else {
					return "0"
				}
			})
;

		item.append("rect")
			.attr("width", 7)
			.attr("height", 7)
			.attr("transform", function(d, i) { return "translate(2, -14)"; })
			.attr("fill", function(d){return color(joinKey(d))});

		var name = item.append("text")
			.attr("transform", function(d, i) { return "translate(15, -7)"; })
			.classed("name", true)
			.text(function(d){return d.data.key});

		var valueLeft = 90;
		if (data.length > 11) {
			valueLeft = 170;
		}
		var value = item.append("text")
			.attr("transform", function(d, i) { return "translate(" + valueLeft + ", -7)"; })
			.classed("value", true)
			.attr("text-anchor", "end")
			.text(function(d){return d.data.value});

		var percentageLeft = 130;
		if (data.length > 11) {
			percentageLeft = 210;
		}
		var percentage = item.append("text")
			.attr("transform", function(d, i) { return "translate(" + percentageLeft + ", -7)"; })
			.classed("percentage", true)
			.attr("text-anchor", "end")
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
			var s = d.key.split("/");
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

		var width = 300;//450;
		var height = 150;//200;

		var id = tags[name];
		var dimen = dimens[name];

		var data = dimen.group().top(Infinity);
		if (name == "得意武器" || name == "種族") {
			data = mergeWeapon(data);
		}
		if (data.length > 11) {
			width = 850;
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
		if (name == "得意武器" || name == "種族") {
			data = mergeWeapon(data);
		}

		dom.call(chart.data(data));
		return chart;
	}

	var chart = pieChart;
	return chart;
}

function toggleSelection(row, index) {

	var no = row["No"];
	var count = 0;
	if (selectedSet.has(no)) {
		selectedSet.delete(no);
		count = -1;
	} else {
		selectedSet.add(no);
		count = 1;
	}

	var selectedOnly = $('input[type="checkbox"]').prop("checked");
	if (selectedOnly) {
		update();
	}

	table.refresh();

	var target = null;
	if (no > 2000) {
		target = r;
		no = no - 2000;
		rCount = rCount + count;
	} else if (no > 1000) {
		target = sr;
		no = no - 1000;
		srCount = srCount + count;
	} else {
		target = ssr;
		ssrCount = ssrCount + count;
	}

	var div = Math.floor((no-1) / 4);
	var mod = (no-1) % 4;

	target[div] = target[div] ^ (1<<mod);

	updateHash();
	updateSummary();
}

function updateSummary(){

	console.log("SSR " + ssrSum + "キャラ中 " + ssrCount + "キャラ所有 [" + d3.format(".1%")(ssrCount/ssrSum) + "]");
	console.log("SR " + srSum + "キャラ中 " + srCount + "キャラ所有 [" + d3.format(".1%")(srCount/srSum) + "]");
	console.log("R " + rSum + "キャラ中 " + rCount + "キャラ所有 [" + d3.format(".1%")(rCount/rSum) + "]");

	$("#ssr").text("SSR " + ssrCount + "/" + ssrSum + " (" + d3.format(".1%")(ssrCount/ssrSum) + ")");
	$("#sr").text("SR " + srCount + "/" + srSum + " (" + d3.format(".1%")(srCount/srSum) + ")");
	$("#r").text("R " + rCount + "/" + rSum + " (" + d3.format(".1%")(rCount/rSum) + ")");

}


function updateHash(){
	var selectedOnly = $('input[type="checkbox"]').prop("checked");
	var hash = "";
	r.forEach(function(d){
		hash = hash + d.toString(16);
	});
	hash = hash +",";
	sr.forEach(function(d){
		hash = hash + d.toString(16);
	});
	hash = hash +",";
	ssr.forEach(function(d){
		hash = hash + d.toString(16);
	});

	if (selectedOnly) {
		hash = hash +",1";
	} else {
		hash = hash +",0";
	}
	location.hash = hash;
}

var rSum = 0;
var srSum = 0;
var ssrSum = 0;
var rCount = 0;
var srCount = 0;
var ssrCount = 0;

function loadHash(data){

	var rMax = 0;
	var srMax = 0;
	var ssrMax = 0;

	data.forEach(function(d) {
		if (d["レア度"] == "R") {
			rMax = Math.max(rCount, d["No"] - 2000);
		}else if (d["レア度"] == "SR") {
			srMax = Math.max(srCount, d["No"] - 1000);
		}else if (d["レア度"] == "SSR") {
			ssrMax = Math.max(ssrCount, d["No"]);
		}
	})

	rSum = rMax;
	srSum = srMax;
	ssrSum = ssrMax;

	while (rMax > 0) {
		r.push(0);
		rMax = rMax - 4;
	}
	while (srMax > 0) {
		sr.push(0);
		srMax = srMax - 4;
	}
	while (ssrMax > 0) {
		ssr.push(0);
		ssrMax = ssrMax - 4;
	}

	var hash = location.hash.substr(1).split(",");

	if (hash.length != 4) {
		return;
	}

	hash[0].split("").forEach(function(d, index){
		var n = parseInt(d, 16);
		if ((n & 1) == 1) {
			selectedSet.add(String(index*4 + 2001));
			rCount = rCount+1;
		}
		if ((n & 2) == 2) {
			selectedSet.add(String(index*4 + 2002));
			rCount = rCount+1;
		}
		if ((n & 4) == 4) {
			selectedSet.add(String(index*4 + 2003));
			rCount = rCount+1;
		}
		if ((n & 8) == 8) {
			selectedSet.add(String(index*4 + 2004));
			rCount = rCount+1;
		}
		r[index] = n;
	});

	hash[1].split("").forEach(function(d, index){
		var n = parseInt(d, 16);
		if ((n & 1) == 1) {
			selectedSet.add(String(index*4 + 1001));
			srCount = srCount+1;
		}
		if ((n & 2) == 2) {
			selectedSet.add(String(index*4 + 1002));
			srCount = srCount+1;
		}
		if ((n & 4) == 4) {
			selectedSet.add(String(index*4 + 1003));
			srCount = srCount+1;
		}
		if ((n & 8) == 8) {
			selectedSet.add(String(index*4 + 1004));
			srCount = srCount+1;
		}
		sr[index] = n;
	});

	hash[2].split("").forEach(function(d, index){
		var n = parseInt(d, 16);
		if ((n & 1) == 1) {
			selectedSet.add(String(index*4 + 1));
			ssrCount = ssrCount+1;
		}
		if ((n & 2) == 2) {
			selectedSet.add(String(index*4 + 2));
			ssrCount = ssrCount+1;
		}
		if ((n & 4) == 4) {
			selectedSet.add(String(index*4 + 3));
			ssrCount = ssrCount+1;
		}
		if ((n & 8) == 8) {
			selectedSet.add(String(index*4 + 4));
			ssrCount = ssrCount+1;
		}
		ssr[index] = n;
	});

	if (hash[3] == "1") {
		$('input[type="checkbox"]').prop("checked", true);
	}

	update();
	updateHash();
	updateSummary();
}

function createTable(data){

	var header = data.columns;
	var top = tableDimen.top(Infinity);

	var container = new Vue({
		el: "#table",
		data: {
			"header": header,
			"rows": top
		},
		methods: {
			isChecked: function(row){
				return selectedSet.has(row["No"]);
			},
		}
	});

	 var refresh = function(){
		 container.rows = tableDimen.top(Infinity);
	 }

	 return {refresh: refresh};
}

var tags = {"レア度": "#chart_rare", "属性": "#chart_elem", "タイプ": "#chart_type", "種族": "#chart_race", "性別": "#chart_sex", "得意武器": "#chart_weap", "最終開放": "#chart_last", "カテゴリ": "#chart_cate", };

var dimens = {};
var filters = {};
var d3s = {};
var keys = {};
var size = {}
var table = null;
var tableDimen = null;
var selectionFilter = null;
var selectedSet = new Set();

var r = [];
var sr = [];
var ssr = [];

d3.csv("https://docs.google.com/spreadsheets/d/12dJvKrcs3RBl5KvjIMxYogkGwDE_k6OgxvSEjNCUI_8/export?format=csv&gid=808323101").then(function(data) {

	var cf = crossfilter(data);
	tableDimen = cf.dimension(function(p) { return -Number(p["No"]); });
	selectionFilter = cf.dimension(function(p) { return p["No"]});

	var names = d3.map(tags).keys();
	names.forEach(function(name) {
		dimens[name] = cf.dimension(function(p) { return p[name]; });
		filters[name] = cf.dimension(function(p) { return p[name]; });
		d3s[name] = newPieChart();
		keys[name] = new Set();
		size[name] = dimens[name].group().all().length;
		d3s[name].create(name);
	});

	$('input[type="checkbox"]').on("change", function(){
		update();
		updateHash();
	})

	table = createTable(data);
	loadHash(data);
});
