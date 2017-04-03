//wrap everything in anon funcion
(function(){
    //psuedo global variables
    //attributes
    var attrArray = ["Percent Not in Labor Force", "Median household income", "Percent HH Cash Assist", "Percent HH FS/SNAP", "Per capita income"];
    //initial attribute
    var expressed = attrArray[0]; 

    //begin script when window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap(){
        //map frame dimensions
        var width = 960,
            height = 460;

        //create new svg container
        var map = d3.select("body")
            .append("svg")
            .attr("class","map")
            .attr("width", width)
            .attr("height", height);

        //create albers EA conic projection centered on wisconsin
        var projection = d3.geoAlbers()
            .center([0,44.75])
            .rotate([90,0,0])
            .parallels([43.5,45.5])
            .scale(5000)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath() //generator for projection
            .projection(projection);

        //use d3.queue to parallelize asyncronus data loading
        d3.queue()
            .defer(d3.csv, "data/new_data.csv") //load attributes from csv
            .defer(d3.json, "data/states.topojson") //load background topology
            .defer(d3.json, "data/topology_wi.topojson") //load wisconsin topology
            .await(callback);

        function callback(error, csvData, states, wisconsin){
            //translate topojsons
            var states = topojson.feature(states, states.objects.states);
            var wisCounties = topojson.feature(wisconsin, wisconsin.objects.topology_wi).features;
            //checking data
            console.log(error); 
            console.log(csvData);
            console.log(states);
            console.log(wisCounties);

            
            //add background states to the map
            var statesBackground = map.append("path")
                .datum(states)
                .attr("class", "states")
                .attr("d", path);
            
            //join csv data to geojson enumeration units
            wisCounties = joinData(wisCounties, csvData);
            
            //create the color scale
            var colorScale = makeColorScale(csvData);
            //add enumeration units to map
            setEnumerationUnits(wisCounties,map,path, colorScale);
            
            
        };
        
        //joinData function joins csv data to json 
        function joinData(wisCounties, csvData){
            //loop through csvData to assign values to geojson county
            for (var i=0; i<csvData.length; i++){
                var csvCounty = csvData[i]; //current county entry in CSV
                var csvKey = csvCounty.GEO_id2; //CSV primary key
                //loop through the geojson data to match county
                for (var a=0; a<wisCounties.length; a++){
                    //the current county properties
                    var geojsonProps = wisCounties[a].properties;
                    //geojson key
                    var geojsonKey = geojsonProps.GEOID;
                    //where keys match, copy data from csv to geojson properties object
                    if (geojsonKey == csvKey){
                        //assign all attributes and values
                        attrArray.forEach(function(attr){
                            //get csv attribute value
                            var val = parseFloat(csvCounty[attr]);
                            //assign attribute and value to geojson props
                            geojsonProps[attr] = val;
                        });
                    };
                };
            };
            return wisCounties;
        };
        //set enumeration units
        function setEnumerationUnits(wisCounties,map,path, colorScale){
            //add wisconsin counties to map
            var counties = map.selectAll(".counties")
                .data(wisCounties)
                .enter()
                .append("path")
                .attr("class", function(d){
                    return d.properties.NAME + " County";
                })
                .attr("d",path)
                .style("fill", function(d){
                    return colorScale(d.properties[expressed]);
                });
        };
        
        //make the color scale funtion
        function makeColorScale(data){
            var colorClasses = [
                "#edf8e9",
                "#bae4b3",
                "#74c476",
                "#31a354",
                "#006d2c"
            ];
            
            //create color scale generator
            var colorScale = d3.scaleThreshold()
                .range(colorClasses);
            //build array of all values of the expressed attribute
            var domainArray = [];
            for (var i=0; i<data.length; i++){
                var val = parseFloat(data[i][expressed]);
                domainArray.push(val);
            };
            //cluster data using kmeans clustering algrithm to create natural breaks classes
            var clusters = ss.ckmeans(domainArray, 5);
            console.log(clusters);
            //reset domain array to cluster minimums
            domainArray = clusters.map(function(d){
                return d3.min(d);
            });
            //remove the first value from the domain array to create breakpoints
            domainArray.shift();
            console.log(domainArray);
            
            //assign array of last 4 cluster mins as domain
            colorScale.domain(domainArray);
            
            return colorScale;
                        
        };

    };
})();
