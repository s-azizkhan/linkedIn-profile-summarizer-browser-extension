// Function to scrape all similar data sections from the HTML
function scrapeAllProfileData() {
  // Array to store all scraped sections
  const allScrapedData = [];

  // Select all potential entity containers
  const entityContainers = document.querySelectorAll(
    ".display-flex.flex-column.align-self-center.flex-grow-1",
  );

  entityContainers.forEach((container) => {
    const sectionData = {
      sectionTitle: "",
      skills: [],
    };

    // Get the section title (e.g., "Top skills") within this container
    const titleElement = container.querySelector(
      ".t-bold span:not(.visually-hidden)",
    );
    if (titleElement) {
      sectionData.sectionTitle = titleElement.textContent.trim();
    }

    // Get the skills list within this container
    const skillsElement = container.querySelector(
      ".t-14.t-normal span:not(.visually-hidden)",
    );
    if (skillsElement) {
      const skillsText = skillsElement.textContent.trim();
      sectionData.skills = skillsText
        .split("•")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
    }

    // Only add to results if we found meaningful data
    if (sectionData.sectionTitle || sectionData.skills.length > 0) {
      allScrapedData.push(sectionData);
    }
  });

  return allScrapedData;
}

// Function to scrape only "Top skills" sections
function scrapeTopSkillsData() {
  // Array to store "Top skills" sections
  const topSkillsData = [];

  // Select all potential entity containers
  const entityContainers = document.querySelectorAll(
    ".display-flex.flex-column.align-self-center.flex-grow-1",
  );

  entityContainers.forEach((container) => {
    const sectionData = {
      sectionTitle: "",
      skills: [],
    };

    // Get the section title within this container
    const titleElement = container.querySelector(
      ".t-bold span:not(.visually-hidden)",
    );
    if (titleElement) {
      sectionData.sectionTitle = titleElement.textContent.trim();
    }

    // Only proceed if the title is "Top skills"
    if (sectionData.sectionTitle === "Top skills") {
      // Get the skills list within this container
      const skillsElement = container.querySelector(
        ".t-14.t-normal span:not(.visually-hidden)",
      );
      if (skillsElement) {
        const skillsText = skillsElement.textContent.trim();
        sectionData.skills = skillsText
          .split("•")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0);
      }

      // Add to results if we have data
      if (sectionData.sectionTitle || sectionData.skills.length > 0) {
        topSkillsData.push(sectionData);
      }
    }
  });

  return topSkillsData[0]?.skills || [];
}

function getTextByXPath(xpath) {
  // Use document.evaluate to find the element matching the XPath
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  );

  let aboutText = "";
  // Check if the result is valid
  if (result.singleNodeValue) {
    // Get the text content of the matched element
    return result.singleNodeValue.textContent.trim();
  } else {
    console.log("No matching element found.");
  }
  return "";
}

function scrapeProfile() {
  const experiences = [];

  const topSkills = scrapeTopSkillsData();
  // const experiences = extractExperienceData($0);

  // Define the XPath expression
  const aboutXpath = `//*[@id="profile-content"]/div/div[2]/div/div/main/section[2]/div[3]/div/div/div/span[2]`;

  const aboutText = getTextByXPath(aboutXpath);
  const profileData = {
    name: getTextByXPath(`//*[@id="ember36"]/h1`),
    headline: getTextByXPath(
      `//*[@id="profile-content"]/div/div[2]/div/div/main/section[1]/div[2]/div[2]/div[1]/div[2]`,
    ),
    location: getTextByXPath(
      `//*[@id="profile-content"]/div/div[2]/div/div/main/section[1]/div[2]/div[2]/div[2]/span[1]`,
    ),
    about: aboutText,
    topSkills,
    experiences,
    // : Array.from(
    //   document.querySelectorAll(".pv-profile-section__card-item-v2"),
    // ).map((exp) => {
    //   return {
    //     title:
    //       exp
    //         .querySelector(".pv-entity__summary-info h3")
    //         ?.textContent.trim() || "",
    //     company:
    //       exp
    //         .querySelector(".pv-entity__secondary-title")
    //         ?.textContent.trim() || "",
    //     duration:
    //       exp
    //         .querySelector(".pv-entity__date-range span:nth-child(2)")
    //         ?.textContent.trim() || "",
    //     description:
    //       exp.querySelector(".pv-entity__description")?.textContent.trim() ||
    //       "",
    //   };
    // }),
    // education: Array.from(
    //   document.querySelectorAll(".pv-education-entity"),
    // ).map((edu) => {
    //   return {
    //     school: edu.querySelector("h3")?.textContent.trim() || "",
    //     degree:
    //       edu.querySelector(".pv-entity__degree-name")?.textContent.trim() ||
    //       "",
    //     dates: edu.querySelector(".pv-entity__dates")?.textContent.trim() || "",
    //   };
    // }),
  };
  return profileData;
}

// Handle messages with better error checking
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "ready" });
    return true;
  }

  if (request.action === "scrape") {
    try {
      const profileData = scrapeProfile();
      sendResponse({ data: profileData });
    } catch (error) {
      sendResponse({ error: error.message });
    }
    return true; // Keep the message channel open for async response
  }
});

// Verify content script is loaded
console.log("LinkedIn Summarizer content script loaded");
