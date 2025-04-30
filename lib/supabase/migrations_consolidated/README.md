# Supabase Consolidated Migrations

This directory contains consolidated migrations for the Network School collaboration platform. These consolidated migrations replace the individual migration files for easier maintenance and understanding of the database schema.

## Migration Files

1. **01_base_schema.sql**: Core tables and RLS policies for the platform
2. **02_demoday_schema.sql**: Demoday-specific tables and permissions
3. **03_demoday_functions.sql**: All functions including the calculation logic

## Recent Fixes (Demoday Funding Feature)

The following issues with the demoday funding feature have been fixed:

1. **Ideas with $0 funding are excluded from rankings**

   - Both calculation functions now filter out ideas with no funding
   - Ideas must have at least some funding to appear in the rankings

2. **Proper ranking for tied funding**

   - Changed from ROW_NUMBER() to DENSE_RANK() to correctly handle tied funding amounts
   - Ideas with the same funding amount now receive the same rank (e.g., two ideas with the same funding both get rank 3)

3. **Investor returns based on top 5 investments**

   - Investors now receive multiplied returns on their investments in the top 5 ideas
   - Return multipliers:
     - 1st place: 20x
     - 2nd place: 10x
     - 3rd place: 5x
     - 4th place: 3x
     - 5th place: 2x
   - Returns are added to the investor's balance and reflected in the rankings

4. **User balance updates**
   - Final balances are now properly updated with the returns from top investments
   - The calculation functions explicitly update the user_balances table with the final amounts

## How to Apply Migrations

To apply the consolidated migrations to a Supabase project:

1. Connect to your Supabase project using the Supabase CLI
2. Run the migration files in order:
   ```
   supabase db reset
   ```

## Diagnostics

If you encounter issues with the demoday calculations, you can use these functions for debugging:

- `force_calculate_demoday_results(demoday_id)`: Alternative calculation function that bypasses RLS
- `create_test_demoday_data(demoday_id, user_id)`: Creates test data for a demoday
- `clear_demoday_data(demoday_id)`: Clears all data for a demoday
