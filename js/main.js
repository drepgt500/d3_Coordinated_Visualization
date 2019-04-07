/* Script by Daniil Repchenko, 2019 */
/*eslint-env jquery*/
/*eslint-disable no-extra-semi*/
/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-console*/
/*eslint-disable no-unreachable*/

(function(){

    //Popualtion data for Oregon's counties, starting attribute year is 2018
    var attrArray = ["2018", "2010", "2000", "1990", "1980"];
    var expressed = attrArray[0]; //initial attribute

    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.46,
        chartHeight = 473,
        leftPadding = 75,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = 450,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scale.linear()
        .range([463, 0]) //slides y scale up and down
        .domain([0, 900000]); // sets scale start and end

    //begin script when window loads
    window.onload = setMap();

    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Oregon
    var projection = d3.geo.albers()
        .center([0, 44.25])
        .rotate([121.2, 0])
        .parallels([43, 45.3])
        .scale(4500)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    //set up choropleth map
    function setMap(){

        //use queue to parallelize asynchronous data loading
        d3.queue()
            .defer(d3.csv, "data/OR_Pop_Data.csv") //load attributes from csv
            .defer(d3.json, "data/OR_Counties.topojson") //load county shapes
            .defer(d3.json, "data/BorderStates.topojson") //load state shapes
            .defer(d3.json, "data/OR_City.topojson") //Load city points https://spatialdata.oregonexplorer.info/geoportal/
            .await(callback);

        //used to invoke functions set colors scale, translate topojson and join data
        function callback(error, csvData, counties, states, cities){
            //translate TopoJSON
            var stateBorders = topojson.feature(states, states.objects.BorderStates_WGS84),
                citiesOregon = topojson.feature(cities, cities.objects.OR_City_WGS84),
                countiesOregon = topojson.feature(counties, counties.objects.OR_Counties).features;

            //add states to map
            var statesAll = map.append("path")
                .datum(stateBorders)
                .attr("class", "statesAll")
                .attr("d", path);

            //join csv data to GeoJSON enumeration units
            countiesOregon = joinData(countiesOregon, csvData);

            //create the color scale
            var colorScale = makeColorScale(csvData);

            // WA State label
            var waLabel = map.append("text")
                .attr("class", "stateLabel")
                .attr("text-anchor", "middle")
                .attr("x", 350)
                .attr("y", 50)
                .text("WASHINGTON")

            // CA State label
            var caLabel = map.append("text")
                  .attr("class", "stateLabel")
                  .attr("text-anchor", "middle")
                  .attr("x", 270)
                  .attr("y", 440)
                  .text("CALIFORNIA")

            // NV State label
            var nvLabel = map.append("text")
                  .attr("class", "stateLabel")
                  .attr("text-anchor", "middle")
                  .attr("x", 530)
                  .attr("y", 430)
                  .text("NEVADA")

            // ID State label
            var idLabel = map.append("text")
                  .attr("class", "stateLabel")
                  .attr("text-anchor", "middle")
                  .attr("x", -240)
                  .attr("y", 600)
                  .text("IDAHO")
                  .attr("transform", function(d) {
                      return "rotate(-90)"
                  });

            // Ocean label
            var idLabel = map.append("text")
                  .attr("class", "oceanLabel")
                  .attr("text-anchor", "middle")
                  .attr("x", 75)
                  .attr("y", 220)
                  .text("PACIFIC OCEAN")

            //add enumeration units to the map
            setEnumerationUnits(countiesOregon, map, path, colorScale);

            setCities(citiesOregon); //set cities on top of counties

            // Foot note
            var idLabel = map.append("text")
                    .attr("class", "footNote")
                    .attr("text-anchor", "middle")
                    .attr("x", 540)
                    .attr("y", 455)
                    .text("Note:Points represent incorporated places.")

            setChart(csvData, colorScale);

            createDropdown(csvData);
        };
};
    //set cities on top of counties
    function setCities(citiesOregon){

        var citiesAll = map.append("path")
            .datum(citiesOregon)
            .attr("class", "citiesAll")
            .attr("d", path)
            .style("opacity", ".5");

          };

    // joins csv and geojson data via a the name of county
    function joinData(countiesOregon, csvData){
    //loop through csv to assign each set of csv attribute values to geojson county
        for (var i=0; i<csvData.length; i++){

            var csvOR_CO = csvData[i]; //the current county
            var csvKey = csvOR_CO.NAME; //the CSV primary key

        //loop through geojson regions to find correct county
        for (var a=0; a<countiesOregon.length; a++){

            var geojsonProps = countiesOregon[a].properties; //the current county geojson properties
            var geojsonKey = geojsonProps.NAME; //the geojson primary key

        //where primary keys match, transfer csv data to geojson properties object
        if (geojsonKey == csvKey){

            //assign all attributes and values
            attrArray.forEach(function(attr){
            var val = parseFloat(csvOR_CO[attr]); //get csv attribute value
            geojsonProps[attr] = val; //assign attribute and value to geojson properties
      });
  };
};
};
    //for use throughout other code
    return countiesOregon;
};

//function to create color scale generator, used ColorBrew
    function makeColorScale(data){
    var colorClasses = [
        "#ffffd4",
        "#fed98e",
        "#fe9929",
        "#d95f0e",
        "#993404"
    ];

    //create color scale generator, quantile method
    var colorScale = d3.scale.quantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

    //function to test for data value and return color
    function choropleth(props, colorScale){
    //make sure attribute value is a number
        var val = parseFloat(props[expressed]);
        //if attribute value exists, assign a color; otherwise assign gray
        if (typeof val == 'number' && !isNaN(val)){
          return colorScale(val);
        } else {
          return "#CCC";
    };
};

    //function to highlight enumeration units, bars, and call the setLabel function
    function highlight(props){
        //change stroke
        var selected = d3.selectAll("." + props.NAME)
            .style("stroke", "blue")
            .style("stroke-width", "2");
        setLabel(props);
    };

    function setSource(){

        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart")

      };

    //function to create coordinated bar chart
    function setChart(csvData, colorScale){

        //create a second svg element to hold the
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart")


        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        //set bars for each province
        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed] - a[expressed];
            })
            .attr("class", function(d){
                return "bar " + d.NAME;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .on("mouseover", highlight)
            .on("mouseout", dehighlight)
            .on("mousemove", moveLabel);

        var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');

        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 95)
            .attr("y", 35)
            .attr("class", "chartTitle");

        // add axis label
        var axisLabel = chart.append("text")
            .attr("class", "axisLabel")
            .attr("text-anchor", "middle")
            .attr("x", -240)
            .attr("y", 13)
            .text("County Population")
            .attr("transform", function(d) {
                return "rotate(-90)"
                });

        //create vertical axis generator
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");

        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        updateChart(bars, csvData.length, colorScale);
    };

    //function to create a dropdown menu for attribute selection
    function createDropdown(csvData){
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, csvData)
            });
        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){ return d });
    };

    //function to position, size, and color bars in chart
    function updateChart(bars, n, colorScale){
        //position bars
        bars.attr("x", function(d, i){
                return i * (chartInnerWidth / n) + leftPadding;
            })
            //size/resize bars
            .attr("height", function(d, i){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            //color/recolor bars
            .style("fill", function(d){
                return choropleth(d, colorScale);
            });

        var chartTitle = d3.select(".chartTitle")
            .text("Oregon's Population by County in Year " + expressed);
        };

    //dropdown change listener handler
    function changeAttribute(attribute, csvData){
        //change the expressed attribute
        expressed = attribute;

        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        //recolor enumeration units
        var allcounties = d3.selectAll(".allcounties")
            .transition()
            .duration(1000)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale)
            });

        //re-sort, resize, and recolor bars
        var bars = d3.selectAll(".bar")
            //re-sort bars
            .sort(function(a, b){
                    return b[expressed] - a[expressed];//meiliu:switch
                })
            .transition() //add animation
            .delay(function(d, i){
                    return i * 20
                })
            .duration(500);

        updateChart(bars, csvData.length, colorScale);
    };

    function setEnumerationUnits(countiesOregon, map, path, colorScale){

        var allcounties = map.selectAll(".allcounties")
            .data(countiesOregon)
            .enter()
            .append("path")
            .attr("class", function(d){
                  return "allcounties " + d.properties.NAME;
            })
            .attr("d", path)
            .style("fill", function(d){
            return choropleth(d.properties, colorScale);
          })
            .on("mouseover", function(d){
                highlight(d.properties);
            })
            .on("mouseout", function(d){
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);

        var desc = allcounties.append("desc")
            .text('{"stroke": "#62646B", "stroke-width": ".5px"}');
    };

    //function to reset the element style on mouseout
    function dehighlight(props){
        var selected = d3.selectAll("." + props.NAME)
            .style("stroke", function(){
                return getStyle(this, "stroke")
            })
            .style("stroke-width", function(){
                return getStyle(this, "stroke-width")
            });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };

    d3.select(".infolabel")
        .remove();
};

    //function to create dynamic label
    function setLabel(props){

        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        //label content
        var labelAttribute = "<h1>" + numberWithCommas(props[expressed]) + "</h1><b>" + expressed + "</b>";

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.NAME + "_label")
            .html(labelAttribute);

        var countyName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.NAME + " County");
    };

    //Example 2.8 line 1...function to move info label with mouse
    function moveLabel(){
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;

        //use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            y2 = d3.event.clientY + 25;

        //horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
        //vertical label coordinate, testing for overflow
        var y = d3.event.clientY < 75 ? y2 : y1;

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };



})();
