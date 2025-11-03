# Testing the AI Code Review Application

## Test Setup

We've created a test file (`test-file.js`) with several common issues that the code review should catch:

1. Missing semicolons (lines 4-5)
2. Unused variables (line 8)
3. Functions without documentation (lines 11-13)
4. Inconsistent spacing (lines 16-18)
5. Potential bugs - missing return statement (lines 21-27)
6. Inefficient code - could use Math.max (lines 30-38)
7. Security issues - use of eval (lines 41-43)

This file has been staged with git to simulate a pre-commit scenario.

## Expected Test Results

When running the application and clicking the "Review Staged Files" button, we would expect to see:

### Core Functionality

1. The application should detect the staged `test-file.js` file
2. It should send the file to the backend for review
3. The backend should use Ollama with Code Llama to analyze the code
4. The results should be displayed in the UI with proper formatting

### Review Content

The review should identify most or all of the issues in the test file:

1. **Missing semicolons**: Should be flagged as style/syntax issues
2. **Unused variables**: Should be flagged as potential code quality issues
3. **Missing documentation**: Should generate documentation suggestions
4. **Inconsistent spacing**: Should be flagged as style issues and possibly provide guideline violations
5. **Potential bugs**: Should identify the missing return in the divide function
6. **Inefficient code**: Should suggest using `Math.max` instead of a manual loop
7. **Security issues**: Should flag the use of `eval` as a security concern

### Stretch Goals Implementation

The review should demonstrate the stretch goals we've implemented:

1. **Pre-commit Evaluation**: The review is performed on staged changes before committing
2. **Incremental Review**: Only the staged file is reviewed
3. **Comment/Reply Handling**: Users can mark comments as resolved
4. **Automatic Fixes**: Suggested fixes should be provided for issues like missing semicolons
5. **Effort Estimation**: An estimation of the effort required to fix the issues
6. **Guideline Awareness**: Identification of guideline violations
7. **Documentation Suggestions**: Suggestions for improving documentation
8. **Cost Management**: Token usage tracking is displayed

## Running the Tests

To run the tests:

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open the application in a browser (typically at http://localhost:5173)
4. Click the "Review Staged Files" button
5. Verify that the review results match the expected outcomes
6. Test the interactive features:
   - Try resolving comments
   - Try applying suggested fixes
   - Check the token usage statistics
   - Reset token usage and verify it's reset

## Notes on Testing

- The quality of the review depends on the capabilities of the Code Llama model
- Some issues might be missed or false positives might be reported
- The token usage will vary based on the size and complexity of the code being reviewed