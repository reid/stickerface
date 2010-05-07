var jsoauth = require("./jsoauth").OAuth,
    http = require("http"),
    urlhelper = require("url"),
    querystring = require("querystring");

jsoauth.consumerKey = process.env.YAHOO_CKEY;
jsoauth.consumerSecret = process.env.YAHOO_CSECRET;

exports.makeRequest = function (url, params, callback) {

    var signedURL = jsoauth.sign({
        "URL" : url,
        "params" : params
    });

    var parsed = urlhelper.parse(signedURL, false);

    if (!parsed.port) {
        if (parsed.protocol === "http:") parsed.port = 80;
        if (parsed.protocol === "https:") parsed.port = 443;
    }

    var client = http.createClient(parsed.port, parsed.hostname);

require("sys").puts(parsed.search);

    var request = client.request("GET", parsed.pathname + parsed.search,
        {
            "host" : parsed.host
        }
    );

    var data = "";

    request.addListener("response", function (response) {
        response.setEncoding("utf8");
        response.addListener("data", function (chunk) {
            data += chunk;
        });
        response.addListener("end", function () {
            if (response.statusCode !== 200) {
                return callback(
                    response.statusCode + ": " + data
                );
            }
            callback(null, data, response);
        });
    });
    request.end();

}