const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const messagesEl = document.getElementById("messages");

let history = [];

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdownLite(text) {
  const escaped = escapeHtml(text);
  const lines = escaped.split("\n");
  const htmlParts = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      htmlParts.push(`<ul>${listItems.join("")}</ul>`);
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) {
      listItems.push(`<li>${inlineFormat(bullet[1])}</li>`);
      continue;
    }
    flushList();
    if (line === "") {
      htmlParts.push("<br>");
    } else {
      htmlParts.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  flushList();
  return htmlParts.join("");
}

function inlineFormat(line) {
  return line
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

function addMessage(text, role, asHtml = false) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  if (asHtml) {
    div.innerHTML = renderMarkdownLite(text);
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
