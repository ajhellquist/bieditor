# Version Log

## Version 1.2.1 - Jan 25 2025

### Enhancements
- None

### Bug Fixes
- Added batching to CSV upload feature to be able to handle large CSVs that were causing crashes

## Version 1.2.0 - Jan 18 2025

### Enhancements
- Updated URL to MAQLExpress.com
- Made the suggestion panel wider and reduced text size to fit more variables in a single view
- Updated multiselect coloring to gray
- Updated X buttons to delete PID and variables to now say "Del" to reflect deletion instead of cancellation
- Added a confirmation box when deleting a single variable
- Added functionality on drop down menus to always close when you click outside of them
- Added functionality to not include duplicate variables when adding solo or via CSV Upload

### Bug Fixes
- Updated multi-select button from Alt to Command/Ctrl for a more natural multi-select experience that matches common OS conventions
- Fixed a bug that would cause the PID you are selected on to deselect when the page is refreshed or loaded

## Version 1.1.1 - Jan 16 2025

### Enhancements
- Added shadowing on the "Edit Variable" box to match the rest of the app
- Added a new cancel button on the "Edit Variable" box 

### Bug Fixes
- Fixed a bug where attribute values added through the CSV uploader were errantly putting spaces into the generated URI rendering them invalid in GoodData
- Fixed a bug where the Add New Variable section would send the new variable to local server instead of the hosted server

---