document.addEventListener("DOMContentLoaded", () => {
  const summarizeBtn = document.getElementById("summarizeBtn");
  const summaryText = document.getElementById("summaryText");
  const loading = document.getElementById("loading");

  const API_KEY = "YOUR_CHATGPT_API_KEY_HERE";

  summarizeBtn.addEventListener("click", async () => {
    loading.style.display = "block";
    summaryText.textContent = "Generating summary...";

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.url?.includes("linkedin.com/in/")) {
        throw new Error("Please navigate to a LinkedIn profile page first");
      }

      // Check if content script is ready
      chrome.tabs.sendMessage(tab.id, { action: "ping" }, (response) => {
        if (chrome.runtime.lastError) {
          summaryText.textContent =
            "Error: Content script not loaded. Please refresh the page.";
          loading.style.display = "none";
          return;
        }

        // Send scrape request
        chrome.tabs.sendMessage(
          tab.id,
          { action: "scrape" },
          async (response) => {
            if (chrome.runtime.lastError) {
              summaryText.textContent =
                "Error communicating with page: " +
                chrome.runtime.lastError.message;
              loading.style.display = "none";
              return;
            }

            if (response && response.data) {
              try {
                console.log(response);

                const prompt = `Summarize this LinkedIn profile:
                                Name: ${response.data.name}
                                Headline: ${response.data.headline}
                                Location: ${response.data.location}
                                About: ${response.data.about}
                                Top Skills: ${JSON.stringify(response.data.topSkills || [])}
                                Experience: ${JSON.stringify(response.data.experiences || [])}
                                Education: ${JSON.stringify(response.data.education || [])}`;

                const summary = await getChatGPTSummary(prompt);
                summaryText.innerHTML = marked.parse(summary);
              } catch (error) {
                summaryText.textContent =
                  "Error generating summary: " + error.message;
              }
            } else {
              summaryText.textContent = "No profile data found";
            }
            loading.style.display = "none";
          },
        );
      });
    } catch (error) {
      summaryText.textContent = error.message;
      loading.style.display = "none";
    }
  });

  async function getChatGPTSummary(prompt) {
    console.log(prompt);

    const systemPrimpt =
      "Your task is to generate a concise & unbiased summary(in 2-3 sentence) for LinkedIn profiles. Don’t simply reiterate what’s already stated. Give only 1 option.Provide only one summary, avoiding extra commentary, introductory statement, or options.";

    const body = JSON.stringify({
      model: "gemma3:1b",
      messages: [
        { role: "system", content: systemPrimpt },
        { role: "user", content: prompt },
      ],
      // max_tokens: 100,
      // temperature: 0.7,
      stream: false,
    });

    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      mode: "cors",
      credentials: "omit",
      method: "POST",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,en-IN;q=0.8",
        "content-type": "application/json",
        "sec-ch-ua":
          '"Chromium";v="134", "Not:A-Brand";v="24", "Microsoft Edge";v="134"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "none",
        "sec-fetch-storage-access": "active",
      },
      body,
    });

    console.log(response);
    const data = await response.json();
    console.log(data);

    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content.trim();
    }

    if (data.message) {
      return (
        data.message?.content ||
        "Relly sorry, not able to generate response, CODE: IDF"
      );
    }
    throw new Error("No summary generated");
  }
});
