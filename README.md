# UTR Team Tracker

This Node.js script fetches Universal Tennis Rating (UTR) data for tennis teams using the UTR API. It organizes players by team, displays their singles and doubles UTRs with reliability percentages, and calculates team averages based on reliable ratings (progress >= 100% and UTR > 0). The script prioritizes players from the Houston, TX area and falls back to the most active profiles to handle duplicate accounts.

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

## Setup
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd utr-team-tracker
