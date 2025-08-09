# language-learning-ext
A Chrome extension that replaces a percentage of words on webpages with their translations in another language, helping you learn by immersion while you browse.

## Tech Stack

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?logo=javascript&logoColor=black)  
![Chrome Extensions](https://img.shields.io/badge/Chrome_Extension-FABC0C?logo=google-chrome&logoColor=white)  
![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg?logo=html5&logoColor=white)  
![CSS3](https://img.shields.io/badge/CSS3-1572B6.svg?logo=css3&logoColor=white)  
![Azure Translator API](https://img.shields.io/badge/Azure_Translator_API-0078D4?logo=microsoft-azure&logoColor=white)  

---

## Features

- **Live Translation via Azure Translator API** – Fetches translations in real time for any supported language.
- **Persistent Translation Caching** – Stores API responses in `chrome.storage.local` to reduce repeated calls.
- **Tooltips for Learning** – Hover over a translated word to reveal its original form.
- **Customizable Replacement Percentage** – Adjust how many words get translated in the popup UI.
- **Service Worker Defaults** – Automatically sets defaults (`replacePct` = 10%, target language = Spanish) on install.
- **Dynamic Content Handling** – Integrated `MutationObserver` to handle translations in dynamically loaded content (e.g., search results, infinite scroll).
- **Fallback to Local Dictionary** – Includes a sample `en_es.json` dictionary for offline or testing mode.

 ## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/language-learning-ext.git
   
2. Open Chrome and go to:
   ```bash
   chrome://extensions/
   
4. Enable Developer Mode (top right).
5. Click Load unpacked and select the extension folder.
6. In config.js, add your Azure Translator API key, region, and endpoint.
7. Set your replacement percentage and target language in the popup.
