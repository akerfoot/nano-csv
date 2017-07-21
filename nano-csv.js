var CSV = (function() {

    /**
     * Naive implementation.
     *
     * Works as long as you don't need anything escaped or quoted.
     */
    function simpleParse(csv) {
        var lines = csv.split('\n');
        var header = lines.shift();
        var keys = header.split(',');
        return lines.filter(function(line) { return !!line })
                    .map(function(line) {
                        var obj = {};
                        line.split(',').forEach(function(val, i) {
                            obj[keys[i]] = val;
                        });
                        return obj;
                    });
    }

    /**
     * Convert an array of objects to a CSV string
     *
     * Assumes:
     * - all objects share the same keys
     */
    function simpleStringify(arr) {
        if (arr.length == 0) {
            return "";
        }

        var keys = Object.keys(arr[0]);
        return keys.join(",") + "\n" +
            arr.map(function(obj) {
                return Object.values(obj).map(function(v){
                    return typeof v === "string" ? '"' + (''+v).replace(/"/g,'""') + '"' : v
                }).join(",");
            }).join("\n");
    }

    /**
     * Convert CSV to JSON string.
     *
     * Implements a CSV parser using a Deterministic Finite State Automata
     * (with side-effects to build string for output).
     *
     * This makes the following assumptions:
     * - header row exists
     * - there is at least one key
     * - all rows have same number of fields as header
     * - headers are not quoted
     * - headers are not empty
     * - headers do not contain commas
     * - headers do not contain quotes
     * - headers do not contain quoted newlines or carriage returns
     * - line ends with either \n or \r\n
     * - unquoted strings do not contain floating \r
     * - numbers (whether quoted or not) are converted to strings
     */
    function dfaParse(csv) {
        var i = 0;
        var json = '';
        var state = initial;

        var header = '';
        var keys = [];
        var keyIndex = 0;

        function initial(c) {
            return readingHeader(c);
        }

        function readingHeader(c) {
            switch(c) {
                case '\n':
                    keys = header.split(',');
                    json += '[';
                    return startLine;
                case '\r':
                    return readingHeader;
                default:
                    header += c;
                    return readingHeader;
            }
        }

        function startLine(c) {
            json += '{';
            return startField(c);
        }

        function startField(c) {
            console.assert(keyIndex < keys.length);
            if (keyIndex) { json += ',' }
            json += '"' + keys[keyIndex++] + '":"';
            switch(c) {
                case '"':
                    return quotedField;
                case ',':
                    json += '"';
                    return startField;
                case undefined:
                    return endOfLine(c);
                case '\n':
                    return endOfLine;
                case '\r':
                    return carriageReturn;
                default:
                    json += c;
                    return unquotedField;
            }
        };

        function firstQuote(c) {
            switch(c) {
                case '"':
                    json += '\\"'; // or += c;  // backslash unnecessary for non-string output
                    return unquotedField;
                default:
                    json += c;
                    return quotedField;
            }
        }

        function quotedField(c) {
            switch(c) {
                case '"':
                    return quotedQuote;
                // TODO: technically should contain all non-space whitespace characters
                case '\n':  // not necessary for non-string ouput
                    json += '\\n';
                    return quotedField;
                case '\r':  // not necessary for non-string ouput
                    json += '\\r';
                    return quotedField;
                case '\t':  // not necessary for non-string ouput
                    json += '\\t';
                    return quotedField;
                case '\\':
                    json += '\\\\';
                    return quotedField;
                default:
                    json += c;
                    return quotedField;
            }
        }

        function quotedQuote(c) {
            switch(c) {
                case '"':
                    json += '\\"'; // or += c;  // backslash unnecessary for non-string output
                    return quotedField;
                case ',':
                    json += '"';
                    return startField;
                case '\r':
                    return carriageReturn;
                case '\n':
                    return endOfLine;
                case undefined:
                    return endOfLine(c);
                default:
                    throw 'Ending quote followed by unexpected character at position ' + i;
            }
        }

        function unquotedField(c) {
            switch(c) {
                case ",":
                    json += '"';
                    return startField;
                case '\r':
                    return unquotedCarriageReturn;
                case '\n':
                    return endOfLine;
                case undefined:
                    return endOfLine(c);
                default:
                    json += c;
                    return unquotedField;
            }
        }

        function carriageReturn(c) {
            switch(c) {
                case '\n':
                    return endOfLine;
                default:
                    throw 'Carriage return without matching newline at position ' + i;
            }
        }

        function unquotedCarriageReturn(c) {
            switch(c) {
                case '\n':
                    return endOfLine;
                default:
                    json += '\\r' + c;  // backslash unnecessary for non-string output
                    return unquotedField;
            }
        }

        function endOfLine(c) {
            json += '"}';
            keyIndex = 0;
            if (c) {
                json += ',';
                return startLine(c);
            }
            json += ']';
            return null;
        }

        while (state) {
            state = state(csv[i++]);
        }
        return json;
    }

    return {
        parse: function (csv) { return JSON.parse(dfaParse(csv)) },
        parseToJSON: dfaParse,
        stringify: simpleStringify
    };
})();
