import express from 'express';
import { Ollama } from 'ollama';
import gitDiffParser from 'gitdiff-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { App } from '@octokit/app';
import { Webhooks, createNodeMiddleware } from '@octokit/webhooks';
import fs from 'fs';
import { Octokit } from 'octokit';

// --- Setup ---
dotenv.config();
const app = express();
const port = 3001;
const HOST = '127.0.0.1';

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
const OLLAMA_MODEL = 'qwen2:0.5b';

// --- GitHub App Setup (FOR BOT ONLY) ---
const githubApp = new App({
  appId: process.env.GITHUB_APP_ID,
  privateKey: fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, 'utf8'),
});

const webhookOptions = {};
if (process.env.GITHUB_WEBHOOK_SECRET) {
  webhookOptions.secret = process.env.GITHUB_WEBHOOK_SECRET;
  console.log("Found Webhook Secret, running in secure mode.");
} else {
  console.warn("WARNING: No GITHUB_WEBHOOK_SECRET found. Running in insecure mode for testing.");
}

const webhooks = new Webhooks(webhookOptions);

// Middleware
app.use(cors());
app.use(express.json());

// --- Web Search Function ---
async function searchTheWeb(query) {
  console.log(`Searching the web for: ${query}`);
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    });
    if (!response.ok) { console.error('Serper API error:', await response.text()); return "Search failed."; }
    const data = await response.json();
    if (data.organic) {
      return data.organic.slice(0, 3).map(item => `Title: ${item.title}\nSnippet: ${item.snippet}\nSource: ${item.link}`).join('\n\n---\n\n');
    }
    return "No relevant search results found.";
  } catch (error) {
    console.error('Search error:', error);
    return "Error connecting to search engine.";
  }
}

// --- PROMPT TEMPLATES ---

// ==================================================================
// --- NEW, STRICTER BASE PROMPT ---
const getBasePrompt = () => `
  You are an expert, strict, and meticulous senior principal engineer. Your job is to find all potential issues.
  Be highly critical. Do not give an "A+" score easily.

  You MUST evaluate the code on the following criteria:
  1.  **Logic & Bugs**: Check for potential runtime errors, off-by-one errors, null pointer exceptions, or logical fallacies.
  2.  **Security**: Check for any vulnerabilities (XSS, SQL Injection, hardcoded secrets, etc.).
  3.  **Performance**: Check for inefficient code, O(n^2) loops, or unnecessary operations.
  4.  **Code Style**: Check for readability, naming conventions (like Google Style Guide), and maintainability.
  5.  **Documentation**: Check for missing or unclear JSDoc/PyDoc comments.

  Provide your feedback in a structured JSON format.
  The JSON output MUST be an object with these keys:
  1. "overallFeedback": A high-level, critical summary. If you find issues, be direct.
  2. "codeHealthScore": A "grade" (e.g., "A+", "B-"). Be a tough grader.
  3. "keyTakeaway": A single, concise sentence about the most important issue.
  4. "comments": An array of line-by-line issues. Be very detailed for each comment.
  5. "educationalLinks": (Optional) An array of objects ("topic", "url").
  6. "effortEstimation": A string ("minimal", "moderate", "significant") estimating the effort to fix all issues.

  If there are no issues at all (which is rare), you can return:
  {
    "overallFeedback": "Excellent work. I've reviewed this meticulously and found no issues with logic, security, performance, or documentation. This is production-ready.",
    "codeHealthScore": "A+",
    "keyTakeaway": "This is production-ready code.",
    "comments": [],
    "educationalLinks": [],
    "effortEstimation": "none"
  }
`;
// --- END OF NEW PROMPT ---
// ==================================================================

const gitDiffPrompt = (file, searchResults) => `
  ${getBasePrompt()}
  
  --- WEB SEARCH CONTEXT ---
  Here is some context from a web search on this topic:
  ${searchResults}
  --- END CONTEXT ---

  Analyze the following git diff for the file "${file.newPath}".
  Use the web search context to inform your review. Be extremely critical.
  \`\`\`diff
  ${file.hunks.map(hunk => hunk.content).join('\n')}
  \`\`\`
`;

const codeSnippetPrompt = (code, filename, searchResults) => `
  ${getBasePrompt()}

  --- WEB SEARCH CONTEXT ---
  Here is some context from a web search on this topic:
  ${searchResults}
  --- END CONTEXT ---
  
  Analyze the following code snippet from a file named "${filename}".
  Use the web search context to inform your review. Be extremely critical.
  \`\`\`
  ${code}
  \`\`\`
`;

const refactorPrompt = (code, filename, searchResults) => `
  You are an expert senior software engineer.
  Rewrite the following code from "${filename}" to improve its
  readability, performance, and maintainability.
  
  --- WEB SEARCH CONTEXT ---
  Here is some context from a web search on this topic:
  ${searchResults}
  --- END CONTEXT ---

  Use the web search context to apply modern, best-practice refactoring techniques.
  
  Respond *only* with a valid JSON object.
  The JSON object MUST have two string keys:
  1. "refactoredCode": A string containing the complete, properly formatted, and indented refactored code. All newlines must be represented as \\n.
  2. "explanation": A single string. Explain what you changed and why, referencing the web context if relevant. Use \\n for newlines.
  3. "educationalLinks": (Optional) An array of objects ("topic", "url")
     related to the refactoring techniques you used.
  
  Here is the code to refactor:
  \`\`\`
  ${code}
  \`\`\`
`;

const followUpPrompt = (originalComment, conversationHistory, searchResults) => `
  You are an AI code mentor. A user is asking a follow-up question
  about a code review comment you made.
  Your Original Comment: "${originalComment}"
  Conversation History (User is last):
  ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

  --- WEB SEARCH RESULTS ---
  Here is some up-to-date information from the internet that might be relevant:
  ${searchResults}
  --- END OF SEARCH RESULTS ---
  
  Please provide a concise and helpful answer to the user's last question.
  Use the web search results to provide factual, up-to-date information.
  Respond as a single block of text (not JSON).
`;

const explainPrompt = (code, language, searchResults) => `
  You are an expert software engineer and a clear communicator.
  Explain what the following code snippet (from a ${language} file) does.
  
  --- WEB SEARCH CONTEXT ---
  Here is some context from a web search on this topic:
  ${searchResults}
  --- END CONTEXT ---

  Break down the logic step-by-step in plain English.
  Use the web search context to provide a more accurate and detailed explanation.
  Assume the person asking is a beginner.
  Use markdown for formatting (like lists, bolding, and code blocks).

  Here is the code:
  \`\`\`${language}
  ${code}
  \`\`\`
`;

// ==================================================================
// --- NEW, STRICTER SPECIALIZED PROMPTS ---
const specializedReviewPrompt = (code, filename, mode, searchResults) => {
  let systemPrompt = getBasePrompt(); // Start with the strict base prompt

  if (mode === 'security') {
    systemPrompt = `You are an expert security auditor. Analyze the following code from "${filename}" *only* for security vulnerabilities.
    Look for: XSS, SQL Injection, buffer overflows, insecure dependencies, hardcoded secrets, improper error handling, or broken access control.
    Ignore all style, performance, or documentation comments.
    Use the JSON format from the base prompt.`;
  } else if (mode === 'performance') {
    systemPrompt = `You are a senior principal engineer. Analyze the code from "${filename}" *only* for performance bottlenecks.
    Look for: inefficient loops (O(n^2)), memory leaks, N+1 query problems, blocking operations, or poor algorithm choice.
    Ignore all style or security comments.
    Use the JSON format from the base prompt.`;
  }

  return `
    ${systemPrompt}

    --- WEB SEARCH CONTEXT ---
    Here is some context from a web search on this topic:
    ${searchResults}
    --- END CONTEXT ---

    Use the web search context to identify issues and provide relevant educational links.

    Here is the code to analyze:
    \`\`\`
    ${code}
    \`\`\`
  `;
};
// --- END OF NEW PROMPTS ---
// ==================================================================

// --- AI HELPER FUNCTIONS ---
async function getAiJsonResponse(prompt, model) {
  const response = await ollama.chat({
    model: model, messages: [{ role: 'user', content: prompt }], format: 'json', stream: false,
  });
  return JSON.parse(response.message.content);
}

// --- GITHUB WEBHOOK ENDPOINTS (BOT) ---
// ... (This section is unchanged) ...
app.post('/api/github-event', createNodeMiddleware(webhooks), (req, res) => {
  res.status(200).send('Event received');
});

webhooks.on(['pull_request.opened', 'pull_request.synchronize'], async (event) => {

  console.log(`Processing PR: ${event.payload.pull_request.title}`);

  try {
    const { payload } = event;
    const installationId = payload.installation.id;
    const diffUrl = payload.pull_request.diff_url;
    const commentsUrl = payload.pull_request.comments_url;
    const repoFullName = payload.repository.full_name;

    const octokit = await githubApp.getInstallationOctokit(installationId);

    if (payload.action === 'opened') {
      await octokit.request(`POST ${commentsUrl}`, {
        body: `### 🤖 AI Code Review
Hello! I'm checking this PR... This might take a few moments.`,
      });
    }

    const ghResponse = await octokit.request(diffUrl);
    const stdout = ghResponse.data;
    if (!stdout) {
      console.log(`No changes found in this PR.`);
      return;
    }

    const files = gitDiffParser.parse(stdout);
    const reviewPromises = files.map(async (file) => {
      if (file.type === 'deleted' || file.isBinary) return { ...file, review: { ok: true, comments: [] } };
      try {
        const searchQuery = `code review best practices for ${file.newPath}`;
        const searchResults = await searchTheWeb(searchQuery);

        const reviewJson = await getAiJsonResponse(gitDiffPrompt(file, searchResults), OLLAMA_MODEL);
        return { ...file, review: reviewJson };
      } catch (ollamaError) {
        console.error(`Ollama error for ${file.newPath}:`, ollamaError.message);
        return { ...file, review: { error: true, comments: [{ lineNumber: 1, severity: "error", comment: `Failed to get AI review: ${ollamaError.message}` }] } };
      }
    });

    const reviewedFiles = await Promise.all(reviewPromises);
    let markdownComment = `### 🤖 AI Code Review\n\nHello! I've reviewed this Pull Request. Here's a summary:\n\n`;

    reviewedFiles.forEach(file => {
      if (file.review && !file.review.error && file.review.overallFeedback) {
        markdownComment += `---
#### 📄 **${file.newPath}** (Score: ${file.review.codeHealthScore})\n
**Key Takeaway:** *${file.review.keyTakeaway}*\n
**Overall Feedback:** ${file.review.overallFeedback}\n`;
        if (file.review.comments && file.review.comments.length > 0) {
          markdownComment += `\n**Issues Found:**\n`;
          file.review.comments.forEach(comment => {
            markdownComment += `* **[Line ${comment.lineNumber} - ${comment.severity.toUpperCase()}]**: ${comment.comment}\n`;
          });
        }
      }
    });

    await octokit.request(`POST ${commentsUrl}`, {
      body: markdownComment,
    });
    console.log(`Successfully posted review to PR in ${repoFullName}.`);

  } catch (error) {
    console.error(`FATAL ERROR processing PR:`, error.message);
  }
});

webhooks.onError((error) => {
  console.error(`Webhook Error: ${error.message}`);
});

// --- WEB APP ENDPOINTS ---
// ... (review-snippet is unchanged, but will use the new stricter prompts) ...
app.post('/api/review-snippet', async (req, res) => {
  const { code, filename, mode } = req.body;
  if (!code || !filename) return res.status(400).json({ error: 'Missing code or filename' });
  console.log(`Received /api/review-snippet request for ${filename} (Mode: ${mode})`);

  try {
    const searchQuery = `${mode} code review for ${filename}`;
    const searchResults = await searchTheWeb(searchQuery);

    let prompt;
    if (mode === 'standard') {
      prompt = codeSnippetPrompt(code, filename, searchResults);
    } else {
      prompt = specializedReviewPrompt(code, filename, mode, searchResults);
    }

    const reviewJson = await getAiJsonResponse(prompt, OLLAMA_MODEL);

    const lines = code.split('\n');
    const fakeFile = {
      hunks: [{
        content: `@@ -1,${lines.length} +1,${lines.length} @@\n` + lines.map(line => `+${line}`).join('\n'),
        oldStart: 1, newStart: 1, oldLines: 0, newLines: lines.length,
        changes: lines.map((line, index) => ({
          key: `snippet-line-${index}`, content: line, type: 'insert', isInsert: true, lineNumber: index + 1, newLineNumber: index + 1,
        })),
      }],
      oldPath: filename, newPath: filename, type: 'add',
      review: reviewJson,
    };
    res.json({ files: [fakeFile] });
  } catch (error) {
    console.error(`Ollama error for ${filename}:`, error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ... (refactor is unchanged) ...
app.post('/api/refactor', async (req, res) => {
  const { code, filename } = req.body;
  if (!code || !filename) return res.status(400).json({ error: 'Missing code or filename' });
  console.log(`Received /api/refactor request for ${filename}`);

  try {
    const searchQuery = `refactoring techniques for ${filename}`;
    const searchResults = await searchTheWeb(searchQuery);
    const prompt = refactorPrompt(code, filename, searchResults);
    const refactorJson = await getAiJsonResponse(prompt, OLLAMA_MODEL);

    res.json({
      originalCode: code,
      refactoredCode: refactorJson.refactoredCode,
      explanation: refactorJson.explanation,
      educationalLinks: refactorJson.educationalLinks,
    });
  } catch (error) {
    console.error(`Ollama error for ${filename}:`, error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


// ... (review-pr is unchanged, but will use the new stricter gitDiffPrompt) ...
app.post('/api/review-pr', async (req, res) => {
  const { prUrl } = req.body;
  if (!prUrl) return res.status(400).json({ error: 'Missing prUrl' });
  console.log(`Received /api/review-pr request for ${prUrl}`);

  if (!process.env.GITHUB_PAT) {
    return res.status(500).json({ error: 'Server is missing GITHUB_PAT. This feature is not configured.' });
  }

  try {
    // 1. Parse the PR URL
    const urlParts = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!urlParts) {
      return res.status(400).json({ error: 'Invalid GitHub PR URL. Must be in format .../owner/repo/pull/123' });
    }
    const [, owner, repo, pull_number] = urlParts;

    // 2. Create a simple Octokit client with your PAT
    const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

    // 3. Get the PR diff
    const { data: diff } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: { format: 'diff' } // We need the raw diff
    });

    // 4. Parse the diff
    const files = gitDiffParser.parse(diff);

    // 5. Run the *exact same* review logic as the webhook
    const reviewPromises = files.map(async (file) => {
      if (file.type === 'deleted' || file.isBinary) {
        return { ...file, review: { ok: true, comments: [] } };
      }
      try {
        const searchQuery = `code review best practices for ${file.newPath}`;
        const searchResults = await searchTheWeb(searchQuery);
        const reviewJson = await getAiJsonResponse(gitDiffPrompt(file, searchResults), OLLAMA_MODEL);
        return { ...file, review: reviewJson };
      } catch (ollamaError) {
        console.error(`Ollama error for ${file.newPath}:`, ollamaError.message);
        return { ...file, review: { error: true, comments: [{ lineNumber: 1, severity: "error", comment: `Failed to get AI review: ${ollamaError.message}` }] } };
      }
    });

    const reviewedFiles = await Promise.all(reviewPromises);

    // 6. Send the review back to the frontend
    res.json({ files: reviewedFiles });

  } catch (error) {
    console.error(`Error processing PR review for ${prUrl}:`, error.message);
    if (error.status === 404) {
      return res.status(404).json({ error: 'Pull Request not found. (Or your PAT does not have permission to access it).', details: error.message });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ... (explain, follow-up, apply-fix, and error handler are unchanged) ...
async function streamAiResponse(res, prompt, model = OLLAMA_MODEL) {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const responseStream = await ollama.chat({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const part of responseStream) {
      const token = part.message.content;
      res.write(`data: ${JSON.stringify(token)}\n\n`);
    }
  } catch (error) {
    console.error(`[Stream Error] ${error.message}`);
  } finally {
    res.end();
  }
}

app.post('/api/explain', async (req, res) => {
  const { code, filename } = req.body;
  if (!code || !filename) return res.status(400).json({ error: 'Missing code or filename' });
  console.log(`Received /api/explain request for ${filename}`);

  try {
    const language = filename.split('.').pop() || 'javascript';
    const searchQuery = `explain ${language} code snippet: ${code.substring(0, 50)}...`;
    const searchResults = await searchTheWeb(searchQuery);
    const prompt = explainPrompt(code, language, searchResults);

    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false
    });

    res.json({ explanation: response.message.content });

  } catch (error) {
    console.error(`Ollama error for /api/explain:`, error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/follow-up', async (req, res) => {
  const { originalComment, conversation } = req.body;
  if (!originalComment || !conversation) return res.status(400).end();
  const userQuestion = conversation[conversation.length - 1].content;
  console.log(`Received /api/follow-up request: ${userQuestion}`);

  try {
    console.log('Performing web search...');
    const searchResults = await searchTheWeb(userQuestion);
    const prompt = followUpPrompt(originalComment, conversation, searchResults);
    await streamAiResponse(res, prompt);
  } catch (error) {
    console.error('Follow-up error (e.g., web search failed):', error.message);
    res.end();
  }
});

app.post('/api/apply-fix', async (req, res) => {
  console.log(`Simulating applying fix...`);
  res.json({ success: true, message: 'Fix applied successfully' });
});

// --- FINAL CATCH-ALL ERROR HANDLER ---
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error Middleware] ", err.stack);
  res.status(500).send('Something broke on the server!');
});

// --- Server Listen ---
app.listen(port, HOST, () => {
  console.log(`Backend server running at http://${HOST}:${port}`);
  console.log('GitHub App webhook listener running on /api/github-event');
});