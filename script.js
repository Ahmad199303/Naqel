(function () {
  const config = window.ANNAQEL_CHAT_CONFIG || {};
  const webhookUrl = config.n8nWebhookUrl || "";
  const widget = document.querySelector(".chat-widget");
  const messages = document.querySelector("[data-chat-messages]");
  const form = document.querySelector("[data-chat-form]");
  const input = form.querySelector("input");

  const openChat = () => {
    widget.classList.add("is-open");
    widget.setAttribute("aria-hidden", "false");
    window.setTimeout(() => input.focus(), 120);
  };

  const closeChat = () => {
    widget.classList.remove("is-open");
    widget.setAttribute("aria-hidden", "true");
  };

  const addMessage = (text, type) => {
    const bubble = document.createElement("div");
    bubble.className = `message ${type}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  };

  const normalizeReply = (data) => {
    if (typeof data === "string") return data;
    if (!data || typeof data !== "object") return "تم استلام رسالتك، سنتواصل معك قريبا.";
    return (
      data.reply ||
      data.message ||
      data.output ||
      data.text ||
      data.answer ||
      "تم استلام رسالتك، سنتواصل معك قريبا."
    );
  };

  document.querySelectorAll("[data-open-chat]").forEach((button) => {
    button.addEventListener("click", openChat);
  });

  document.querySelector("[data-close-chat]").addEventListener("click", closeChat);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, "user");
    input.value = "";

    if (!webhookUrl) {
      addMessage("ضع رابط n8n webhook في ملف config.js حتى أقدر أرسل الرسائل للمساعد الذكي.", "bot");
      return;
    }

    const loading = addMessage("جاري إرسال الرسالة...", "bot is-loading");

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          source: "annaqel-website",
          company: config.companyName || "Annaqel",
          locale: config.locale || "ar-JO",
          pageUrl: window.location.href,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error(`Webhook returned ${response.status}`);

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : await response.text();
      loading.remove();
      addMessage(normalizeReply(data), "bot");
    } catch (error) {
      loading.remove();
      addMessage("تعذر الاتصال بالمساعد حاليا. يرجى المحاولة لاحقا أو التواصل هاتفيا.", "bot");
      console.error(error);
    }
  });
})();
