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
        .center([0,45])
        .rotate([90,0,0])
        .parallels([43.5,45.5])
        .scale(5000)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);
    
    
    
    //use d3.queue to parallelize asyncronus data loading
    d3.queue()
        .defer(d3.csv, "data/attributes.csv") //load attributes from csv
        .defer(d3.json, "data/topology_wi.topojson") //load topology
        .await(callback);
    
    function callback(error, csvData, wisconsin){
        //translate topojson
        var wisCounties = topojson.feature(wisconsin, wisconsin.objects.topology_wi).features;
        console.log(error);
        console.log(csvData);
        console.log(wisconsin);
        console.log(wisCounties);
        
        //add info to map
        var counties = map.selectAll(".counties")
            .data(wisCounties)
            .enter()
            .append("path")
            .attr("class", function(d){
                return d.properties.NAME + " County";
            })
            .attr("d",path);
        
        
    };
    
};
