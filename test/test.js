(function() {
    var SUCCESS = '<span style="font-weight:bold; color:green">SUCCESS</span>';
    var FAILURE = '<span style="font-weight:bold; color:red">FAILURE</span>';

    function addLine(text) {
        var div = document.createElement('div');
        div.innerHTML = text;
        document.body.appendChild(div);
    }

    function test(name, expected, fn) {
        try {
            var actual = fn();
            if (actual == expected) {
                addLine(name + ': ' + SUCCESS);
            } else {
                addLine(name + ': ' + FAILURE +
                    ' expected: ' + expected + ' actual: ' + actual);
            }
        } catch (e) {
            console.warn(e);
            addLine(name + ': ' + FAILURE +
                ' threw: ' + ''+e);
        }
    }

    function compare(csvFile, jsonFile) {
        var csvReader = new FileReader();
        csvReader.onload = function(e) {
            var csvText = e.target.result;
            var jsonReader = new FileReader();
            jsonReader.onload = function(e) {
                var jsonText = e.target.result;
//                 var json = JSON.stringify(JSON.parse(jsonText), null, 2);
//                 test(csvFile.name, json, function() {
//                     var csv = JSON.stringify(CSV.parse(csvText), null, 2);
//                     return csv;
//                 })
                jsonText = JSON.stringify(JSON.parse(jsonText));
                test('CSV->JSON ' + csvFile.name, jsonText, function() {
                    var json = CSV.parseToJSON(csvText);
                    return json;
                });

                // this fails because it doesn't preserve Number/bool types
                //test('JSON->CSV ' + csvFile.name, csvText, function() {
                //    var csv = CSV.stringify(JSON.parse(jsonText));
                //    return csv;
                //});

                test('JSON->CSV ' + csvFile.name, jsonText, function() {
                    var csv = CSV.stringify(JSON.parse(jsonText));
                    var json = CSV.parseToJSON(csv);
                    return json;
                });
            };
            jsonReader.readAsText(jsonFile);
        };
        csvReader.readAsText(csvFile);
    }

    function compareFiles(csvs, jsons) {
        addLine('Testing ' + csvs.length + ' CSV files against '
            + jsons.length + ' JSON files...');
        console.log(csvs);
        console.log(jsons);

        Array.from(csvs).forEach(function(csv, i) {
            compare(csv, jsons[i]);
        });
    }

    function onClick(e) {
        console.log(e);
        var csvsElement = document.getElementById('csvs');
        var jsonsElement = document.getElementById('jsons');
        compareFiles(csvsElement.files, jsonsElement.files);
        e.preventDefault();
    }

    document.getElementById('compare').addEventListener('click', onClick)


    addLine('Beginning tests...');
//     test('Test 1 - return string', 'success!', function() {
//         return CSV.fromString('success!');
//     });
    addLine('Tests Complete!');
})();
