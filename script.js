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
function renderCards(items){
  resultsEl.innerHTML = items.map(item=>{
    const poster = item.Poster && item.Poster!=="N/A" ? item.Poster : "";
    return `
      <article class="card" data-imdb="${item.imdbID}" tabindex="0" role="button" aria-label="Open details for ${escapeHtml(item.Title)}">
        ${poster ? `<img class="poster" src="${poster}" alt="Poster for ${escapeHtml(item.Title)}">` : `<div class="poster" aria-label="No poster available"></div>`}
        <div class="card-body">
          <strong>${escapeHtml(item.Title)}</strong><br>
          <span class="muted">${item.Year}</span>
        </div>
      </article>
    `;
  }).join("");

  [...resultsEl.querySelectorAll('.card')].forEach(card=>{
    card.addEventListener('click', ()=> openDetails(card.dataset.imdb));
    card.addEventListener('keypress', (e)=>{ if(e.key==='Enter' || e.key===' ') openDetails(card.dataset.imdb); });
  });
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}