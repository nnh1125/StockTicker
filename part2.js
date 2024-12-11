const http = require("http");
const url = require("url");
const fs = require("fs");
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://nnh:123@cluster0.xy7zn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname == "/") {
        // Serve the home.html file
        fs.readFile("home.html", (err, data) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
        });
    } else if (pathname == "/process") { //Read the info from the database
        const queryData = parsedUrl.query;
        await client.connect();
        const db = client.db("Stock");
        const collection = db.collection("PublicCompanies");

        let results = [];
        if (queryData.searchType == "ticker") {
            results = await collection.find({ ticker: queryData.query }).toArray();
        } else if (queryData.searchType == "name") {
            results = await collection.find({ name: new RegExp(queryData.query, "i") }).toArray();
        }

        let htmlResponse = "<h1>Search Results</h1><ul>"; //Response page
        results.forEach(result => {
            htmlResponse += `<li>Name: ${result.name}, Ticker: ${result.ticker}, Price: $${result.price}</li>`;
        });
        htmlResponse += results.length == 0 ? "<li>No results found.</li>" : "";
        htmlResponse += "</ul>";

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(htmlResponse);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);