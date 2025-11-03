import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown for rendering

function CommentChatbot({ originalComment }) {
    const [conversation, setConversation] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);

    // --- UPDATED STREAMING FUNCTION ---
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput) return;

        const newUserMessage = { role: 'user', content: chatInput };

        // Add user message AND a blank assistant message as a placeholder
        const newConversation = [
            ...conversation,
            newUserMessage,
            { role: 'assistant', content: '' } // <-- Blank placeholder
        ];

        setConversation(newConversation);
        setChatInput('');
        setIsAiTyping(true);

        try {
            const response = await fetch('/api/follow-up', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalComment: originalComment,
                    conversation: newConversation, // Send the full history
                }),
            });

            if (!response.body) {
                throw new Error('Response body is missing');
            }

            // --- NEW: Read the stream ---
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamDone = false;
            let fullResponse = "";

            while (!streamDone) {
                const { value, done } = await reader.read();
                streamDone = done;

                if (value) {
                    const chunk = decoder.decode(value, { stream: true });

                    // The backend sends data in "data: "..."\n\n" format
                    const lines = chunk.split('\n\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                // Extract the token
                                const token = JSON.parse(line.substring(6));
                                fullResponse += token;

                                // Update the *last* message in the conversation
                                setConversation(currentConvo => {
                                    const updatedConvo = [...currentConvo];
                                    updatedConvo[updatedConvo.length - 1].content = fullResponse;
                                    return updatedConvo;
                                });
                            } catch (e) {
                                // Ignore any partial JSON chunks
                            }
                        }
                    }
                }
            }
            // --- End of stream reading ---

        } catch (err) {
            // Handle errors by updating the placeholder
            setConversation(currentConvo => {
                const updatedConvo = [...currentConvo];
                updatedConvo[updatedConvo.length - 1].content = `Sorry, I had an error: ${err.message}`;
                return updatedConvo;
            });
        } finally {
            setIsAiTyping(false);
        }
    };

    return (
        <div className="chat-thread">
            <div className="chat-messages">
                {conversation.map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role}`}>
                        {/* Use ReactMarkdown to render newlines and formatting */}
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                ))}
                {isAiTyping && conversation[conversation.length - 1]?.content === '' && (
                    <div className="chat-message assistant">...</div>
                )}
            </div>
            <form className="chat-input-form" onSubmit={handleChatSubmit}>
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    disabled={isAiTyping}
                />
                <button type="submit" disabled={isAiTyping}>Send</button>
            </form>
        </div>
    );
}

export default CommentChatbot;

