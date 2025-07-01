import { initMainEventListeners } from "./eventHandler.js";

const elements = {
    section: document.getElementById("goal-section"),
    container: document.getElementById("goal-cards"),
}

async function initialize() {
    initMainEventListeners(elements);
  
    try {
      await fetchGoals();
      applyFiltersAndSort(elements);
      render(elements);
    } catch (error) {
      elements.tableContainer.innerHTML = '<div class="p-4 text-red-600">Failed to load transactions.</div>';
    }
}

initialize();