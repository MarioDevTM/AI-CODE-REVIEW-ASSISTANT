# 🤖 AI-Powered Code Review Assistant

This is a **dual-mode, AI-powered assistant** that uses a **locally hosted Large Language Model (Ollama)** to analyze code.  
It functions as both:
- an **automated GitHub Bot** that reviews pull requests, and  
- a **local Web App** for reviewing, refactoring, and explaining code snippets.  

All AI interactions are enhanced with **real-time web search** to provide up-to-date, high-quality feedback.

---

## ✨ Features

### 1. GitHub Bot (Automated PR Review)
- **Automatic Reviews** – Triggers on `pull_request` events (when a PR is opened or a new commit is pushed).  
- **Strict Analysis** – Acts like a *senior principal engineer*, checking for logic, security, performance, and style issues.  
- **Web-Enhanced Context** – Uses **Google Search (via Serper API)** for up-to-date insights about code.  
- **Structured Output** – Posts per-file breakdowns, a **Code Health Score**, a **key takeaway**, and **line-by-line comments**.  

### 2. Local Web App (Development Tool)
A full-featured local dashboard with multiple modes:

| Mode | Description |
|------|--------------|
| **Review/Refactor Snippet** | Get a full, strict review of any code snippet. |
| **Security Audit** | Detect potential security vulnerabilities. |
| **Performance Check** | Identify performance bottlenecks. |
| **Code Refactor** | View a side-by-side diff of your code vs. an AI-improved version. |
| **Review PR** | Paste a PR URL for a full review identical to the bot's. |
| **Explain Code** | Get a step-by-step explanation of any snippet. |
| **History** | View all past reviews, refactors, and explanations saved in your browser. |

---

## 🧠 Core AI Features

- **Local LLM Integration** – Uses *Ollama* (`qwen2:0.5b`) locally, ensuring **privacy** of your code.  
- **Web-Enhanced AI** – Real-time search results improve accuracy and modern relevance.  
- **Interactive Chat** – A “💬 Discuss” button lets you ask follow-up questions in a chatbot.  
- **Structured Analysis Output** includes:
  - Overall Feedback Summary  
  - Code Health Score (e.g., A+, B-, etc.)  
  - Line-by-line comments with severity (Error, Warning, Info)  
  - Suggested Fixes  
  - Effort Estimation  

---

## 🧩 Technology Stack

### Backend
- **Node.js / Express** – Core API and webhook handler  
- **Ollama SDK** – Communication with the local LLM  
- **@octokit/app** – GitHub App authentication (for the bot)  
- **octokit** – Personal Access Token auth (for web app)  
- **gitdiff-parser** – Parses git diff output from PRs  

### Frontend
- **React** – Interactive UI  
- **@git-diff-view/react** – Displays code diffs  
- **react-diff-viewer-continued** – Side-by-side refactor comparisons  
- **react-markdown** – Renders AI feedback  

### Services
- **Smee.io** – Public webhook tunnel for local development  
- **Serper.dev** – Real-time web search API  

---

## 🚀 Getting Started

### Prerequisites
- Node.js **v18+**
- Git
- **Ollama** installed and running  
- The **qwen2:0.5b** model pulled:
  ```bash
  ollama pull qwen2:0.5b
  ```

---

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/Your-Repo-Name.git
   cd Your-Repo-Name
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

---

## 🔐 Configuration (`.env` Setup)

You need **4 sets of keys**.

### 1. GitHub App (for the Bot)
1. Go to **GitHub Settings → Developer settings → GitHub Apps → New GitHub App**
2. Name it, e.g. `My-Review-Bot`
3. Set:
   - **Homepage URL:** `https://github.com`
   - **Webhook URL:** temporary from [https://smee.io](https://smee.io)
4. Save the app and get your **App ID** and **Private Key (.pem)**.

### 2. Smee.io
- Go to [https://smee.io](https://smee.io) → “Start a new channel” → Copy your unique URL.

### 3. Personal Access Token (for the Web App)
- Go to GitHub → Developer settings → Personal Access Tokens → Generate new token (classic).  
- Scope: repo access.

### 4. Serper API Key (for Web Search)
- Get it from [https://serper.dev](https://serper.dev).

Example `.env`:
```bash
GITHUB_APP_ID=123456
GITHUB_WEBHOOK_SECRET=YourWebhookSecret
GITHUB_PRIVATE_KEY_PATH=your-app-private-key.pem
SERPER_API_KEY=yourSerperApiKeyGoesHere
GITHUB_PAT=ghp_YourPersonalAccessTokenGoesHere
```

---

## 🧰 Running the Application (3 Terminals)

### Terminal 1 – Backend
```bash
cd backend
npm start
```
Output: `Backend server running at http://127.0.0.1:3001`

### Terminal 2 – Frontend
```bash
cd frontend
npm run dev
```
Opens: `http://localhost:5180`

### Terminal 3 – Smee Bridge
```bash
npx smee-client --url https://smee.io/Your-Unique-ID --path /api/github-event --port 3001
```
Output: `Forwarding ... to http://127.0.0.1:3001/api/github-event`

---

## 🧪 Usage

### Local Web App
- Visit `http://localhost:5180`  
- Use **Review PR**, **Explain Code**, or **Review/Refactor** options

### GitHub Bot
1. Install your app on a repo.  
2. Create a branch, push a change, and open a PR.  
3. The bot will post a "checking..." comment followed by a full review.
