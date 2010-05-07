require.paths.unshift("lib/express/lib");
require.paths.unshift("lib/yui3");
require.paths.unshift("lib");

var YUI = require("node-yui3").YUI;

require("express");
require("express/plugins");

configure(function(){
    use(Static);
    use(ContentLength);
    set("root", __dirname);
});

function firehose (q, config, callback) {
    var query = require("./lib/jsoauth/api");
    var count = config.count || 10;
    var source = config.source || "*";
    var since = config.since || 0;
    var flickrCount = Math.floor(count * .333);
    var noisyCount = Math.floor(count * .666);

    query.makeRequest(
        "http://query.yahooapis.com/v1/yql",
        [
            "q=select%20%2A%20from%20social.updates.search(" + count + ")%20where%20query%20%3D%20%22" + q + "%22"
            + "%20and%20min_date%3D%22" + since + "%22%20and%20source%3D%22" + source + "%22"
            + "%20and%20dedupe%3D%22true%22"
            ,
            // "q=select%20%2A%20from%20query.multi%20where%20queries%3D%22select%20%2A%20from%20social.updates.search(" + flickrCount + ")%20where%20query%3D'" + q + "'%20and%20source%3D'flickr'%3B%20select%20%2A%20from%20social.updates.search(" + noisyCount + ")%20where%20query%3D'" + q + "'%3B",
            // "env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
            "format=json"
        ],
        callback
    );
}

get("/", function () {
    var q = this.param("q");
    if (!q) q = "hackday";

    this.redirect("/discover/" + q);
});

get("/discover/:query", function (q) {
    var express = this;

    var html = "";

    firehose(q, { count: 50 }, function (error, data, response) {
        if (error) throw new Error("YQL Error: " + error);
        data = JSON.parse(data);
        var results = data.query.results.update;
        YUI().use("datatype-date", function (yui) {
            var format = function (str) {
                return yui.DataType.Date.format(new Date(parseInt(str) * 1000), {
                    format : "%b %d %l:%M %P"
                });
            };
            express.render("index.html.haml", {
                locals : {
                    format : format,
                    q : q,
                    updates : results
                }
            });
        });
    }); 
});


get("/firehose/:query", function (query) {
    var express = this;

    express.contentType("json");
    
    firehose(query, {
        count : express.param("count"),
        source : express.param("source"),
        since : express.param("since")
    }, function (error, data) {
        express.respond(200, data);
    });
});

get("/style/*.css", function (file) {
    this.render(file + ".css.sass", { layout : false });
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
