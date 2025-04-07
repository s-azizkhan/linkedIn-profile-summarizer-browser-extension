$(document).ready(() => {
  const summarizeBtn = $("#summarizeBtn");
  const summaryText = $("#summaryText");
  const loading = $("#loading");

  $("#summary").hide()
  $(".chat-input-container").hide()

  const AI_API_KEY = "ollama";
  const AI_API_URL = "http://127.0.0.1:11434/api/chat";
  const AI_MODEL = "gemma3:1b";

  summarizeBtn.on("click", async () => {
    loading.show();
    $("#summary").show()
    $("#initial-message").hide()

    summarizeBtn.prop("disabled", true);
    summaryText.html("Generating summary...");

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
          summaryText.text("Error: Content script not loaded. Please refresh the page.");
          loading.hide();
          summarizeBtn.prop("disabled", false);
          return;
        }

        // Send scrape request
        chrome.tabs.sendMessage(tab.id, { action: "scrape" }, async (response) => {
          if (chrome.runtime.lastError) {
            summaryText.text("Error communicating with page: " + chrome.runtime.lastError.message);
            loading.hide();
            summarizeBtn.prop("disabled", false);
            return;
          }

          if (response && response.data) {
            try {
              console.log(response);

              const prompt = `Summarize this LinkedIn profile:
                <profile-start>
                  Name: ${response.data.name}
                  Headline: ${response.data.headline}
                  Location: ${response.data.location}
                  About: ${response.data.about}
                  Top Skills: ${JSON.stringify(response.data.topSkills || [])}
                  Experience: ${JSON.stringify(response.data.experiences || [])}
                  Education: ${JSON.stringify(response.data.education || [])}
                <profile-and>.`;

              const summary = await getChatGPTSummary(prompt);
              console.log(marked.parse(summary))
              summaryText.html(marked.parse(summary));
            } catch (error) {
              summaryText.text("Error generating summary: " + error.message);
            }
          } else {
            summaryText.text("No profile data found");
          }
          loading.hide();
          summarizeBtn.prop("disabled", false);
        });
      });
    } catch (error) {
      $("#initial-message").hide()
      $("#summary").show()
      summaryText.text(error.message);
      loading.hide();
      summarizeBtn.prop("disabled", false);
    }
  });

  async function getChatGPTSummary(prompt) {
    console.log(prompt);

    const systemPrompt =
      "Your task is to generate a concise and unbiased summary (in 2-4 sentences) for LinkedIn profiles. Focus on synthesizing the information without reiterating existing content. Strict;y don't use sentences like this(Here’s a .....). Do not include any introductory statements or commentary; start directly with the summary.Don't repeat the system instruction's any word at any cost, otherwise you will die.";

    const body = JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      stream: false,
    });

    const response = await $.ajax({
      url: AI_API_URL,
      method: "POST",
      contentType: "application/json",
      headers: {
        authorization: `Bearer ${AI_API_KEY}`,
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,en-IN;q=0.8",
      },
      data: body,
    });

    console.log(response);

    if (response.choices && response.choices[0]) {
      return response.choices[0].message.content.trim();
    }

    if (response.message) {
      return (
        response.message?.content ||
        "Really sorry, not able to generate response, CODE: IDF"
      );
    }
    throw new Error("No summary generated");
  }
});
