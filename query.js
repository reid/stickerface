var query = require("./lib/jsoauth/api");
var sys = require("sys");

query.makeRequest(
    "http://query.yahooapis.com/v1/yql",
    [
        "q=select%20%2A%20from%20social.updates.search%20where%20query%20%3D%20%22foo%22",
        "format=json"
    ],
    function (error, data, response) {
        if (error) return;
        data = JSON.parse(data);
        sys.debug(sys.inspect(data.query.results.update));
    }
); 
