require.paths.unshift("lib/express/lib");
require.paths.unshift("lib/yui3");
require.paths.unshift("lib");

require("express");

var YUI = require("node-yui3").YUI;

get("/", function () {
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
    parseInt(process.env.PORT || 8000, 10),
    null
);
