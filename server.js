var express = require('express');
var fs 		= require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app 		= express();

// see http://scotch.io/tutorials/javascript/scraping-the-web-with-node-js
app.get('/scrape', function(req, res) {

	// Can consider taking an argument as a url, in practice, and passing it into the below array.

	// Or can consider having a user type in player names, having it search espn.go.com, and redirect to the correct url as a next step to get the urls into the url array.

	url = ['http://espn.go.com/nba/player/stats/_/id/4145/kareem-abdul-jabbar', 'http://espn.go.com/nba/player/stats/_/id/2334/magic-johnson', 'http://espn.go.com/nfl/player/stats/_/id/9588/reggie-bush'];

	// recursive wrapper rather than loop; prevents asynchronously writing with the filesystem module
	function urlRecurse(urlIdx) {

		if(urlIdx < url.length) {
			
			request(url[urlIdx], function(error, response, html) {

				if(!error) {

					// utilize the Cheerio library on the returned html, yielding jQuery functionality
					var $ = cheerio.load(html);

					var stats = [];

					var numOfCharts = $("table.tablehead").length;

					var numOfRows = new Array(numOfCharts);

					for(var chart = 0; chart < numOfCharts; chart++) {

						stats.push([[]]);	// allocates space for each grid on each chart (each set of rows and columns)

						$('.tablehead').eq(chart).filter(function(){
							var data = $(this);
							numOfRows[chart] = data.children().length;
							for(var i = 0; i < numOfRows[chart] - 1; i++) {
								stats[chart].push([]); // allocates space for each row in the chart
							}
						})

						$('.stathead').eq(chart).filter(function(){
							var data = $(this);
							// useful so that each chart has a labeled title in the JSON
							stats[chart][0][0] = data.children().first().text();
						})

						var numOfColumns;

						$('.colhead').eq(chart).filter(function(){
							var data = $(this);
							numOfColumns = data.children().length; 
						})

						var currentRow = 0;

						for(currentRow = 1; currentRow < numOfRows[chart]; currentRow++) {
							var row = $('.tablehead').eq(chart).children().eq(currentRow);
							for(var c = 0; c < numOfColumns; c++) {
								stats[chart][currentRow][c] = row.children().eq(c).text();
							}
						}

						currentRow -= 1; // gets the last allocated row index

						$('.tablehead .total').eq(chart).filter(function(){
							var data = $(this);
							var LOGOIDX = 1;
							for(var c = 0; c < numOfColumns - 1; c++) {
								if(c < LOGOIDX) {
									 stats[chart][currentRow][c] = data.children().eq(c).text();
								}
								if(c == LOGOIDX) {
									stats[chart][currentRow][c] = "N.A.";
									stats[chart][currentRow][c + 1] = data.children().eq(c).text();
									continue;
								}
								else {
									 stats[chart][currentRow][c + 1] = data.children().eq(c).text();
								}
							}
						})
					}	// end chart loop
				} // end if(!error) condition


			// Can parse the json so that it displays in format: "name: value" rather than just "name" as it is now...

			// Or can be easily parsable into CSV with the node-csv-stringify module. Can organize the data into rows, the first row being the array of the set of columns.

			// The name of the file outputted can be more descriptive, if desired.

			fs.writeFile('url' + urlIdx + '.json', JSON.stringify(stats, null, 4), function(err){
				console.log('File successfully written! - Check the project directory for the url' + urlIdx + '.json file');
				console.log('Number of columns in chart is: ' + numOfColumns);
				console.log('Number of charts in file is: ' + numOfCharts);
				console.log('urlIdx is: ' + urlIdx);
				})

			//	http://www.richardrodger.com/2011/04/21/node-js-how-to-write-a-for-loop-with-callbacks/#.U7pbOo1dWpQ
			urlRecurse(urlIdx + 1); // recursive callback to guard against asynchronous race condition implicit in certain filesystem manipulation when implemented with loops.

			})	// end request url block
		} // end if inside urlRecurse function
	} // end urlRecurse function
	urlRecurse(0);
	// message to browser reminding that there's no UI involved here.
	res.send('Check the console! Type Ctrl+C (in Terminal) to exit script upon completion.')
})

app.listen('8081')

console.log('Magic happens on port 8081');

exports = module.exports = app;
