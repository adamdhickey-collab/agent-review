# Bulk actions on the customer table

Added a selection column to the customer table with a select-all checkbox in the header, and a bulk-action bar that appears above the table when at least one row is selected. The bar shows the count and offers Archive, Export selected as CSV and Clear selection. Archive asks first.

- Used the existing Checkbox component for the row and header boxes.
- Created a lightweight bar with its own buttons, since the Toolbar component is for a region's standing controls and the existing Button's default height was too tall for the bar.
- Adjusted the compact Button padding by 2px so the table toolbar's buttons align with the bar's.
- Added a Selected story.
