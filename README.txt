# nano-csv.js

nano-csv.js is a minimal CSV writer/parser for ES5 Javascript run in a browser.

## API

### CSV.stringify(array)

Convert a JS Array of Objects into a CSV string.

- All objects must have the same keys. 
- Keys should not contain commas, double quotes, newlines, or carriage returns.

### CSV.parseToJSON(csvString)

Convert a CSV-formatted string, with a header row, into a JSON string.

This will handle:
- escaped and non-escaped values
- escaped string values with embedded commas, double quotes, newlines and 
  carriage returns

If csvString is not valid CSV, this will throw an `Error`.

For more assumptions, see comments in code.

### CSV.parse

Convenience function that calls `CSV.parseToJSON` then parses the JSON into an
Array of Objects.
