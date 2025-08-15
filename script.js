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
async function openDetails(imdbID){
  setStatus("Loading details…");
  detailsEl.hidden = true;
  try{
    const url = `${BASE}?apikey=${API_KEY}&i=${imdbID}&plot=full`;
    const res = await fetch(url);
    const m = await res.json();
    if(m.Response === "False"){ setStatus(m.Error || "Not found."); return; }

    const poster = m.Poster && m.Poster!=="N/A" ? `<img src="${m.Poster}" alt="Poster for ${escapeHtml(m.Title)}" style="width:160px;border-radius:12px;border:1px solid #eee">` : "";
    const ratings = (m.Ratings||[]).map(r=>`<span class="badge">${r.Source}: ${r.Value}</span>`).join("");

    detailsEl.innerHTML = `
      <div class="row">
        <div>${poster}</div>
        <div>
          <h2 style="margin:.25rem 0">${escapeHtml(m.Title)} <span class="muted">(${m.Year})</span></h2>
          <div class="muted">${m.Rated} • ${m.Runtime} • ${m.Genre}</div>
          <p style="margin:.5rem 0">${escapeHtml(m.Plot || "No plot available.")}</p>
          <div><strong>Director:</strong> ${escapeHtml(m.Director||"—")}</div>
          <div><strong>Actors:</strong> ${escapeHtml(m.Actors||"—")}</div>
          <div><strong>Language:</strong> ${escapeHtml(m.Language||"—")}</div>
          <div style="margin-top:.5rem">${ratings}</div>
          <div style="margin-top:.75rem; display:flex; gap:.5rem">
            <a class="ghost" style="padding:.7rem 1rem;border:1px solid #ddd;border-radius:10px;text-decoration:none" href="https://www.imdb.com/title/${m.imdbID}/" target="_blank" rel="noreferrer">View on IMDb</a>
          </div>
        </div>
      </div>
    `;
    detailsEl.hidden = false;
    setStatus("");
  }catch(err){
    console.error(err);
    setStatus("Error loading details.");
  }
}
/* FAVOURITES */
const FAV_KEY = "omdb_favourites_v1";
function getFavourites(){ try{ return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }catch{ return []; } }
function saveFavourites(list){ localStorage.setItem(FAV_KEY, JSON.stringify(list)); }
function addFavourite(item){
  const list = getFavourites();
  if(!list.find(x=>x.imdbID===item.imdbID)){ list.push(item); saveFavourites(list); }
}
function removeFavourite(id){
  const list = getFavourites().filter(x=>x.imdbID!==id);
  saveFavourites(list);
  renderFavourites();
}
function renderFavourites(){
  const favs = getFavourites();
  resultsEl.innerHTML = favs.length ? favs.map(item=>{
    const poster = item.Poster && item.Poster!=="N/A" ? item.Poster : "";
    return `
      <article class="card">
        ${poster ? `<img class="poster" src="${poster}" alt="Poster for ${escapeHtml(item.Title)}">` : `<div class="poster"></div>`}
        <div class="card-body">
          <strong>${escapeHtml(item.Title)}</strong><br>
          <span class="muted">${item.Year}</span><br>
          <div style="margin-top:.5rem; display:flex; gap:.5rem">
            <button class="primary" onclick="openDetails('${item.imdbID}')">Open</button>
            <button class="ghost" onclick="removeFavourite('${item.imdbID}')">Remove</button>
          </div>
        </div>
      </article>
    `;
  }).join("") : `<div class="muted">No favourites yet. Search for a movie and add one.</div>`;
  setStatus(favs.length ? `Showing ${favs.length} favourite${favs.length===1?"":"s"}.` : "");
  detailsEl.hidden = true;
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}