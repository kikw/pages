var radio = {"colors":["艦種", "ﾚｱ度", "陣営", "装甲"],
		"types": ["火力", "雷装", "対空", "航空", "耐久", "装填", "回避", "速力"]};

new Vue({
	el: "#selector",
	data: radio
});

d3.csv("https://script.google.com/macros/s/AKfycbx4rlJYPyGqCDrsS-bxM0AUJIEbQcpx1SB_APJ4RyvOOmzyhDmy/exec").then(function(data) {

	var cf = crossfilter(data);

	var tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

	var color = d3.scaleOrdinal(d3.schemeCategory10);
	var dimen = cf.dimension(function(p) { return -Number(p["No."]); });

	var colors = {};
	var dimens = {};

	radio.colors.forEach(function(color){
		colors[color] = cf.dimension(function(p) { return p[color]; });
	});
	radio.types.forEach(function(type){
		dimens[type] = cf.dimension(function(p) { return Number(p[type]); });
	});

	// 色分け
	var coloring = $("input:radio[name=\"color\"]:checked").val();
	colorEx(coloring, color);
	// 縦軸
	var vKey = $("input:radio[name=\"vertical\"]:checked").val();
	var v = Number(dimens[vKey].top(1)[0][vKey]);
	// 横軸
	var hKey = $("input:radio[name=\"horizon\"]:checked").val();
	var h = Number(dimens[hKey].top(1)[0][hKey]);

	var svg = d3.select("#scatter").append("svg")
		.attr("width", 600)
		.attr("height", 550);

	var chart = svg.append("g")
		.attr('transform', "translate(50, 25)");

	var xValue = function(d) { return d[hKey];}
	var xScale = d3.scaleLinear()
		.domain([-10, h + 10])
		.range([0, 500]);
	var xAxis = d3.axisBottom(xScale);
	var xMap = function(d) { return xScale(xValue(d));};

	var yValue = function(d) { return d[vKey];}
	var yScale = d3.scaleLinear()
		.domain([-10, v + 10])
		.range([500, 0]);
	var yAxis = d3.axisLeft(yScale);
	var yMap = function(d) { return yScale(yValue(d));};

	var plot = chart.selectAll('circle')
    	.data(dimen.top(Infinity))
    	.enter()
    	.append('circle')
    	.attr("cx", xMap)
    	.attr("cy", yMap)
    	.attr('r', 5)
    	.attr("fill", function (d) { return color(d[coloring]); })
    	.on("mouseover", function(d) {
    		tooltip.transition()
    			.duration(200)
    			.style("opacity", 1);
    			tooltip.html(d["名前"] + "<br/> " + vKey + ":" + d[vKey]
    					+ "<br/> " + hKey + ":" + d[hKey])
    					.style("left", (d3.event.pageX + 10) + "px")
    					.style("top", (d3.event.pageY - 40) + "px");
    	})
    	.on("mouseout", function(d) {
    		tooltip.transition()
    			.duration(500)
    			.style("opacity", 0);
	});

	chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + 500 + ")")
		.attr("id", "axisx-label")
		.call(xAxis)
		.append("text")
		.attr("class", "axis-label")
		.attr("x", 500)
		.attr("y", -6)
		.style("text-anchor", "end")
		.text(hKey);

	chart.append("g")
		.attr("class", "y axis")
		.attr("id", "axisy-label")
		.call(yAxis)
		.append("text")
		.attr("class", "axis-label")
		.attr("transform", "rotate(-90)")
		.attr("y", 10)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text(vKey);

		$("#color input").on("change", function(){
			changeColor($(this).val());
		})
		$("#axisy input").on("change", function(){
			changeVerticalType($(this).val());
		})
		$("#axisx input").on("change", function(){
			changeHorizonType($(this).val());
		})

		function changeColor(c) {
			var color = d3.scaleOrdinal(d3.schemeCategory10);
			colorEx(c, color);
			var plot = d3.select("#scatter").selectAll("circle")
				.data(dimen.top(Infinity))
				.transition()
				.duration(500)
		    	.attr("fill", function (d) { return color(d[c]); })
		};

		function colorEx(c, color){
			var data = colors[c].group().top(Infinity);

			d3.select("#color-legend").selectAll("div").remove();
			var list = d3.select("#color-legend").selectAll("div")
				.data(data)
				.enter()
				.append("div")
				.style("padding-top", "2px")
				.style("padding-bottom", "2px");

			list.append("span")
				.style("background",function (d) { return color(d.key); } )
				.text("　");

			list.append("span")
				.style("margin-left", "10px")
				.text(function(d){return d.key});
		}

		function  changeVerticalType(vertical) {
			vKey = vertical;
			v = Number(dimens[vKey].top(1)[0][vKey]);
			yScale.domain([-10, v + 10])
			yAxis = d3.axisLeft(yScale);
			changeType();
		}

		function changeHorizonType(horizon){
			hKey = horizon;
			h = Number(dimens[hKey].top(1)[0][hKey]);
			xScale.domain([-10, h + 10])
			xAxis = d3.axisBottom(xScale);
			changeType();
		}

		function  changeType() {
			var plot = d3.select("#scatter").selectAll("circle")
				.data(dimen.top(Infinity))
				.transition()
				.duration(200)
		    	.attr("cx", xMap)
		    	.attr("cy", yMap)

	    	d3.select("#scatter").selectAll("#axisy-label")
	    		.call(yAxis)
	    		.selectAll(".axis-label")
				.text(vKey);

	    	d3.select("#scatter").selectAll("#axisx-label")
	    		.call(xAxis)
	    		.selectAll(".axis-label")
				.text(hKey);
		}
});


