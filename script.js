const API_KEY = "fd9a6a82";
const BASE = "https://www.omdbapi.com/";

const form = document.getElementById('searchForm');
const queryInput = document.getElementById('query');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const detailsEl = document.getElementById('details');

function setStatus(msg){ statusEl.textContent = msg; }

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const q = queryInput.value.trim();
  if(!q) return;
  setStatus(`Searching “${q}”...`);
});
