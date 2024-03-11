const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

let parser = new Parser();

let resultFileName = "./Result/result.csv";

async function scrapFunction(teamName) {
    // const nowDate = new Date()
    // console.log(nowDate)
    percentage = 0;

    var newLine = '\r\n';
    var result = {};
    let results = [];
    let count = 0;
    let keyCount = 0;

    let appendHeader = { 'Code': "Code", 'City': "City", 'State': "State", 'Address': "Address", 'Class': "Class", 'Vehicle type': "Vehicle", 'Date From': "Start", 'Date To': "End", 'Total(pay now)': "Pay Now", 'Total(pay later)': "Pay Later", 'Link': "Reserve" };
    let headerData = parser.parse(appendHeader);
    let csvHeader = headerData.split('\n')[1] + '\n';

    fs.appendFileSync(resultFileName, csvHeader, 'utf8', (err) => {
        if (err) {
            console.error('Error appending to CSV file:', err);
        } else {
            console.log('CSV header appended successfully.');
        }
    });
    // Do something with the submitted data (e.g., save it to a database)

    async function handleScraping() {

        const browser = await puppeteer.launch({
            headless: false, // Use the new Headless mode
            // ... other options
        });

        // Rest of your code using the browser instance
        const page = await browser.newPage();

        // Navigate to a page that triggers AJAX requests
        await page.goto('https://int.soccerway.com/', {
            timeout: 500000
        });

        // Delay function
        function delay(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        // await delay(3000);
        let target_match_link = "";
        let match_links = 'div.teams a';
        const [matches] = await page.$$(match_links);
        
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const match_link = match.getAttribute('href');
            if (match_link.includes(teamName)) {
                target_match_link = match_link;
                console.log("target match link : ", target_match_link);
            }
            
        }
        
        await page.goto(target_match_link, {
            timeout: 500000
        });
        
        let home_lineup_names = [];
        let away_lineup_names = [];

        const players_path_from_match = '.combined-lineups-container div table tbody tr td.player a'
        const [ players_from_match ] = await page.$$(players_path_from_match)
        for (let i = 0; i < 11; i++) {
            const player = players_from_match[i];
            const lineup_player_name = player.text()
            console.log("hometeam players : ", lineup_player_name);
            home_lineup_names.push(lineup_player_name);
        }
        for (let i = 11; i < 22; i++) {
            const player = players_from_match[i];
            const lineup_player_name = player.text()
            console.log("awayteam players : ", lineup_player_name);
            away_lineup_names.push(lineup_player_name);
        }

        let team_link_from_match = "";
        let lineup_names = [];
        const team_path_from_match = '#team-title';
        const [ teams_from_match ] = await page.$$(team_path_from_match);
        const hometeam_from_match = teams_from_match[0].getAttribute('href');
        const awayteam_from_match = teams_from_match[1].getAttribute('href');
        if (hometeam_from_match.includes(teamName)) {
            team_link_from_match = hometeam_from_match;
            lineup_names = home_lineup_names;
        } else {
            team_link_from_match = awayteam_from_match;
            lineup_names = away_lineup_names;
        }

        await page.goto(team_link_from_match, {
            timeout: 500000
        });

        let player_path_list = [];
        const players_path_from_team = 'tr td div a';
        const [ players_from_team ] = await page.$$(players_path_from_team);
        for (let i = 0; i < players_from_team.length-1; i++) {
            const player = players_from_team[i];
            const palyer_name = player.text();
            const player_link = player.getAttribute('href');
            player_path_list.push({'name': palyer_name, 'link': player_link});
        }
        for (let i = 0; i < player_path_list.length; i++) {
            const player_path = player_path_list[i].link;
            
            await page.goto(player_path, {
                timeout: 500000
            });
            
            const player_name = player_path_list[i].name;
            const player_age = await page.$('.highlight .age').text();
            const player_position = await page.$('dd[data-position="position"]').text()[0];
            const player_game_minutes = await page.$('.odd .game-minutes').text();
            const player_appearances = await page.$('.odd .appearances').text();
            const player_lineups = await page.$('.odd .lineups').text();
            const player_subs_in = await page.$('.odd .subs-in').text();
            const player_subs_out = await page.$('.odd .subs-out').text();
            const player_subs_on_bench = await page.$('.odd .subs-on-bench').text();
            const player_goals = await page.$('.odd .goals').text();
            const player_yellow_cards = await page.$('.odd .yellow-cards').text();
            const player_2nd_yellow_cards = await page.$('.odd .2nd-yellow-cards').text();
            const player_red_cards = await page.$('.odd .red-cards').text();
            const player_team = await page.$('.team a').text();

            let player_lineup_flag = "";
            if (lineup_names.includes(player_name)) {
                player_lineup_flag = "Yes";
            } else {
                player_lineup_flag = "No";

            }

            console.log("name : ", player_name);
            console.log("age : ", player_age);
            console.log("position : ", player_position);
            console.log("minutes : ", player_game_minutes);
            console.log("appearances : ", player_appearances);
            console.log("lineups : ", player_lineups);
            console.log("sub in : ", player_subs_in);
            console.log("sub out : ", player_subs_out);
            console.log("sub on bench : ", player_subs_on_bench);
            console.log("goals : ", player_goals);
            console.log("yellow card : ", player_yellow_cards);
            console.log("2nd yellow card : ", player_2nd_yellow_cards);
            console.log("red card : ", player_red_cards);
            console.log("team : ", player_team);
            console.log("lineup : ", player_lineup_flag);
            console.log("---------------------------------------");
            
        };

        await browser.close();

    }

    async function readFileSequentially(filePath) {
        return new Promise((resolve, reject) => {
            let data = [];

            fs.createReadStream(filePath, { encoding: 'utf8' })
                .pipe(csv({ separator: ',', headers: false }))
                .on('data', chunk => {
                    // console.log('data-->', chunk)
                    data.push(chunk);
                })
                .on('end', () => {
                    resolve(data);
                })
                .on('error', error => {
                    reject(error);
                });
        });
    }

    // date setting
    await handleScraping().then(res => {
        console.log('handle scraping have done!!')
    })

    return "Scraping was completed successfully!";

}


module.exports = {
    scrapFunction,
}

scrapFunction("Manchester")
