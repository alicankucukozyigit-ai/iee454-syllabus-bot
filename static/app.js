const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const messagesEl = document.getElementById("messages");

let history = [];

marked.setOptions({ breaks: true });

function addMessage(text, role, asHtml = false) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  if (asHtml) {
    const rawHtml = marked.parse(text);
    div.innerHTML = DOMPurify.sanitize(rawHtml);
  } else {
    div.textContent = text;
  }
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  history.push({ role: "user", content: text });
  input.value = "";
  input.disabled = true;

  const loadingEl = addMessage("Thinking...", "bot loading");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history }),
    });
    const data = await res.json();
    loadingEl.remove();

    if (data.error) {
      addMessage(`Error: ${data.error}`, "bot");
    } else {
      addMessage(data.reply, "bot", true);
      history.push({ role: "assistant", content: data.reply });
    }
  } catch (err) {
    loadingEl.remove();
    addMessage("Something went wrong reaching the server.", "bot");
  } finally {
    input.disabled = false;
    input.focus();
  }
});
