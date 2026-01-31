document.addEventListener('DOMContentLoaded', () => {
    const messages = document.getElementById("chatbot-messages");
    const input = document.getElementById("chatbot-input");
    let conversationHistory = [{ role: "system", content: "You are a helpful and concise travel assistant for the city of Mangalore. Keep your answers brief and focused on Mangalore." }];

    function addMessage(text, sender) {
        const msg = document.createElement("div");
        msg.textContent = text;
        msg.style.margin = "8px 0";
        msg.style.textAlign = sender === "user" ? "right" : "left";
        msg.style.color = sender === "user" ? "#ffe082" : "#fff";
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        return msg;
    }

    input.addEventListener("keypress", async function (e) {
        if (e.key === "Enter" && input.value.trim() !== "") {
            const userText = input.value.trim();
            addMessage(userText, "user");
            conversationHistory.push({ role: "user", content: userText });
            input.value = "";

            const typingMsg = addMessage("...", "bot");

            try {
                const response = await fetch('http://localhost:3000/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: conversationHistory
                    })
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                
                const data = await response.json();
                const botReply = data.choices[0]?.message?.content;

                if (botReply) {
                    typingMsg.textContent = botReply;
                    conversationHistory.push({ role: "assistant", content: botReply });
                } else {
                    typingMsg.textContent = "Sorry, I couldn't get a response.";
                }

            } catch (error) {
                console.error("Chatbot fetch error:", error);
                typingMsg.textContent = "Error: Could not connect to the assistant.";
            }
        }
    });
});