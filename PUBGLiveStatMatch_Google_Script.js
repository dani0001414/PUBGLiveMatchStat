var cache = CacheService.getScriptCache();

/**This function of the script need to be execute every 5 or 10 minutes!*/
function pubgStat() {
    /**Declaration*/
    var Array = [];
    var MatchArrays = [];
    var stats = [];
    var outTable = [];
    var oldCreatedAt = 0;

    var streamUserID = "<STREAMER-USERID>";  //Example TheVR Stream ID: 63493039
    var twitchAppClientID ="<TWITCH-APP-CLIENT-ID>";
    var PUBGPlayer = "<TWITCH-STREAMER-PUBG-ACCOUNT-NAME>";  //Example: TheVRJani
    var PUBGApiToken = "<PUBG-API-APP-TOKEN>";

    /**Live Data Fetch*/
    var url_helix = "https://api.twitch.tv/helix/streams?user_id="+streamUserID;     //Example TheVR Stream ID: 63493039

    var headers = {
        'Client-ID': twitchAppClientID,
    }

    var options = {
        'method': 'get',
        'contentType': 'application/json',
        'headers': headers,
    };

    var liveData = UrlFetchApp.fetch(url_helix, options);
    liveData = JSON.parse(liveData);
    var liveStatus = "offline";
    var streamStart = null;
    var gameID;
    var gameIsPUBG = "false";
    
    if (liveData.data.length > 0) {
        gameID = liveData.data['0'].game_id
        liveStatus = liveData.data['0'].type;
        streamStart = Timestamp(liveData.data['0'].started_at);
        if(gameID == 493057){ gameIsPUBG = "true"}
    } 
    /******************************************************************* */

    /**We Start Fetch the PUBG API Datas when the streamer online and play PUBG*/
    if ((liveStatus == "live")&(gameIsPUBG == "true")) {
        /**Read the cached data. At the begening they are equals with null */
        outTable = JSON.parse(cache.get("formatedDiv"));
        var oldCreatedAt = cache.get("createdAt");

        /**if the cache variables equals null we fill with the following datas*/
        if (oldCreatedAt == null) {
            oldCreatedAt = streamStart;
        }

        oldCreatedAt = parseInt(oldCreatedAt, 10);

        if (outTable == null) {
            outTable = [];
        }


        /**Fetch match iformation from the streamer PUBG Account name. */
        var playerURL = "https://api.pubg.com/shards/pc-eu/players?filter[playerNames]="+PUBGPlayer;

        var headers = {
            'accept': 'application/vnd.api+json',
            'authorization': PUBGApiToken,
        }

        var options = {
            'method': 'get',
            'contentType': 'application/json',
            'headers': headers,
        };

        var playerInfo = UrlFetchApp.fetch(playerURL, options);
        var pubgUserID = JSON.parse(playerInfo).data["0"].id;
        var playerInfo = JSON.parse(playerInfo).data["0"].relationships.matches.data;

        /**Fetch the PUBG Player matches while the matches created time newer than the oldCreated time which is at the begening equals with the live start time and later the last fetched match created time.*/
        /**The datas what we need, put into a new array*/
        var j = 0;

        do {
            Array = [];
            var matchurl = "https://api.pubg.com/shards/pc-eu/matches/" + playerInfo[j].id;
            var matchstat = UrlFetchApp.fetch(matchurl, options);
            matchstat = JSON.parse(matchstat);

            Array.createdAt = Timestamp(matchstat.data.attributes.createdAt);
            Array.gameMode = matchstat.data.attributes.gameMode;
            if (matchstat.data.attributes.mapName == "Erangel_Main") { Array.mapName = "Erangel"; }
            if (matchstat.data.attributes.mapName == "Desert_Main") { Array.mapName = "Miramar"; }
            if (matchstat.data.attributes.mapName == "Savage_Main") { Array.mapName = "Sanhok"; }
            Array.titleId = matchstat.data.attributes.type;
            Array.duration = matchstat.data.attributes.duration;
            Array.formatedStartTime = TimeConvert(matchstat.data.attributes.createdAt);


            matchstat = matchstat.included;
            var length = Object.keys(matchstat).length;

            for (var i = 0; i < length; i++) {
                stats = matchstat[i].attributes.stats;
                if (matchstat[i].type == "participant") {
                    var userid = stats.playerId;
                    if (userid == pubgUserID) {
                        Array.stats = stats;
                        Array.formatedMatchElapsed = MinutesFromSeconds(Array.stats.timeSurvived);
                    }
                }
            }
            MatchArrays.push(Array);
            j++;
        } while (Array.createdAt > oldCreatedAt) 

        /**Becouse of the PUBG API newest object starts at the begening of the JSON and we stored like this, we need to read inversely the created match array. We dont need the last inappropriate array item at the Array due to the do while effect.  */
        var j = Object.keys(MatchArrays).length - 2;

        do {
            if (j == -1) { break; } //Ha a fenti hátultesztelős ciklusban egy feltétel sem igaz akkor is van egy elem amit beletesz a tömbökbe. Viszont az 1-2=-1 miatt ki kell ugranunk a ciklusból.

            var sortId = outTable.length + 1;
            if (MatchArrays[j].stats.winPlace == 1) {
                MatchArrays[j].stats.winPlace = "<img src=\"https://dani0001414.github.io/TheVRMobilMenetrend/chickendiner.svg\" class=\"aspect__fill\" width=\"17\">";
            }
            var formatedDiv = "<div style=\"font-family: 'Squada One', cursive, sans-serif; width:320px; background-color: #fbc22d; border:1px solid #b38100; color: #262626;border-top: 0px solid\">" + sortId + ". Meccs | " + MatchArrays[j].mapName + " | " + MatchArrays[j].gameMode + "</div>  <div style=\" font-family: 'Squada One', cursive, sans-serif; width:322px; color: #8d8d8d\" >  <div style=\"float: left; width: 107px; box-sizing: border-box; background-color: #4b4b4b; border:1px solid #8d8d8d; border-top: 0px solid\">Kill</div> <div style=\"float: left; width: 107px; box-sizing: border-box; background-color: #4b4b4b; border:1px solid #8d8d8d; border-top: 0px solid; border-left: 0px solid; border-right: 0px solid\">Assist</div> <div style=\"float: left; width: 108px; box-sizing: border-box; background-color: #4b4b4b; border:1px solid #8d8d8d; border-top: 0px solid\">Helyezés</div> <br style=\"clear: left;\" /> </div> <div style=\" font-family: 'Squada One', cursive, sans-serif; width:322px; color: #8d8d8d\"> <div style=\"float: left; width: 107px; box-sizing: border-box; background-color: #262626; border:1px solid #8d8d8d; border-top: 0px solid\">" + MatchArrays[j].stats.kills + "</div> <div style=\"float: left; width: 107px; box-sizing: border-box; background-color: #262626; border:1px solid #8d8d8d; border-top: 0px solid; border-left: 0px solid; border-right: 0px solid\">" + MatchArrays[j].stats.assists + "</div> <div style=\"float: left; width: 108px; box-sizing: border-box; background-color: #262626; border:1px solid #8d8d8d; border-top: 0px solid\">" + MatchArrays[j].stats.winPlace + "</div> <br style=\"clear: left;\" /></div>   <div style=\" font-family: 'Squada One', cursive, sans-serif; width:322px; color: #8d8d8d\" >  <div style=\"float: left; width: 161px; box-sizing: border-box; background-color: #4b4b4b; border:1px solid #8d8d8d; border-top: 0px solid; border-right: 0px solid\">Meccs kezdete</div> <div style=\"float: left; width: 161px; box-sizing: border-box; background-color: #4b4b4b; border:1px solid #8d8d8d; border-top: 0px solid\">Meccs hossza</div> <br style=\"clear: left;\" /> </div>  <div style=\" font-family: 'Squada One', cursive, sans-serif; width:322px; color: #8d8d8d\"> <div style=\"float: left; width: 161px; box-sizing: border-box; background-color: #262626; border:1px solid #8d8d8d; border-top: 0px solid; border-right: 0px solid\">" + MatchArrays[j].formatedStartTime + "</div> <div style=\"float: left; width: 161px; box-sizing: border-box; background-color: #262626; border:1px solid #8d8d8d; border-top: 0px solid\">" + MatchArrays[j].formatedMatchElapsed + "</div> <br style=\"clear: left;\" /></div>";      ////szöveg
            outTable.push(formatedDiv);

            j--;
        } while (j > -1)

    }

    /**If the streamer online we store the caches.*/
    if (liveStatus == "live") {
        //outTable = [];
        //MatchArrays[0].createdAt = 0;
        cache.put("formatedDiv", JSON.stringify(outTable), 1500);
        cache.put("createdAt", MatchArrays[0].createdAt, 1500);
        cache.put("gameIsPUBG", gameIsPUBG, 1500);
    }

}

/**doGet function is execute when somebody open the deployed webapp. The output is a html formated string type. You need to fetch with XMLHttpRequest(You can find a sample HTML file as well in the repository)*/
function doGet() {
    var tableOut = JSON.parse(cache.get("formatedDiv"));
    var gameIsPUBG = cache.get("gameIsPUBG");
    var htmlout = "";
    var noStatMessage;
    
    /**If the tableOut variable not null, we start a for loop. If the variable null we write the noStatMessage*/
    if(gameIsPUBG == "true"){ noStatMessage = "1.match in progress!";} else {noStatMessage = "No PUBG Stream rigth know!"}
    var noStatYet = "<div style=\"font-family: 'Squada One', cursive, sans-serif; width:320px; background-color: #fbc22d; border:1px solid #b38100; color: #262626;border-top: 0px solid\">" + noStatMessage + "</div>";

    if (tableOut == null) { htmlout = noStatYet; }
    if (tableOut != null) {
        for (var i = tableOut.length - 1; i > -1; i--) {
            htmlout += tableOut[i];
        }

        if (tableOut.length == 0) { htmlout = noStatYet; }
    }

    /**The formated match stat table footer*/
    htmlout += "<div style=\"font-family: 'Squada One', cursive, sans-serif; padding: 5px; width:312px; color: #8d8d8d; background-color: #4b4b4b; text-align:center\">Powered by OFFICIAL PUBG API</div>";

    return ContentService.createTextOutput(htmlout);

}

/**Other necessary functions for the Script*/ //********************************************************* */
/**Current Time in Unix Timestamp */
function CurrentTime() {
    var currentMillisecTimestamp = new Date().getTime();
    return currentMillisecTimestamp / 1000;
}

/**Convert RFC2822 standard formated server time to Unix timestamp*/
function Timestamp(b) {
    var twitchServerTime = b.substring(0, 16) + ":00Z";
    var utcDate = twitchServerTime;
    var localDate = new Date(utcDate);
    var localDate = localDate.getTime() / 1000;
    return localDate;
}

/**Convert RFC2822 standard formated server time to normal formated time */
function TimeConvert(a) {
    var twitchServerTime = a.substring(0, 16) + ":00Z";
    var utcDate = twitchServerTime;
    var localDate = new Date(utcDate);

    var hour = localDate.getHours();
    var minutes = localDate.getMinutes();
    var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    var days = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59"];
    var date = localDate.getFullYear() + "." + months[localDate.getMonth()] + "." + days[localDate.getDate()];

    var minutes = days[localDate.getMinutes()];
    var time = hour + ":" + minutes;
    var convertedTime = date + " " + time;

    return convertedTime;
}

/**Convert the elapsed seconds to minutes:seconds format */
function MinutesFromSeconds(a) {
    var minutesElapsed = a / 60;
    var minutes = Math.floor(minutesElapsed);
    var seconds = Math.floor((minutesElapsed - minutes) * 60).toString();
    minutes = minutes.toString();

    if (minutes.length == 1) { minutes = "0" + minutes; }
    if (seconds.length == 1) { seconds = "0" + seconds; }
    return minutes + ":" + seconds
}

