require.paths.unshift("lib/express/lib");
require("express");

get("/", function () {
    return "Hello, Heroku!";
});

run(process.env.PORT || 8000, null);
