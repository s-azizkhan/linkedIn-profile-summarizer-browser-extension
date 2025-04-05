document.addEventListener("DOMContentLoaded", () => {
  const summarizeBtn = document.getElementById("summarizeBtn");
  const summaryText = document.getElementById("summaryText");
  const loading = document.getElementById("loading");

  const AI_API_KEY = "ollama";
  const AI_API_URL = "http://127.0.0.1:11434/api/chat";
  const AI_MODEL = "gemma3:1b";

  summarizeBtn.addEventListener("click", async () => {
    loading.style.display = "block";
    // update the button text to indicate loading * disable the button
    // summarizeBtn.textContent = "Loading...";
    summarizeBtn.disabled = true;
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
          summarizeBtn.disabled = false;
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
              summarizeBtn.disabled = false;
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
            summarizeBtn.disabled = false;
          },
        );
      });
    } catch (error) {
      summaryText.textContent = error.message;
      loading.style.display = "none";
      summarizeBtn.disabled = false;
    }
  });

  async function getChatGPTSummary(prompt) {
    console.log(prompt);

    const systemPrimpt =
      "Your task is to generate a concise & unbiased summary(in 2-3 sentence) for LinkedIn profiles. Don’t simply reiterate what’s already stated. Give only 1 option.Provide only one summary, avoiding extra commentary, introductory statement, or options.";

    const body = JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrimpt },
        { role: "user", content: prompt },
      ],
      // max_tokens: 100,
      // temperature: 0.7,
      stream: false,
    });

    const response = await fetch(AI_API_URL, {
      mode: "cors",
      credentials: "omit",
      method: "POST",
      headers: {
        authorization: `Bearer ${AI_API_KEY}`,
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
