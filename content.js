function parseExpDescription(description) {
  return description?.replace(/[\n\r]/g, "")
    ?.split("•")
    ?.map((desc) => desc.trim())
    ?.filter(Boolean)
    ?.join(" | ");
}
// Function to evaluate XPath and return nodes
const getElementsByXPath = (xpath, context = document) => {
  const result = document.evaluate(
    xpath,
    context,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  const nodes = [];
  for (let i = 0; i < result.snapshotLength; i++) {
    nodes.push(result.snapshotItem(i));
  }
  return nodes;
};

// Function to evaluate XPath and return a single node
const getElementByXPath = (xpath, context = document) => {
  return document.evaluate(
    xpath,
    context,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
};

// Function to extract text content from an element
const extractTextFromElement = (element) => {
  return element ? element.textContent.trim() || "" : "";
};

// Main function to extract experience and education data
function extractProfileData() {
  // Structure to hold the profile data
  const profileData = {
    experiences: [],
    education: []
  };
  try {
    // Click the "See all experiences" button if it exists
    const experienceButton = getElementByXPath('//*[@id="navigation-index-see-all-experiences"]');
    if (experienceButton) {
      // TODO: check this
      // experienceButton.click();
      console.log("Waiting for experience section to load...");
      setTimeout(() => { }, 2000); // Basic delay, consider Promises for production
    } else {
      console.log("Experience button not found!");
    }

    // --- Extract Experience Data ---
    const experienceSection = getElementByXPath('//section[.//div[@id="experience"]]');
    if (!experienceSection) {
      console.warn("Experience section not found!");
    } else {
      const experienceUl = getElementByXPath('.//ul', experienceSection);
      if (!experienceUl) {
        console.warn("Experience <ul> not found within section!");
      } else {
        const experienceItems = getElementsByXPath(
          './li[contains(@class, "artdeco-list__item") or contains(@id, "profilePagedListComponent")]',
          experienceUl
        );

        experienceItems.forEach((item) => {
          const experience = {};

          // Company logo
          const logoImg = getElementByXPath(
            './/img[contains(@class, "ivm-view-attr__img--centered")]',
            item
          );
          // experience.companyLogo = logoImg ? logoImg.src : null;

          // Company URL
          const companyLink = getElementByXPath(
            './/a[contains(@class, "optional-action-target-wrapper") and @data-field="experience_company_logo"]',
            item
          );
          // TODO: check this
          // experience.companyUrl = companyLink ? companyLink.href : null;

          // // Main-level description (if available)
          // const mainDescriptionElement = getElementByXPath(
          //   './/span[@aria-hidden="true"]',
          //   item
          // );

          // Check for nested structure
          const subPositions = getElementsByXPath(
            './/li[contains(@class, "TfrFIRIXZAKMfjBWMLJDztsxwClWTzsRTAlooJGU")]//div[contains(@data-view-name, "profile-component-entity")]',
            item
          );

          if (subPositions.length > 0) {
            // Nested structure
            const companyNameElement = getElementByXPath(
              './/*[contains(@class, "t-bold")]//span[@aria-hidden="true"]',
              item
            );
            experience.companyName = extractTextFromElement(companyNameElement);

            const employmentDetails = getElementByXPath(
              './/*[contains(@class, "t-14") and contains(@class, "t-normal") and not(contains(@class, "t-black--light"))]//span[@aria-hidden="true"]',
              item
            );
            if (employmentDetails) {
              const [employmentType, duration] = extractTextFromElement(employmentDetails).split(" · ");
              experience.employmentType = employmentType ? employmentType.trim() : null;
              experience.overallDuration = duration ? duration.trim() : null;
            }

            const locationElement = getElementByXPath(
              './/*[contains(@class, "t-14") and contains(@class, "t-black--light")]//span[@aria-hidden="true" and not(ancestor::*[contains(@class, "pvs-entity__caption-wrapper")])]',
              item
            );
            experience.location = extractTextFromElement(locationElement);

            experience.positions = [];
            subPositions.forEach((subItem) => {
              const position = {};

              const positionTitleElement = getElementByXPath(
                './/*[contains(@class, "t-bold")]//span[@aria-hidden="true"]',
                subItem
              );
              position.title = extractTextFromElement(positionTitleElement);

              const positionDurationElement = getElementByXPath(
                './/*[contains(@class, "pvs-entity__caption-wrapper")]',
                subItem
              );
              position.duration = extractTextFromElement(positionDurationElement);

              const positionSkillsElement = getElementByXPath(
                './/*[contains(@class, "t-14") and contains(@class, "t-normal") and contains(@class, "t-black")]//strong',
                subItem
              );

              // Sub-level description (if available)
              const subDescriptionElement = getElementByXPath(
                './/*//div[contains(@class, "pvs-entity__sub-components")]//div[contains(@class, "t-14") and contains(@class, "t-normal") and contains(@class, "t-black")]//span[@class="visually-hidden"]',
                subItem
              );
              position.description = parseExpDescription(extractTextFromElement(subDescriptionElement))


              if (positionSkillsElement) {
                const skillsText = extractTextFromElement(positionSkillsElement).replace(/and \+\d+ skills/, "").trim();
                position.skills = skillsText.split(", ")?.filter(Boolean)?.map((skill) => skill.trim());
              }

              experience.positions.push(position);
            });
          } else {
            // Flat structure
            const jobTitleElement = getElementByXPath(
              './/*[contains(@class, "t-bold")]//span[@aria-hidden="true"]',
              item
            );
            experience.jobTitle = extractTextFromElement(jobTitleElement);

            const companyDetails = getElementByXPath(
              './/*[contains(@class, "t-14") and contains(@class, "t-normal") and not(contains(@class, "t-black--light"))]//span[@aria-hidden="true"]',
              item
            );
            if (companyDetails) {
              const [companyName, employmentType] = extractTextFromElement(companyDetails).split(" · ");
              experience.companyName = companyName ? companyName.trim() : null;
              // TODO: check this
              // experience.employmentType = employmentType ? employmentType.trim() : null;
            }

            // Main-level description (if available)
            const mainDescriptionElement = getElementByXPath(
              './/*//div[contains(@class, "pvs-entity__sub-components")]//div[contains(@class, "t-14") and contains(@class, "t-normal") and contains(@class, "t-black")]//span[@class="visually-hidden"]',
              item
            );
            experience.description = parseExpDescription(extractTextFromElement(mainDescriptionElement))

            const durationElement = getElementByXPath(
              './/*[contains(@class, "pvs-entity__caption-wrapper")]',
              item
            );
            experience.duration = extractTextFromElement(durationElement);

            // TODO: check this
            // const locationElement = getElementByXPath(
            //   './/*[contains(@class, "t-14") and contains(@class, "t-black--light")]//span[@aria-hidden="true" and not(ancestor::*[contains(@class, "pvs-entity__caption-wrapper")])]',
            //   item
            // );
            // experience.location = extractTextFromElement(locationElement);

            const skillsElement = getElementByXPath(
              '//*[contains(@class, "hoverable-link-text") and contains(@class, "display-flex") and contains(@class, "align-items-center") and contains(@class, "t-14") and contains(@class, "t-normal") and contains(@class, "t-black")]',
              item
            );
            if (skillsElement) {
              const skillsText = extractTextFromElement(skillsElement)
                .replace("Skills:", "")?.replace(/and \+\d+ skills/, "").trim();
              experience.skills = skillsText.split(", ")?.filter(Boolean)?.map((skill) => skill.trim());
            }
          }

          profileData.experiences.push(experience);
        });
      }
    }

    // --- Extract Education Data ---
    const educationSection = getElementByXPath('//section[.//div[@id="education"]]');
    if (!educationSection) {
      console.warn("Education section not found!");
    } else {
      const educationUl = getElementByXPath('.//ul', educationSection);
      if (!educationUl) {
        console.warn("Education <ul> not found within section!");
      } else {
        const educationItems = getElementsByXPath('./li', educationUl);

        educationItems.forEach((item) => {
          const education = {};

          // Institution logo
          const logoImg = getElementByXPath(
            './/img[contains(@class, "ivm-view-attr__img--centered")]',
            item
          );
          // TODO: check this
          // education.institutionLogo = logoImg ? logoImg.src : null;

          // Institution URL
          const institutionLink = getElementByXPath(
            './/a[contains(@class, "optional-action-target-wrapper")]',
            item
          );
          // TODO: check this
          // education.institutionUrl = institutionLink ? institutionLink.href : null;

          // Institution name
          const institutionNameElement = getElementByXPath(
            './/*[contains(@class, "t-bold")]//span[@aria-hidden="true"]',
            item
          );
          education.institutionName = extractTextFromElement(institutionNameElement);

          // Duration (e.g., years attended)
          const durationElement = getElementByXPath(
            './/*[contains(@class, "pvs-entity__caption-wrapper")]',
            item
          );
          education.duration = extractTextFromElement(durationElement);

          profileData.education.push(education);
        });
      }
    }
    profileData.education.reverse()
    profileData.experiences.reverse()

    return profileData;
    // Convert to JSON and log
    // const jsonOutput = JSON.stringify(profileData, null, 2);
    // return jsonOutput;

  } catch (err) {
    console.error("Error extracting profile data:", err);
    return profileData;
  } finally {
    const experienceBackBtn = getElementByXPath('//*[@aria-label="Back to the main profile page"]');
    if (experienceBackBtn) {
      // TODO: check this
      // experienceBackBtn.click();
    } else {
      console.log("Experience back button not found!");
    }
  }
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
    return extractTextFromElement(result.singleNodeValue);
  } else {
    console.log("No matching element found.");
  }
  return "";
}

function scrapeProfile() {
  const topSkills = scrapeTopSkillsData();
  // const experiences = extractExperienceData($0);
  const { experiences, education } = extractProfileData()

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
    education
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
