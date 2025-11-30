import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, set, runTransaction , get, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

//firebase
const appSettings = {
    databaseURL: "https://test-game-d4c8e-default-rtdb.firebaseio.com"
}

const app = initializeApp(appSettings);
const database = getDatabase(app);


//base app consts
const startSection = document.getElementById("start");
//setup is for making a new competition
const setupSection = document.getElementById("setup");
//qmdisplay just displays the qms
const qmDisplaySection = document.getElementById("QMDisplay");
//playMatch is for running the actual match
const playMatchSection = document.getElementById("playMatch");
//endMatch is the end screen after the match (activated by both scorekeepers submitting)
const endMatchSection = document.getElementById("endMatch");
//alliance selection screen
const allianceSelectionSection = document.getElementById("allianceSelection");
//finals display screen
const finalsDisplaySection = document.getElementById("finalsDisplay");
//ending screen when finals are over
const finalResultsSection = document.getElementById("endScreen");
const numQMInputField = document.getElementById("numQMInputField");
const teamInputField = document.getElementById("teamInputField");
const loadCompButton = document.getElementById("loadComp");
const newCompButton = document.getElementById("newComp");
const addTeamButton = document.getElementById("addTeam");
const startCompetitionButton = document.getElementById("startCompetition");
const startQMButton = document.getElementById("startQM");
const matchScheduleButton = document.getElementById("matchSchedule");
const confirmAlliancesButton = document.getElementById("confirmAlliances");
const startFinalMatchButton = document.getElementById("startFinalMatch");
const resetAllianceSelectionButton = document.getElementById("resetAllianceSelection");
const teleopLength = 150;
const autoLength = 15;
const timeBtwnAutoTeleop = 1;
let teamArray = [];
let qmMatches = [];
let finalMatches = [];
let redFinalWins = 0;
let blueFinalWins = 0;
let numqms = 0;
//these start from 1 but the array starts from 0;
let currentQMNumber = 1;
let currentFinalMatchNumber = 1; 
let finals = false;
let autoPeriod = false;

let finalRed1 = null;
let finalRed2 = null;
let finalBlue1 = null;
let finalBlue2 = null;

//score constants
const leavePoints = 2;
const lowScrapPoints = 3;
const highScrapPoints = 5;
//points added if scrap was scored in auto
const autoScrapExtraPoints = 1;
const vaultPoints = 2;
const corePoints = 3;
const parkingPoints = 2;
const foulPoints = 4;

//current score variables
let redTotalScore = 0;
let redLeaveScore = 0;
//counts the number of scraps in auto for RP, not a point value
let redAutoScraps = 0;
let redHighBinScrapScore = 0;
let redLowBinScrapScore = 0;
let redVaultScrapScore = 0
let redCoreScore = 0;
let redParkScore = 0;
let redFouls = 0;
let blueTotalScore = 0;
let blueLeaveScore = 0;
//counts the number of scraps in auto for RP, not a point value
let blueAutoScraps = 0;
let blueHighBinScrapScore = 0;
let blueLowBinScrapScore = 0;
let blueVaultScrapScore = 0;
let blueCoreScore = 0;
let blueParkScore = 0;
let blueFouls = 0;

let recievedRedData = false;
let recievedBlueData = false;

let matchOver = false;
let lastMatch = null;

//data comes from firebase
//event listeners set the local variables when the data is updated
// RED ALLIANCE
const redLeaveScoreRef = ref(database, "redLeaveScore");
bindListener(redLeaveScoreRef, (val) => redLeaveScore = val);

const redAutoScrapsRef = ref(database, "redAutoScraps");
bindListener(redAutoScrapsRef, (val) => redAutoScraps = val);

const redHighBinScrapScoreRef = ref(database, "redHighBinScrapScore");
bindListener(redHighBinScrapScoreRef, (val) => redHighBinScrapScore = val);

const redLowBinScrapScoreRef = ref(database, "redLowBinScrapScore");
bindListener(redLowBinScrapScoreRef, (val) => redLowBinScrapScore = val);

const redVaultScrapScoreRef = ref(database, "redVaultScrapScore");
bindListener(redVaultScrapScoreRef, (val) => redVaultScrapScore = val);

const redCoreScoreRef = ref(database, "redCoreScore");
bindListener(redCoreScoreRef, (val) => redCoreScore = val);

const redParkScoreRef = ref(database, "redParkScore");
bindListener(redParkScoreRef, (val) => redParkScore = val);

const redFoulsRef = ref(database, "redFouls");
bindListener(redFoulsRef, (val) => redFouls = val);

// BLUE ALLIANCE
const blueLeaveScoreRef = ref(database, "blueLeaveScore");
bindListener(blueLeaveScoreRef, (val) => blueLeaveScore = val);

const blueAutoScrapsRef = ref(database, "blueAutoScraps");
bindListener(blueAutoScrapsRef, (val) => blueAutoScraps = val);

const blueHighBinScrapScoreRef = ref(database, "blueHighBinScrapScore");
bindListener(blueHighBinScrapScoreRef, (val) => blueHighBinScrapScore = val);

const blueLowBinScrapScoreRef = ref(database, "blueLowBinScrapScore");
bindListener(blueLowBinScrapScoreRef, (val) => blueLowBinScrapScore = val);

const blueVaultScrapScoreRef = ref(database, "blueVaultScore");
bindListener(blueVaultScrapScoreRef, (val) => blueVaultScrapScore = val);

const blueCoreScoreRef = ref(database, "blueCoreScore");
bindListener(blueCoreScoreRef, (val) => blueCoreScore = val);

const blueParkScoreRef = ref(database, "blueParkScore");
bindListener(blueParkScoreRef, (val) => blueParkScore = val);

const blueFoulsRef = ref(database, "blueFouls");
bindListener(blueFoulsRef, (val) => blueFouls = val);

const teamsRef = ref(database, "teams");
const qmsRef = ref(database, "qms");
const numqmsRef = ref(database, "numqms");

const recievedRedDataRef = ref(database, "redData");
bindListener(recievedRedDataRef, (val) => {
    recievedRedData = val;
    recieveDataSubmission();
});

const recievedBlueDataRef = ref(database, "blueData");
bindListener(recievedBlueDataRef, (val) => {
    recievedBlueData = val;
    recieveDataSubmission();
});

//if both alliance scorekeepers submit their data then move on to the end screen
function recieveDataSubmission(){
    if(!matchOver){
        //if scorekeepers try to submit the data before the match ends reject by setting the submission back to false
        //this keeps the scorekeeping tab open on the scorekeeping site and mitigates the effects of misclicks
        resetScorekeeperSubmissions();
    }
    if(playMatchSection.style.display == "block" && recievedBlueData == true && recievedRedData == true){
        playMatchSection.style.display = "none";
        endMatchSection.style.display = "block";
        endMatch();
    }
}

function resetScorekeeperSubmissions(){
    setData(recievedRedDataRef, false);
    setData(recievedBlueDataRef, false);
}

//set the values all to 0;
resetScore();

//interval for timer system
let countdownInterval = 0;

//a listener to update locally stored values to the database data when it is updated
//updates the score when a change is made
function bindListener(reference, callback){
    onValue(reference, (snapshot) => {
        callback(snapshot.val());
        updateScore();
    });
}

//increment the data point by the amount
function incrementData(reference, amount){
    runTransaction(reference, (currentValue) => {
        // currentValue may be null if not set yet
        return (currentValue || 0) + amount;
    })
    .then(() => {
        updateScore(); // update UI after the transaction
    })
    .catch((error) => {
        console.error("Transaction failed:", error);
    }); 
}

//view a single data point from firebase reference
//returns 0 if no data is found
function viewData(reference){
    return get(reference).then((snapshot) => {
        if(snapshot.exists())
            return snapshot.val();
        else return 0;
    })
    .catch((error) => {
        console.log("data viewing failed: ", error);
    });
}

//adds up the values corresponding to all of the keys
function viewDataSum(references){
    var sum = 0
    for(let i = 0; i < references.length; i++){
        sum += viewData(references[i]);
    }
    return sum;
}

//sets the new data directly to the value inputted
function setData(reference, newValue){
    set(reference, newValue)
    .catch((error) =>{
    console.log("setting data failed: ", error)});
}

//button listeners
loadCompButton.addEventListener("click", async function(){
    //if it finds saved qms it will leave off at the display screen for qms
    //does not save alliance selection or anything beyond, just the qms, teams, and max number of qms

    //Clear arrays
    teamArray = [];
    qmMatches = [];

    try {
        const [teamSnap, matchSnap, numQMSnap] = await Promise.all([
            get(teamsRef),
            get(qmsRef),
            get(numqmsRef),
        ]);
        const teamData = teamSnap.val();
        for(let i = 0; i < teamData.length; i++){
            //generic object with the data
            var team = teamData[i];
            //take the generic object and convert it back into an IRCTeam
            teamArray.push(new IRCTeam(team.name, team.id, team.totalRP, team.matchesPlayed, team.numQMs));
        }

        const matchData = matchSnap.val();
        for(let i = 0; i < matchData.length; i++){
            //generic object with the data
            var match = matchData[i];
            //take generic object and convert it back to an IRCMatch
            qmMatches.push(new IRCMatch(
                getIRCTeamFromID(match.red1ID),
                getIRCTeamFromID(match.red2ID),
                getIRCTeamFromID(match.blue1ID),
                getIRCTeamFromID(match.blue2ID),
                match.winner));
            //the current match is one more the last match to have an outcome
            //an additional one is added because the array starts from 0 so it becomes a +2
            if(!(match.winner === "")) currentQMNumber = i + 2;
        }
        numqms = numQMSnap.val();

        startSection.style.display = "none";
        qmDisplaySection.style.display = "block";
        displayQMs();
    } catch(error) {
        console.error("failed to load previous data: ", error);
    }
});

function getIRCTeamFromID(id){
    for (let i = 0; i < teamArray.length; i++){
        if(teamArray[i].getID() === id) return teamArray[i];
    }
    return null;
}

newCompButton.addEventListener("click", function(){
    //for a new comp just go directly to setup
    startSection.style.display = "none";
    setupSection.style.display = "block";
})

addTeamButton.addEventListener("click", function(){
    teamArray.push(new IRCTeam(teamInputField.value));
    teamInputField.value = "";
    renderList();
});
startCompetitionButton.addEventListener("click", function(){
    //set IDs once all teams added(accounts for team removal and addition)
    for(let i = 0; i < teamArray.length; i++){
        teamArray[i].setID(i);
    }
    //get the number of qms from the input field
    numqms = numQMInputField.value;
    generateQMs();
    
    updateSave();

    setupSection.style.display = "none";
    qmDisplaySection.style.display = "block";
    displayQMs();
});

//save the game data scored in firebase (qms, teams and max qms)
function updateSave(){
    const savedTeams = teamArray.map(team => ({
        id: team.id,
        name: team.getName(),
        totalRP: team.getTotalRP(),
        matchesPlayed: team.getMatchesPlayed(),
        numQMs: team.getNumQMs()
    }));
    setData(teamsRef, savedTeams);
    const savedMatches = qmMatches.map(match => ({
        red1ID: match.getRed1().getID(),
        red2ID: match.getRed2().getID(),
        blue1ID: match.getBlue1().getID(),
        blue2ID: match.getBlue2().getID(),
        winner: match.getWinner(),
    }));
    setData(qmsRef, savedMatches)
    setData(numqmsRef, numqms);
}

startQMButton.addEventListener("click", function(){
    qmDisplaySection.style.display = "none";
    //if qm played was not the last qm play the next qm
    if(currentQMNumber <= numqms){
        playMatchSection.style.display = "block";
        startMatch(qmMatches[currentQMNumber - 1]);
        currentQMNumber++;
    }
    //go to alliance selection if done with qms
    else{
        allianceSelectionSection.style.display = "block";
        finals = true;
        //dont fill in red 1 automatically b/c could be ties
        displayAllianceSelection(teamArray.slice(0, teamArray.length));
    }
});
matchScheduleButton.addEventListener("click", function(){
    endMatchSection.style.display = "none";
    if(finals){
        finalsDisplaySection.style.display = "block";
        displayFinalMatches();
        return;
    }
    displayQMs();
    qmDisplaySection.style.display = "block";
});
confirmAlliancesButton.addEventListener("click", function(){
    allianceSelectionSection.style.display = "none";
    finalsDisplaySection.style.display = "block";
    //add the first 3 final matches to the array
    addFinalMatch();
    addFinalMatch();
    addFinalMatch();
    displayFinalMatches();
});
startFinalMatchButton.addEventListener("click", function(){
    finalsDisplaySection.style.display = "none";
    playMatchSection.style.display = "block";
    startMatch(finalMatches[currentFinalMatchNumber - 1]);
    currentFinalMatchNumber++;
});
resetAllianceSelectionButton.addEventListener("click", function(){
    finalRed1 = null;
    finalRed2 = null;
    finalBlue1 = null;
    finalBlue2 = null;
    displayAllianceSelection(teamArray.slice(0, teamArray.length)); 
});

function renderList(){
    const teamArrayDiv = document.getElementById("list")
    teamArrayDiv.innerHTML = "";

    teamArray.forEach((team, index) => {
        const container = document.createElement("div");
        container.classList.add("datatable");

        const name = document.createElement("span");
        name.textContent = team.getName();
        name.classList.add(team.getName());
        name.classList.add("team");

        const removeButton = document.createElement("button");
        removeButton.className = "removeButton";
        removeButton.textContent = "Remove";
        removeButton.onclick = () => {
            teamArray.splice(index, 1);
            renderList();
        }
        container.appendChild(name);
        container.appendChild(removeButton);
        teamArrayDiv.appendChild(container);
    })
}

function generateQMs(){
    var leastNumQMs = 0;
    for(let i = 0; i < numqms; i++){
        var leastQMs = [];
        var alternatives = [];
        for(let i = 0; i < teamArray.length; i++){
            if(teamArray[i].getNumQMs() == leastNumQMs) leastQMs.push(teamArray[i]);
            else alternatives.push(teamArray[i]);
        }
        var selected = [];
        if(leastQMs.length >= 4){
            shuffleArray(leastQMs);
            selected = leastQMs.slice(0, 4);
        }
        else{
            leastNumQMs++;
            selected = leastQMs;
            var iterations = 4 - selected.length
            for(let i = 0; i < iterations; i++){
                selected.push(alternatives[i]);
            }
        }
        for(let i = 0; i < selected.length; i++){
            selected[i].incrementNumQMs();
        }
        if(leastQMs.length <= 4) leastNumQMs++;
        qmMatches.push(new IRCMatch(selected[0], selected[1], selected[2], selected[3]));
    }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function displayQMs(){
    const matchDiv = document.getElementById("matchDiv");
    const rankingsDiv = document.getElementById("rankingsDiv");
    matchDiv.innerHTML = "";
    rankingsDiv.innerHTML = "";

    teamArray = teamArray.sort((a, b) => b.getAvgRP() - a.getAvgRP());
    teamArray.forEach((team, index) => {
        const container = document.createElement("div");
        container.classList.add("datatable");
        container.classList.add(team.getName());

        const rank = document.createElement("span");
        rank.textContent = index + 1 + ".";

        const teamName = document.createElement("span");
        teamName.textContent = team.getName();

        const teamRP = document.createElement("span");
        teamRP.textContent = (team.getAvgRP() + "").slice(0,4);

        container.appendChild(rank);
        container.appendChild(teamName);
        container.appendChild(teamRP);
        rankingsDiv.appendChild(container);
    })

    qmMatches.forEach((match, index) => {
        const container = document.createElement("div");
        container.classList.add("datatable");
        container.classList.add(match.getWinner()+"Class");

        const name = document.createElement("span");
        name.textContent = "QM " + (index + 1);

        const red1 = document.createElement("span");
        red1.textContent = match.getRed1().getName();
        red1.classList.add(match.getRed1().getName());
        red1.classList.add("team");

        const red2 = document.createElement("span");
        red2.textContent = match.getRed2().getName();
        red2.classList.add(match.getRed2().getName());
        red2.classList.add("team");

        const blue1 = document.createElement("span");
        blue1.textContent = match.getBlue1().getName();
        blue1.classList.add(match.getBlue1().getName());
        blue1.classList.add("team");

        const blue2 = document.createElement("span");
        blue2.textContent = match.getBlue2().getName();
        blue2.classList.add(match.getBlue2().getName());
        blue2.classList.add("team");

        const winningAlliance = document.createElement("span");
        winningAlliance.textContent = match.getWinner();

        container.appendChild(name);
        container.appendChild(red1);
        container.appendChild(red2);
        container.appendChild(blue1);
        container.appendChild(blue2);
        container.appendChild(winningAlliance);
        matchDiv.appendChild(container);
    })

    if(currentQMNumber > numqms){
        //change button to alliance selection button when qms are over
        //the button has logic for this implemented
        startQMButton.textContent = "Alliance Selection";
    }
}

//adds a match object to the final match array with the two final alliances
function addFinalMatch(){
    finalMatches.push(new IRCMatch(finalRed1, finalRed2, finalBlue1, finalBlue2));
}

function displayFinalMatches(){
    const matchDiv = document.getElementById("finalMatchDiv");
    matchDiv.innerHTML = "";

    // //display alliances
    const redAlliance1 = document.getElementById("finalRed1Display");
    redAlliance1.classList = [];
    redAlliance1.innerHTML = "";
    redAlliance1.classList.add(finalRed1.getName());
    redAlliance1.textContent = finalRed1.getName();
    redAlliance1.classList.add("team");

    const redAlliance2 = document.getElementById("finalRed2Display");
    redAlliance2.classList = [];
    redAlliance2.innerHTML = "";
    redAlliance2.classList.add(finalRed2.getName());
    redAlliance2.textContent = finalRed2.getName();
    redAlliance2.classList.add("team");

    const blueAlliance1 = document.getElementById("finalBlue1Display");
    blueAlliance1.classList = [];
    blueAlliance1.innerHTML = "";
    blueAlliance1.classList.add(finalBlue1.getName());
    blueAlliance1.textContent = finalBlue1.getName();
    blueAlliance1.classList.add("team");

    const blueAlliance2 = document.getElementById("finalBlue2Display");
    blueAlliance2.classList = [];
    blueAlliance2.innerHTML = "";
    blueAlliance2.classList.add(finalBlue2.getName());
    blueAlliance2.textContent = finalBlue2.getName();
    blueAlliance2.classList.add("team");

    finalMatches.forEach((match, index) => {
        const container = document.createElement("div");
        container.classList.add("datatable");
        container.classList.add(match.getWinner()+"Class");

        const name = document.createElement("span");
        name.textContent = "QM " + (index + 1);

        const red1 = document.createElement("span");
        red1.textContent = match.getRed1().getName();
        red1.classList.add(match.getRed1().getName());
        red1.classList.add("team");

        const red2 = document.createElement("span");
        red2.textContent = match.getRed2().getName();
        red2.classList.add(match.getRed2().getName());
        red2.classList.add("team");

        const blue1 = document.createElement("span");
        blue1.textContent = match.getBlue1().getName();
        blue1.classList.add(match.getBlue1().getName());
        blue1.classList.add("team");

        const blue2 = document.createElement("span");
        blue2.textContent = match.getBlue2().getName();
        blue2.classList.add(match.getBlue2().getName());
        blue2.classList.add("team");

        const winningAlliance = document.createElement("span");
        winningAlliance.textContent = match.getWinner();

        container.appendChild(name);
        container.appendChild(red1);
        container.appendChild(red2);
        container.appendChild(blue1);
        container.appendChild(blue2);
        container.appendChild(winningAlliance);
        matchDiv.appendChild(container);
    })

    if(redFinalWins == 2){
        finalsDisplaySection.style.display = "none";
        finalResultsSection.style.display = "block";
        displayFinalResults("Red");
    }
    else if(blueFinalWins == 2){
        finalsDisplaySection.style.display = "none";
        finalResultsSection.style.display = "block";
        displayFinalResults("Blue");
    }

    //add a new match if no one has won but reached the end of the list(solves ties)
    if(currentFinalMatchNumber > finalMatches.length){
        addFinalMatch();
    }
}

function displayFinalResults(winningAlliance){
    if(winningAlliance === "Red"){
        // RED wins
        document.getElementById("winnerBox").classList.add("RedClass");
        document.getElementById("winningAlliance").textContent = "Red";

        //Winner team 1
        const winner1 = document.getElementById("winner1")
        winner1.textContent = finalRed1.getName();
        winner1.classList.add(finalRed1.getName());
        winner1.classList.add("team");

        //Winner team 2
        const winner2 = document.getElementById("winner2")
        winner2.textContent = finalRed2.getName();
        winner2.classList.add(finalRed2.getName());
        winner2.classList.add("team");

        // BLUE is the finalist
        document.getElementById("finalistBox").classList.add("BlueClass");
        document.getElementById("finalistAlliance").textContent = "Blue";

        //Finalist team 1
        const finalist1 = document.getElementById("finalist1")
        finalist1.textContent = finalBlue1.getName();
        finalist1.classList.add(finalBlue1.getName());
        finalist1.classList.add("team");

        //Finalist team 2
        const finalist2 = document.getElementById("finalist2")
        finalist2.textContent = finalBlue2.getName();
        finalist2.classList.add(finalBlue2.getName());
        finalist2.classList.add("team");
    }
    else{
        // BLUE wins
        document.getElementById("winnerBox").classList.add("BlueClass");
        document.getElementById("winningAlliance").textContent = "Blue";

        // Winner team 1
        const winner1 = document.getElementById("winner1");
        winner1.textContent = finalBlue1.getName();
        winner1.classList.add(finalBlue1.getName());
        winner1.classList.add("team");

        // Winner team 2
        const winner2 = document.getElementById("winner2");
        winner2.textContent = finalBlue2.getName();
        winner2.classList.add(finalBlue2.getName());
        winner2.classList.add("team");

        // RED is the finalist now
        document.getElementById("finalistBox").classList.add("RedClass");
        document.getElementById("finalistAlliance").textContent = "Red";

        // Finalist team 1
        const finalist1 = document.getElementById("finalist1");
        finalist1.textContent = finalRed1.getName();
        finalist1.classList.add(finalRed1.getName());
        finalist1.classList.add("team");

        // Finalist team 2
        const finalist2 = document.getElementById("finalist2");
        finalist2.textContent = finalRed2.getName();
        finalist2.classList.add(finalRed2.getName());
        finalist2.classList.add("team");
    }
}

//param allianceSelectionChoices remaining alliances to select
function displayAllianceSelection(allianceSelectionChoices){
    const selectionsDiv = document.getElementById("selectionsDiv");
    selectionsDiv.innerHTML = "";

    const finalRed1Text = document.getElementById("finalRed1");
    if(finalRed1 != null){
        finalRed1Text.classList = [];
        finalRed1Text.textContent = finalRed1.getName();
        finalRed1Text.classList.add(finalRed1.getName());
        finalRed1Text.classList.add("team");
    }
    else{finalRed1Text.textContent = ""};
    const finalRed2Text = document.getElementById("finalRed2");
    if(finalRed2 != null){
        finalRed2Text.classList = [];
        finalRed2Text.textContent = finalRed2.getName();
        finalRed2Text.classList.add(finalRed2.getName());
        finalRed2Text.classList.add("team");
    }
    else finalRed2Text.textContent = "";
    const finalBlue1Text = document.getElementById("finalBlue1");
    if(finalBlue1 != null) {
        finalBlue1Text.classList = [];
        finalBlue1Text.textContent = finalBlue1.getName();
        finalBlue1Text.classList.add(finalBlue1.getName());
        finalBlue1Text.classList.add("team");
    }
    else finalBlue1Text.textContent = "";
    const finalBlue2Text = document.getElementById("finalBlue2");
    if(finalBlue2 != null){
        finalBlue2Text.classList = [];
        finalBlue2Text.textContent = finalBlue2.getName();
        finalBlue2Text.classList.add(finalBlue2.getName());
        finalBlue2Text.classList.add("team");
    }
    else finalBlue2Text.textContent = "";

    allianceSelectionChoices.forEach((team, index) => {
        const container = document.createElement("div");
        container.classList.add("datatable");

        //team name
        const name = document.createElement("span");
        name.textContent = team.getName();
        name.classList.add(team.getName());
        name.classList.add("team");
        container.appendChild(name);

        //team RP
        const rankingPoints = document.createElement("span");
        rankingPoints.textContent = (team.getAvgRP() + "").slice(0, 4);
        //use the team class to center it
        rankingPoints.classList.add("team");
        container.appendChild(rankingPoints);

        //select button
        if(finalBlue2 == null){
            const addButton = document.createElement("button");
            addButton.textContent = "Select";
            addButton.onclick = () => {
                selectTeam(allianceSelectionChoices[index]);
                allianceSelectionChoices.splice(index, 1);
                displayAllianceSelection(allianceSelectionChoices);
            }
            container.appendChild(addButton);
        }
        selectionsDiv.appendChild(container);
    })
}

function selectTeam(team){
    if(finalRed1 == null) finalRed1 = team;
    else if(finalRed2 == null) finalRed2 = team;
    else if(finalBlue1 == null) finalBlue1 = team;
    else finalBlue2 = team;
}

function startMatch(match){
    matchOver = false;
    resetScore();
    updateScore();
    resetScorekeeperSubmissions();
    //display matchtitle
    const matchTitle = document.getElementById("matchTitle");
    var titleBaseText = "Qualification Match " + currentQMNumber;
    if(finals) titleBaseText = "Elimination Match " + currentFinalMatchNumber;
    matchTitle.textContent = titleBaseText;

    //display alliances
    const redAlliance1 = document.getElementById("redAlliance1");
    redAlliance1.classList = [];
    redAlliance1.innerHTML = "";
    redAlliance1.classList.add(match.getRed1().getName());
    redAlliance1.textContent = match.getRed1().getName();
    redAlliance1.classList.add("team");

    const redAlliance2 = document.getElementById("redAlliance2");
    redAlliance2.classList = [];
    redAlliance2.innerHTML = "";
    redAlliance2.classList.add(match.getRed2().getName());
    redAlliance2.textContent = match.getRed2().getName();
    redAlliance2.classList.add("team");

    const blueAlliance1 = document.getElementById("blueAlliance1");
    blueAlliance1.classList = [];
    blueAlliance1.innerHTML = "";
    blueAlliance1.classList.add(match.getBlue1().getName());
    blueAlliance1.textContent = match.getBlue1().getName();
    blueAlliance1.classList.add("team");

    const blueAlliance2 = document.getElementById("blueAlliance2");
    blueAlliance2.classList = [];
    blueAlliance2.innerHTML = "";
    blueAlliance2.classList.add(match.getBlue2().getName());
    blueAlliance2.textContent = match.getBlue2().getName();
    blueAlliance2.classList.add("team");

    runAuto(match);
}

function runAuto(match){
    //play sound effect
    displayTimer(autoLength);
    document.getElementById("autoStart").play();
    //set autoPeriod to true (used to account for scoring bonuses in auto)
    autoPeriod = true;
    let autoTimeRemaining = autoLength;
    countdownInterval = setInterval(() => {
        autoTimeRemaining--;
        displayTimer(autoTimeRemaining);
        if(autoTimeRemaining <= 0){
            displayTimer(0);
            clearInterval(countdownInterval);
            countdownInterval = null;
            runPause(match);
            return;
        }
    },1000)
}

function runPause(match){
    //play start of teleop / end of auto sound
    document.getElementById("autoEnd").play();
    let pauseTimeRemaining = timeBtwnAutoTeleop;
    countdownInterval = setInterval(() => {
        pauseTimeRemaining--;
        displayTimer(teleopLength);
        if(pauseTimeRemaining <= 0){
            clearInterval(countdownInterval);
            countdownInterval = null;
            runTeleop(match);
            return;
        }
    },1000)
}

function runTeleop(match){
    //set autoPeriod to true (used to account for scoring bonuses in auto)
    autoPeriod = false;
    let teleopTimeRemaining = teleopLength;
    countdownInterval = setInterval(() => {
        teleopTimeRemaining--;
        displayTimer(teleopTimeRemaining);
        if(teleopTimeRemaining == 30){
            //play endgame sound effect
            document.getElementById("endgameStart").play();
        }
        if(teleopTimeRemaining <= 0){
            //play end of match sound effect
            document.getElementById("teleopEnd").play();
            displayTimer(0);
            clearInterval(countdownInterval);
            countdownInterval = null;
            //allows scorekeepers to submit
            matchOver = true;
            lastMatch = match;
            return;
        }
    },1000)
}

//triggered by the two scorekeepers submitting their data
function endMatch(){
    playMatchSection.style.display = "none";
    endMatchSection.style.display = "block";

    //match title
    const matchTitle = document.getElementById("matchTitleEnd");
    //subtract 1 because have already incremented to the next match
    var titleBaseText = "Qualification Match " + (currentQMNumber - 1);
    if(finals) titleBaseText = "Elimination Match " + currentFinalMatchNumber;
    matchTitle.textContent = titleBaseText;

    //win RP calculations
    var winner = "Tie";
    var redRP = 0;
    var blueRP = 0;
    if(redTotalScore > blueTotalScore){
        winner = "Red";
        redRP = 3;
        if(finals) redFinalWins++;
    }
    else if(blueTotalScore > redTotalScore){
        winner = "Blue";
        blueRP = 3;
        if(finals) blueFinalWins++;
    }
    else{
        redRP = 1;
        blueRP = 1;
    }

    //updateScore with "End" parameter will update the end screen elements instead of the regular ones(during the match ones)
    updateScore("End");

    //winner display
    const winnerText = document.getElementById("winner");
    winnerText.classList = [];
    winnerText.innerHTML = "";
    winnerText.classList.add(winner + "Class");
    if(!(winner === "Tie")) winnerText.textContent = winner + " Wins!";
    else winnerText.textContent = "Tie";

    //display alliances
    const redAlliance1 = document.getElementById("redAlliance1End");
    redAlliance1.classList = [];
    redAlliance1.innerHTML = "";
    redAlliance1.classList.add(lastMatch.getRed1().getName());
    redAlliance1.textContent = lastMatch.getRed1().getName();
    redAlliance1.classList.add("team");

    const redAlliance2 = document.getElementById("redAlliance2End");
    redAlliance2.classList = [];
    redAlliance2.innerHTML = "";
    redAlliance2.classList.add(lastMatch.getRed2().getName());
    redAlliance2.textContent = lastMatch.getRed2().getName();
    redAlliance2.classList.add("team");

    const blueAlliance1 = document.getElementById("blueAlliance1End");
    blueAlliance1.classList = [];
    blueAlliance1.innerHTML = "";
    blueAlliance1.classList.add(lastMatch.getBlue1().getName());
    blueAlliance1.textContent = lastMatch.getBlue1().getName();
    blueAlliance1.classList.add("team");

    const blueAlliance2 = document.getElementById("blueAlliance2End");
    blueAlliance2.classList = [];
    blueAlliance2.innerHTML = "";
    blueAlliance2.classList.add(lastMatch.getBlue2().getName());
    blueAlliance2.textContent = lastMatch.getBlue2().getName();
    blueAlliance2.classList.add("team");

    //other RP calculations and displays
    if(hasAutoRP(redLeaveScore, redAutoScraps)){
        redRP++;
        document.getElementById("redAutoRP").textContent = "Autonomous RP :" + " Y";
    }
    else document.getElementById("redAutoRP").textContent = "Autonomous RP :" + " N";
    if(hasScrapRP(redLowBinScrapScore, redHighBinScrapScore, redVaultScrapScore, blueVaultScrapScore)){
        redRP++;
        document.getElementById("redScrapRP").textContent = "Scrap RP :" + " Y";
    }
    else document.getElementById("redScrapRP").textContent = "Scrap RP :" + " N";
    if(hasEndgameRP(redCoreScore, redParkScore)){
        redRP++;
        document.getElementById("redEndRP").textContent = "Endgame RP :" + " Y";
    }
    else document.getElementById("redEndRP").textContent = "Endgame RP :" + " N";
    if(hasAutoRP(blueLeaveScore, blueAutoScraps)){
        blueRP++;
        document.getElementById("blueAutoRP").textContent = "Autonomous RP :" + " Y";
    }
    else document.getElementById("blueAutoRP").textContent = "Autonomous RP :" + " N";
    if(hasScrapRP(blueLowBinScrapScore, blueHighBinScrapScore, blueVaultScrapScore, redVaultScrapScore)){
        blueRP++;
        document.getElementById("blueScrapRP").textContent = "Scrap RP :" + " Y";
    }
    else document.getElementById("blueScrapRP").textContent = "Scrap RP :" + " N";
    if(hasEndgameRP(blueCoreScore, blueParkScore)){
        blueRP++;
        document.getElementById("blueEndRP").textContent = "Endgame RP :" + " Y";
    }
    else document.getElementById("blueEndRP").textContent = "Endgame RP :" + " N";
    document.getElementById("redRP").textContent = "RP " + redRP;
    document.getElementById("blueRP").textContent = "RP " + blueRP;
    lastMatch.getRed1().addMatchData(redRP);
    lastMatch.getRed2().addMatchData(redRP);
    lastMatch.getBlue1().addMatchData(blueRP);
    lastMatch.getBlue2().addMatchData(blueRP);
    lastMatch.setWinner(winner);
    //update the save after calculating the winner of a match and the rp of the teams
    updateSave();
}

function hasAutoRP(leaveScore, autoScraps){
    if(leaveScore / leavePoints >= 2 && autoScraps > 0) return true;
    return false; 
}

function hasScrapRP(lowScrapScore, highScrapScore, vaultScrapScore, otherAllianceVaultScrapScore){
    var requirement = 4;
    if(vaultScrapScore > 0 && otherAllianceVaultScrapScore > 1) requirement = 2;
    return lowScrapScore/lowScrapPoints >= requirement && highScrapScore/highScrapPoints >= requirement; 
}

function hasEndgameRP(coreScore, parkScore){
    return coreScore + parkScore >= 5;
}

function displayTimer(timeSeconds){
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds % 60;

    document.getElementById("timer").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

//the match ending screen has different ids so the parameter adds a value to the base string.
//this allows it to access the different ids
//to do this use "End" as the parameter
function updateScore(end = ""){
    redTotalScore = redLeaveScore + redLowBinScrapScore + redHighBinScrapScore + redVaultScrapScore + redCoreScore + redParkScore + blueFouls;
    document.getElementById("red" + end +"Score").textContent = redTotalScore;

    document.getElementById("red" + end + "LeaveScore").textContent = "LEAVE: " + redLeaveScore;
    document.getElementById("red" + end + "LowScrapScore").textContent = "LOW BIN: " + redLowBinScrapScore;
    document.getElementById("red" + end + "HighScrapScore").textContent = "HIGH BIN: " + redHighBinScrapScore;
    document.getElementById("red" + end + "VaultScrapScore").textContent = "VAULT: " + redVaultScrapScore;
    document.getElementById("red" + end + "CoreScore").textContent = "CORE: " + redCoreScore;
    document.getElementById("red" + end + "ParkScore").textContent = "PARK: " + redParkScore;
    //award points to red for blue's fouls
    document.getElementById("red" + end + "FoulScore").textContent = "FOUL: " + blueFouls;
    
    blueTotalScore = blueLeaveScore + blueLowBinScrapScore + blueHighBinScrapScore + blueVaultScrapScore + blueCoreScore + blueParkScore + redFouls;
    document.getElementById("blue" + end + "Score").textContent = blueTotalScore;

    document.getElementById("blue" + end + "LeaveScore").textContent = "LEAVE: " + blueLeaveScore;
    document.getElementById("blue" + end + "LowScrapScore").textContent = "LOW BIN: " + blueLowBinScrapScore;
    document.getElementById("blue" + end + "HighScrapScore").textContent = "HIGH BIN: " + blueHighBinScrapScore;
    document.getElementById("blue" + end + "VaultScrapScore").textContent = "VAULT: " + blueVaultScrapScore;
    document.getElementById("blue" + end + "CoreScore").textContent = "CORE: " + blueCoreScore;
    document.getElementById("blue" + end + "ParkScore").textContent = "PARK: " + blueParkScore;

    // award points to blue for red's fouls
    document.getElementById("blue" + end + "FoulScore").textContent = "FOUL: " + redFouls;
}

function resetScore(){
    //set the total scores to 0(just variables)
    redTotalScore = 0;
    blueTotalScore = 0;

    //reset all of the score data in firebase to 0
    setData(redLeaveScoreRef, 0);
    setData(redAutoScrapsRef, 0);
    setData(redHighBinScrapScoreRef, 0);
    setData(redLowBinScrapScoreRef, 0);
    setData(redVaultScrapScoreRef, 0);
    setData(redCoreScoreRef, 0);
    setData(redParkScoreRef, 0);
    setData(redFoulsRef, 0);
    setData(blueLeaveScoreRef, 0);
    setData(blueAutoScrapsRef, 0);
    setData(blueHighBinScrapScoreRef, 0);
    setData(blueLowBinScrapScoreRef, 0);
    setData(blueVaultScrapScoreRef, 0);
    setData(blueCoreScoreRef, 0);
    setData(blueParkScoreRef, 0);
    setData(blueFoulsRef, 0);
}
