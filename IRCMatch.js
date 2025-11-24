class IRCMatch {
    constructor(red1, red2, blue1, blue2, winner = ""){
        this.red1 = red1;
        this.red2 = red2;
        this.blue1 = blue1;
        this.blue2 = blue2;
        this.winner = winner ?? "";
    }

    getRed1(){
        return this.red1;
    }
    getRed2(){
        return this.red2;
    }
    getBlue1(){
        return this.blue1;
    }
    getBlue2(){
        return this.blue2;
    }
    getWinner(){
        return this.winner;
    }  
    setWinner(winningAlliance){
        console.log("winning alliance " + winningAlliance);
        this.winner = winningAlliance;
        console.log(this.winner);
    }
}