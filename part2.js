const http = require("http");
const fs = require("fs");
const url = require("url");
const { MongoClient } = require("mongodb");

// MongoDB connection URI
const uri =  "mongodb+srv://nnh:123@cluster0.xy7zn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

// Helper to read files
function readFile(filePath, response) {
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Server Error");
        } else {
            response.writeHead(200, { "Content-Type": "text/html" });
            response.end(data);
        }
    });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === "/") {
        // Home view
        readFile("./views/home.html", res);
    } else if (pathname === "/process") {
        // Process view
        const queryData = parsedUrl.query;

        if (queryData.query && queryData.searchType) {
            try {
                // Connect to MongoDB
                await client.connect();
                const db = client.db("Stock");
                const collection = db.collection("PublicCompanies");

                let results = [];
                if (queryData.searchType === "ticker") {
                    results = await collection.find({ ticker: queryData.query }).toArray();
                } else if (queryData.searchType === "name") {
                    results = await collection.find({ name: new RegExp(queryData.query, "i") }).toArray();
                }

                // Generate dynamic HTML for results
                let resultHTML = "<h1>Search Results</h1>";
                if (results.length > 0) {
                    resultHTML += "<ul>";
                    results.forEach((result) => {
                        resultHTML += `<li>Name: ${result.name}, Ticker: ${result.ticker}, Price: $${result.price}</li>`;
                    });
                    resultHTML += "</ul>";
                } else {
                    resultHTML += "<p>No results found.</p>";
                }

                resultHTML += '<a href="/">Back to Home</a>';
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(resultHTML);
            } catch (error) {
                console.error("Database query error:", error);
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Server Error");
            } finally {
                await client.close();
            }
        } else {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Bad Request: Missing query or searchType.");
        }
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }
});

// Start server on port 3000 or Heroku's dynamic port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
