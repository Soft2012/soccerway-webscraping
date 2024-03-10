const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

let parser = new Parser();

async function getMatchesFunction() {
    console.log("--- Get match list ---");
    
    let appendHeader = { 'Start Date':"Start Date", 'Home Team':"Home Team" , 'Away Team':"Away Team" };
    let headerData = parser.parse(appendHeader);
    let csvHeader = headerData.split('\n')[1] + '\n';
    fs.appendFileSync("./Result/matches.csv", csvHeader, 'utf8', (err) => {
        if (err) {
            console.error('Error appending to CSV file:', err);
        } else {
            console.log('CSV header appended successfully.');
        }
    });
        
    await fetch("https://secure.static.visualisation.performgroup.com/matches?customerId=ow2019&customerKey=5a715874c0&days=1&sportid=1&json=true", {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9,ko;q=0.8",
            "if-none-match": "W/\"a8951-zfhA9ju1kozpVx/Q/HDSYrvDtGA\"",
            "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Referer": "https://int.soccerway.com/",
            "Referrer-Policy": "origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    })
    .then(response => {
        if (response.ok) {
            console.log("response okay!");
            return response.json(); // assuming the response is in JSON format
        } else {
            throw new Error("Request failed with status " + response.status);
        }
    })
    .then(data => {
        result_data = data.matches;
        for (let i = 0; i < result_data.length; i++) {
            const homeTeam = result_data[i].homeTeam;
            const awayTeam = result_data[i].awayTeam;
            const startTime = result_data[i].startTime;
            
            const result = { startTime, homeTeam, awayTeam };
            const csv = parser.parse(result);
            const csvDataWithoutHeader = csv.split('\n')[1] + '\n';
            fs.appendFileSync("./Result/matches.csv", csvDataWithoutHeader, 'utf8', (err) => {
                if (err) {
                    console.error('Error appending to CSV file:', err);
                } else {
                    console.log('CSV data appended successfully.');
                }
            });
            
        }
    })
    .catch(error => {
        console.error("No match result ...");
    });
    
}



module.exports = {
    getMatchesFunction,
}