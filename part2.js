const http = require("http");
const url = require("url");
const fs = require("fs");
const { MongoClient } = require("mongodb");

// MongoDB connection URI and client
const uri =  "mongodb+srv://nnh:123@cluster0.xy7zn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === "/") {
        // Serve the home.html file
        fs.readFile("home.html", (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Server Error");
                return;
            }
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
        });
    } else if (pathname === "/process") {
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

                // Send results as plain text
                let resultText = "Search Results:\n";
                if (results.length > 0) {
                    results.forEach((result) => {
                        resultText += `Name: ${result.name}, Ticker: ${result.ticker}, Price: $${result.price}\n`;
                    });
                } else {
                    resultText += "No results found.";
                }

                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end(resultText);
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
        // Handle 404
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
