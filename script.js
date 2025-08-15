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
async function search(q){
  detailsEl.hidden = true;
  resultsEl.innerHTML = "";
  try{
    const url = `${BASE}?apikey=${API_KEY}&s=${encodeURIComponent(q)}&type=movie`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.Response === "False"){ setStatus(data.Error || "No results."); return; }
    // placeholder render (will be replaced next)
    resultsEl.textContent = JSON.stringify(data.Search, null, 2);
    setStatus(`Found ${data.totalResults} result(s) for “${q}”.`);
  }catch(err){
    console.error(err);
    setStatus("Error fetching results.");
  }
}