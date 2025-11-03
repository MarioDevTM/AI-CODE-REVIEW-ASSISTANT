# AI-Powered Code Review Assistant

An automated code review tool that uses a locally hosted Large Language Model to analyze code changes and provide valuable insights and recommendations.

## Features

### Core Functionality

- **Local LLM Integration**: Uses Ollama with Code Llama 7B Instruct for code analysis
- **Pre-commit Reviews**: Analyzes staged git changes before they're committed
- **Incremental Reviews**: Only reviews changed code, not the entire codebase
- **Structured Output**: Presents review findings in a clear, organized format using JSON

### Advanced Features

- **Automatic Fix Suggestions**: Provides code snippets to fix identified issues
- **Documentation Suggestions**: Recommends documentation improvements
- **Guideline Awareness**: Identifies violations of coding standards and best practices
- **Effort Estimation**: Estimates the effort required to address identified issues
- **Comment Resolution**: Allows marking review comments as resolved
- **Token Usage Tracking**: Monitors and displays LLM token usage for cost management

## Technology Stack

### Backend

- **Node.js/Express**: Server framework for handling API requests
- **Ollama SDK**: Client library for communicating with the local LLM
- **child_process**: For executing git commands to get staged changes
- **gitdiff-parser**: For parsing git diff output into structured data

### Frontend

- **React**: UI library for building the interface
- **@git-diff-view/react**: Specialized component for displaying code diffs
- **Vite**: Build tool for fast development and optimized production builds

## Architecture

The application follows a client-server architecture:

1. **Frontend (React)**: Provides the user interface for requesting reviews and displaying results
2. **Backend (Node.js)**: Handles API requests, interacts with git, and communicates with Ollama
3. **Ollama**: Hosts the Code Llama model and provides an API for generating reviews

## Implementation Details

### Review Process

1. User clicks "Review Staged Files" in the UI
2. Backend executes `git diff --staged` to get changes
3. Changes are parsed and sent to Ollama for analysis
4. Ollama generates structured review comments
5. Results are returned to the frontend and displayed

### Review Output

For each file, the review provides:

- **Comments**: Issues identified in the code with line numbers and severity
- **Suggested Fixes**: Code snippets to fix identified issues
- **Documentation Suggestions**: Recommendations for improving documentation
- **Guideline Violations**: Identified violations of coding standards
- **Effort Estimation**: Estimate of the effort required to address issues

## Getting Started

### Prerequisites

- Node.js (v14+)
- Git
- [Ollama](https://ollama.ai/) with the Code Llama model installed

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Running the Application

1. Start Ollama with the Code Llama model:
   ```
   ollama run codellama:7b-instruct
   ```

2. Start the backend server:
   ```
   cd backend
   npm start
   ```

3. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

4. Open the application in your browser (typically at http://localhost:5173)

## Usage

1. Make changes to your code
2. Stage the changes with git: `git add <files>`
3. Open the application and click "Review Staged Files"
4. Review the feedback and apply suggested fixes as needed
5. Mark comments as resolved when addressed
6. Monitor token usage to manage costs

## Testing

See [TESTING.md](./TESTING.md) for information on testing the application.

## Future Improvements

- **Multi-repository support**: Allow reviewing code from multiple repositories
- **Custom ruleset configuration**: Allow users to define custom coding standards
- **Integration with CI/CD**: Run reviews automatically in CI/CD pipelines
- **Historical reviews**: Store and compare reviews over time
- **Team collaboration**: Allow sharing reviews with team members
- **More LLM options**: Support for different models and hosting options

## License

MIT

## Acknowledgments

- This project was created for the AI-Powered Code Review Assistant Hackathon
- Thanks to the creators of Ollama and Code Llama for making local LLMs accessible