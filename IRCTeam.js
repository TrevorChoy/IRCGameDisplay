class IRCTeam {
    // constructor(teamName){
    //     this.teamName = teamName;
    //     this.totalRP = 0;
    //     this.matchesPlayed = 0;
    //     this.numQMs = 0;
    //     this.id = id;
    // }

    constructor(teamName, id = 0, totalRP = 0.0, matchesPlayed = 0.0, numQMs = 0){
        this.teamName = teamName;
        this.totalRP = totalRP;
        this.matchesPlayed = matchesPlayed;
        this.numQMs = numQMs;
        this.id = id;
    }

    getID(){
        return this.id;
    }

    setID(id){
        this.id = id;
    }

    getName(){
        return this.teamName;
    }

    getTotalRP(){
        return this.totalRP;
    }

    getMatchesPlayed(){
        return this.matchesPlayed;
    }

    addMatchData(matchRP){
        this.totalRP += matchRP;
        this.matchesPlayed++;
    }

    getAvgRP(){
        if (this.matchesPlayed === 0.0) return 0.0;
        return this.totalRP/this.matchesPlayed;
    }

    getNumQMs(){
        return this.numQMs;
    }

    incrementNumQMs(){
        this.numQMs++;
    }
}