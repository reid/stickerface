require.paths.unshift("lib/express/lib");
require.paths.unshift("lib/yui3");
require.paths.unshift("lib");

var YUI = require("node-yui3").YUI;

require("express");

configure(function(){
    set("root", __dirname);
});

get("/", function () {
    var express = this;

    var query = require("./lib/jsoauth/api");
    var html = "";

    var q = express.param("q");
    if (!q) q = "yahoo";

    query.makeRequest(
        "http://query.yahooapis.com/v1/yql",
        [
            "q=select%20%2A%20from%20social.updates.search%20where%20query%20%3D%20%22" + q + "%22",
            "format=json"
        ],
        function (error, data, response) {
            if (error) throw new Error("YQL Error: " + error);
            data = JSON.parse(data);
            var results = data.query.results.update;
            express.render("index.html.haml", {
                locals : {
                    updates : results
                }
            });
        }
    ); 
});

get("/style/*.css", function (file) {
    this.render(file + ".css.sass");
});

get("/yui", function () {
    var express = this;
    express.contentType("html");
    YUI().use("nodejs-dom", function (Y) {
        var document = Y.Browser.document;
        var div = document.createElement("div");
        div.innerHTML = "Hello, DOM!";
        document.body.appendChild(div);
        express.respond(200, document.body.outerHTML);
    });
});

run(
    parseInt(process.env.PORT || 8000),
    null
);
