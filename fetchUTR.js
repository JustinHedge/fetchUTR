const axios = require('axios');

// Debug flag to toggle verbose logging
const DEBUG = false; // Set to true for detailed logs, false for clean output

// UTR credentials (placeholders - replace with your own)
const UTR_EMAIL = 'your-email@example.com';
const UTR_PASSWORD = 'your-password';

// Placeholder teams (replace with your own)
const teams = [
  {
    name: "Team A",
    players: [
      "Player One", "Player Two", "Player Three"
    ]
  },
  {
    name: "Team B",
    players: [
      "Player Four", "Player Five", "Player Six"
    ]
  }
];

// Houston area cities (including suburbs)
const houstonAreaCities = [
  "houston", "sugar land", "pearland", "katy", "the woodlands",
  "league city", "missouri city", "manvel"
];

// Function to parse location display string into city and state
function parseLocation(locationDisplay) {
  if (!locationDisplay) return { city: null, state: null };
  const parts = locationDisplay.split(', ');
  const city = parts[0] ? parts[0].toLowerCase() : null;
  const state = parts[1] ? parts[1].toLowerCase() : null;
  return { city, state };
}

// Function to log in and retrieve JWT token
async function getUTRToken() {
  try {
    const response = await axios.post('https://app.utrsports.net/api/v2/auth/login', {
      email: UTR_EMAIL,
      password: UTR_PASSWORD,
    });
    return response.data.token;
  } catch (error) {
    if (DEBUG) console.error('Error during login:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Function to search for a player by name with location and activity filtering
async function searchPlayerID(name, jwtToken) {
  try {
    const response = await axios.get(`https://app.utrsports.net/api/v2/search?query=${encodeURIComponent(name)}`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (DEBUG) console.log(`Search API response for ${name}:`, JSON.stringify(response.data, null, 2));

    const words = name.split(' ');
    const firstName = words[0].toLowerCase();
    const lastWord = words[words.length - 1].toLowerCase();

    const players = response.data.players.hits.filter(hit => 
      hit.source && 
      hit.source.firstName.toLowerCase() === firstName && 
      hit.source.lastName.toLowerCase().includes(lastWord)
    );

    if (!players.length) {
      if (DEBUG) console.log(`No players found for ${name}`);
      return null;
    }

    // Parse locations and calculate activity score
    if (DEBUG) console.log(`Matching players for ${name}:`);
    const playersWithLocation = players.map(player => {
      const { city, state } = parseLocation(player.source.location?.display);
      const activityScore = (player.source.myUtrSingles || 0) + (player.source.myUtrDoubles || 0);
      return { 
        ...player, 
        parsedCity: city, 
        parsedState: state,
        activityScore
      };
    });
    if (DEBUG) {
      playersWithLocation.forEach(player => {
        console.log(`- ${player.source.firstName} ${player.source.lastName} (ID: ${player.source.id}): City: ${player.parsedCity || 'Unknown'}, State: ${player.parsedState || 'Unknown'}, Singles: ${player.source.myUtrSingles || 0}, Doubles: ${player.source.myUtrDoubles || 0}, Activity Score: ${player.activityScore}`);
      });
    }

    // Prioritize Houston area with activity
    const houstonMatch = playersWithLocation.find(player => 
      player.parsedCity && 
      houstonAreaCities.includes(player.parsedCity) && 
      player.activityScore > 0
    );
    if (houstonMatch) {
      if (DEBUG) console.log(`Selected Houston area match for ${name}: ${houstonMatch.parsedCity}, ${houstonMatch.parsedState}, ID: ${houstonMatch.source.id}, Activity Score: ${houstonMatch.activityScore}`);
      return houstonMatch.source.id;
    }

    // Fall back to Texas with activity
    const texasMatch = playersWithLocation.find(player => 
      player.parsedState === 'tx' && 
      player.activityScore > 0
    );
    if (texasMatch) {
      if (DEBUG) console.log(`Selected Texas match for ${name}: ${texasMatch.parsedCity || 'Unknown'}, ${texasMatch.parsedState}, ID: ${texasMatch.source.id}, Activity Score: ${texasMatch.activityScore}`);
      return texasMatch.source.id;
    }

    // Fall back to most active profile (highest combined UTR)
    const mostActiveMatch = playersWithLocation.reduce((max, player) => 
      player.activityScore > max.activityScore ? player : max, 
      playersWithLocation[0]
    );
    if (DEBUG) console.log(`Selected most active match for ${name}: ${mostActiveMatch.parsedCity || 'Unknown'}, ${mostActiveMatch.parsedState || 'Unknown'}, ID: ${mostActiveMatch.source.id}, Activity Score: ${mostActiveMatch.activityScore}`);
    return mostActiveMatch.source.id;
  } catch (error) {
    if (DEBUG) console.error(`Error searching for player ${name}:`, error.response ? error.response.data : error.message);
    return null;
  }
}

// Function to fetch player UTR using their ID
async function fetchPlayerUTR(playerID, jwtToken) {
  try {
    const response = await axios.get(`https://app.utrsports.net/api/v2/player/${playerID}`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    const playerData = response.data;
    if (DEBUG) console.log(`Fetched UTR for ID ${playerID}: Singles: ${playerData.myUtrSingles}, Doubles: ${playerData.myUtrDoubles}`);
    return {
      name: playerData.displayName,
      singlesUTR: playerData.myUtrSingles,
      doublesUTR: playerData.myUtrDoubles,
      singlesProgress: playerData.myUtrProgressSingles,
      doublesProgress: playerData.myUtrProgressDoubles
    };
  } catch (error) {
    if (DEBUG) console.error(`Error fetching UTR for player ID ${playerID}:`, error.response ? error.response.data : error.message);
    return null;
  }
}

// Function to format UTR with reliability
function formatUTR(utr, progress) {
  if (utr == null) return 'N/A';
  const reliability = progress < 100 ? ` (${progress}% reliable)` : '';
  return `${utr}${reliability}`;
}

// Main function to process teams and players
(async () => {
  const jwtToken = await getUTRToken();
  if (!jwtToken) {
    console.error('Unable to proceed without a valid JWT token.');
    return;
  }

  for (const team of teams) {
    console.log(`**Team: ${team.name}**`);
    const teamPlayers = [];
    for (const playerName of team.players) {
      const playerID = await searchPlayerID(playerName, jwtToken);
      if (playerID) {
        const playerData = await fetchPlayerUTR(playerID, jwtToken);
        if (playerData) {
          teamPlayers.push(playerData);
        } else {
          teamPlayers.push({
            name: playerName,
            singlesUTR: null,
            doublesUTR: null,
            singlesProgress: null,
            doublesProgress: null
          });
        }
      } else {
        teamPlayers.push({
          name: playerName,
          singlesUTR: null,
          doublesUTR: null,
          singlesProgress: null,
          doublesProgress: null
        });
      }
    }

    // Calculate team averages with reliability check
    const reliableSinglesUTRs = teamPlayers.filter(p => p.singlesUTR > 0 && p.singlesProgress >= 100).map(p => p.singlesUTR);
    const reliableDoublesUTRs = teamPlayers.filter(p => p.doublesUTR > 0 && p.doublesProgress >= 100).map(p => p.doublesUTR);

    const avgSingles = reliableSinglesUTRs.length > 0 ? reliableSinglesUTRs.reduce((a, b) => a + b, 0) / reliableSinglesUTRs.length : null;
    const avgDoubles = reliableDoublesUTRs.length > 0 ? reliableDoublesUTRs.reduce((a, b) => a + b, 0) / reliableDoublesUTRs.length : null;

    // Print player data in a single line
    for (const player of teamPlayers) {
      const singlesInfo = formatUTR(player.singlesUTR, player.singlesProgress);
      const doublesInfo = formatUTR(player.doublesUTR, player.doublesProgress);
      console.log(`- **${player.name}**: Singles UTR: ${singlesInfo}, Doubles UTR: ${doublesInfo}`);
    }

    // Print team averages
    console.log(`**Team Averages:**`);
    console.log(`- Average Singles UTR: ${avgSingles ? avgSingles.toFixed(2) : 'N/A'}`);
    console.log(`- Average Doubles UTR: ${avgDoubles ? avgDoubles.toFixed(2) : 'N/A'}`);
    console.log('\n'); // Blank line between teams
  }
})();
