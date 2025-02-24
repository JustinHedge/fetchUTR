# UTR Team Tracker

This Node.js script fetches Universal Tennis Rating (UTR) data for tennis teams using the UTR API. It organizes players by team, displays their singles and doubles UTRs with reliability percentages, and calculates team averages based on reliable ratings (progress ≥ 100% and UTR > 0). The script prioritizes players from the Houston, TX area and falls back to the most active profiles to handle duplicate accounts.

## Features

- **Team-Based Output**: Groups players by team with formatted UTR data.
- **Location Filtering**: Prioritizes players from Houston-area cities, then Texas, then the most active profile globally.
- **Reliability Check**: Only includes UTRs with 100% reliability in team averages.
- **Report-Friendly**: Clean, markdown-formatted output (adaptable).
- **Debug Mode**: Optional verbose logging for troubleshooting player selection.

## Prerequisites

- **Node.js**: Install Node.js (v14+ recommended) from [nodejs.org](https://nodejs.org/).
- **Axios**: Install the Axios library via npm: `npm install axios`.
- **UTR Account**: You’ll need a UTR account with API access credentials (email and password).

---

## Output

The script outputs team data to the console in a Discord-friendly format. For example:
```javascript
Team: Team A
Player One: Singles UTR: 6.50, Doubles UTR: 6.80
Player Two: Singles UTR: 5.20 (80% reliable), Doubles UTR: 5.90
Team Averages: Average Singles UTR: 6.50 Average Doubles UTR: 6.80

Team: Team B ...
```


Copy the output and paste it into Discord for a formatted display. Note that unreliable UTRs (with less than 100% progress) will display their reliability percentages and are excluded from the team averages.

## Debug Mode

To troubleshoot player selection:

1. Set `DEBUG = true` in the script.
2. Run the script again to see detailed logs for API responses and selection logic.

## Customization

### Houston Area Cities

Modify the `houstonAreaCities` array to include or exclude specific suburbs:

```javascript
const houstonAreaCities = ["houston", "sugar land", "pearland"];
```

### Team Data

Update the teams array with your specific rosters.

### Output Format

Adjust the `formatUTR` function or the `console.log` statements to customize the output format.

### How It Works

- **Authentication:** Logs into the UTR API using provided credentials.
- **Player Search:** Queries the UTR search API for each player name, prioritizing:
  - Houston-area matches (if active, UTR > 0)
  - Texas matches (if active)
  - The most active profile (highest combined singles + doubles UTR)
- **UTR Fetching:** Retrieves detailed UTR data (singles, doubles, reliability) for selected player IDs.
- **Averaging:** Calculates team averages using only reliable UTRs (progress ≥ 100% and UTR > 0).

### Limitations

- **API Rate Limits:** Be mindful of UTR API usage limits to avoid throttling.
- **Duplicate Names:** The script uses location and activity scores to disambiguate names; rare cases may require manual verification.
- **Location Data:** Assumes UTR profiles include accurate city/state information in `location.display`.

### Contributing

Feel free to fork this repository, submit issues, or send pull requests with enhancements!

### License

This project is licensed under the MIT License.
