var popCSV = [];
var popArray = [];

var pop = new XMLHttpRequest();
pop.open("get", "https://dl.dropboxusercontent.com/u/14589881/populations2.csv", true);
pop.onreadystatechange = function() {
    if (pop.readyState == 4) {
        processPop();
        processMap($('#map').val());
    }
};
pop.send();

$(document).ready(function() {
    $('#map').keyup(function() {
        processMap($('#map').val());
    });
});


String.prototype.capitalise = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) {
        return a.toUpperCase();
    });
};

function CSVToArray(strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = ",";

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"),
        "gi");


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [
        []
    ];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = objPattern.exec(strData);


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches) {

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            (strMatchedDelimiter != strDelimiter)) {

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\"");

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);

        arrMatches = objPattern.exec(strData);
    }

    // Return the parsed data.
    return (arrData);
}

Object.size = function(obj) {
    var size = 0;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


function processPop() {
    var popText = pop.responseText;

    popCSV = CSVToArray(popText);

    var popCSVLength = Object.size(popCSV);
    //console.log(popCSVLength);

    //Creating popArray
    for (var i = 1; i < popCSVLength; i++) {
        var row = popCSV[i];
        var location = row[0];
        var phase = row[1];
        var cheese = row[2];
        var charm = row[3];
        var mouseName = row[4];
        mouseName = mouseName.capitalise();
        var population = row[5];

        if (popArray[mouseName] === undefined) popArray[mouseName] = []; //If mouse doesn't exist in array
        if (popArray[mouseName][location] === undefined) popArray[mouseName][location] = [];
        if (popArray[mouseName][location][phase] === undefined) popArray[mouseName][location][phase] = [];
        if (popArray[mouseName][location][phase][cheese] === undefined) popArray[mouseName][location][phase][cheese] = [];
        popArray[mouseName][location][phase][cheese][charm] = population;
    }

    loadMouseDropdown();
}

function loadMouseDropdown() {
    var popArrayLength = Object.size(popArray);
    var suggests = [];

    for (var i = 0; i < popArrayLength; i++) {
        suggests.push(Object.keys(popArray)[i]);
        suggests.push(Object.keys(popArray)[i].toLowerCase());
    }

    $("#map").asuggest(suggests);
}

function amendMouseName(name) {
    name = name.capitalise().trim();

    if (name.indexOf(" Mouse") >= 0) {
        name = name.slice(0, indexOfMouse);
    }

    return name;
}

function processMap(mapText) {
    var mouseArray = mapText
        .split("\n")
        .map(amendMouseName)
        .filter(function(v) {
            return v.length > 0;
        })
        .sort();

    var mouseListText = '';

    var bestLocationArray = [];
    var unknownMice = [];

    for (var i = 0; i < mouseArray.length; i++) {
        var mouseName = mouseArray[i];

        if (popArray[mouseName] === undefined) { //Mouse name not recognised
            unknownMice.push(mouseName);
            mouseListText += "<tr><td><b>" + mouseName + "</b></td></tr>";
        } else {
            var mouseLocationCheese = [];

            mouseListText += "<tr><td><b>" + mouseName + "</b></td>";

            var mouseLocation = Object.keys(popArray[mouseName]);

            for (var j = 0; j < mouseLocation.length; j++) {
                var locationName = mouseLocation[j];

                var mousePhase = Object.keys(popArray[mouseName][locationName]);
                for (var k = 0; k < mousePhase.length; k++) {
                    var phaseName = mousePhase[k];

                    var mouseCheese = Object.keys(popArray[mouseName][locationName][phaseName]);

                    for (var l = 0; l < mouseCheese.length; l++) {
                        var cheeseName = mouseCheese[l];

                        var mouseCharm = Object.keys(popArray[mouseName][locationName][phaseName][cheeseName]);

                        for (var m = 0; m < mouseCharm.length; m++) {
                            var charmName = mouseCharm[m];

                            var locationPhaseCheeseCharm = locationName;

                            var URLString = 'best_setup.html?';
                            //Replace apostrophes with %27
                            URLString += "location=" + locationName;

                            if (phaseName != "-") locationPhaseCheeseCharm += " (" + phaseName + ")";
                            if (cheeseName.indexOf("/") < 0) locationPhaseCheeseCharm += " " + cheeseName;
                            if (charmName != "-") locationPhaseCheeseCharm += " " + charmName;

                            var attractionRate = parseFloat(popArray[mouseName][locationName][phaseName][cheeseName][charmName]);

                            var mouse = {
                                name: mouseName,
                                rate: attractionRate
                            };
                            if (bestLocationArray[locationPhaseCheeseCharm] === undefined) {
                                var newitem = {
                                    location: locationName,
                                    cheese: (cheeseName.indexOf("/") < 0 ? cheeseName : ""),
                                    charm: (charmName != "-" ? charmName : ""),
                                    phase: (phaseName != "-" ? phaseName : ""),
                                    totalRate: attractionRate,
                                    mice: [mouse]
                                };
                                bestLocationArray[locationPhaseCheeseCharm] = newitem;
                            } else {
                                bestLocationArray[locationPhaseCheeseCharm].totalRate += attractionRate;
                                bestLocationArray[locationPhaseCheeseCharm].mice.push(mouse);
                            }

                            mouseLocationCheese[locationPhaseCheeseCharm] = attractionRate;
                        }
                    }
                }
            }

            var sortedMLC = sortBestLocation(mouseLocationCheese); //console.log(sortedMLC);
            var mouseListTextRow2 = "";

            for (var n = 0; n < sortedMLC.length; n++) {
                mouseListText += "<td>" + sortedMLC[n][0] + "</td>"; // console.log(n);
                mouseListTextRow2 += "<td>" + sortedMLC[n][1] + "</td>";
            }

            mouseListText += "</tr>";
            mouseListTextRow2 += "</tr>";
            mouseListText += mouseListTextRow2;
        }
    }

    if (unknownMice.length > 0) {
        $('#unknownmice').html(
            'Unknown:<br>' +
            '<div class="invalid">' +
            unknownMice.reduce(function(p, c) {
                return p + c + '<br>';
            }, "") +
            '</div>'
        );
    } else {
        $('#unknownmice').html("");
    }

    $('#mouselist').html("<table>" + mouseListText + "</table>");

    var sortedLocation = sortLocations(bestLocationArray);
    printBestLocation(sortedLocation);
}

function sortLocations(bestLocationArray) {
    var sortedLocation = [];
    var bLALength = Object.size(bestLocationArray);
    var bLAKeys = Object.keys(bestLocationArray);

    for (var i = 0; i < bLALength; i++) {
        var theLocation = bLAKeys[i];
        sortedLocation.push(bestLocationArray[theLocation]);
    }

    sortedLocation.sort(function(a, b) {
        return b.totalRate - a.totalRate;
    });

    return sortedLocation;
}

function sortBestLocation(bestLocationArray) {
    var sortedLocation = [];

    var bLALength = Object.size(bestLocationArray);
    var bLAKeys = Object.keys(bestLocationArray);

    for (var i = 0; i < bLALength; i++) {
        var locationCheese = bLAKeys[i];
        sortedLocation.push([locationCheese, bestLocationArray[locationCheese]]);
    }

    sortedLocation.sort(function(a, b) {
        return b[1] - a[1];
    });

    return sortedLocation;
}

function printBestLocation(sortedLocation) {
    var bestLocationHTML = '';

    bestLocationHTML = sortedLocation.reduce(function(p, c) {
        return p +
            "<tr>" +
            "<td>" +
            "<b>" + c.location + "</b> (" + c.totalRate.toFixed(2) + ")<br>" +
            (c.phase.length > 0 ? c.phase + "<br>" : "") +
            (c.cheese.length > 0 ? c.cheese + "<br>" : "") +
            (c.charm.length > 0 ? c.charm + "<br>" : "") +
            "</td>" +
            "<td>" +
            c.mice
            .sort(function(a, b) {
                return b.rate - a.rate;
            })
            .reduce(function(txt, mouse) {
                return txt + mouse.name + " (" + mouse.rate.toFixed(2) + ")<br>";
            }, "") +
            "</tr>";
    }, "");

    $('#bestlocations').html("<table>" + bestLocationHTML + "</table>");
}