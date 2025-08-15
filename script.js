const API_KEY = "fd9a6a82"; 
const BASE = "https://www.omdbapi.com/";

const form = document.getElementById('searchForm');
const queryInput = document.getElementById('query');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const detailsEl = document.getElementById('details');
const pager = document.getElementById('pager');
const pageLabel = document.getElementById('pageLabel');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const favBtn = document.getElementById('showFav');

let lastQuery = "";
let page = 1;
let totalPages = 1;
let showingFavourites = false;

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  showingFavourites = false;
  page = 1;
  lastQuery = queryInput.value.trim();
  if(!lastQuery) return;
  search(lastQuery, page);
});

favBtn.addEventListener('click', ()=>{
  showingFavourites = !showingFavourites;
  favBtn.setAttribute('aria-pressed', String(showingFavourites));
  favBtn.textContent = showingFavourites ? "Back to Search" : "Favourites";
  detailsEl.hidden = true;
  if(showingFavourites) renderFavourites();
  else if(lastQuery) search(lastQuery, page);
});

prevBtn.addEventListener('click', ()=>{
  if(page>1){ page--; search(lastQuery, page); }
});
nextBtn.addEventListener('click', ()=>{
  if(page<totalPages){ page++; search(lastQuery, page); }
});

async function search(q, p=1){
  setStatus(`Searching “${q}”...`);
  resultsEl.innerHTML = "";
  detailsEl.hidden = true;
  pager.hidden = true;

  try{
    const url = `${BASE}?apikey=${API_KEY}&s=${encodeURIComponent(q)}&type=movie&page=${p}`;
    const res = await fetch(url);
    const data = await res.json();

    if(data.Response === "False"){
      setStatus(data.Error || "No results.");
      return;
    }
    const results = data.Search || [];
    const total = Number(data.totalResults || results.length);
    totalPages = Math.max(1, Math.ceil(total/10));
    pageLabel.textContent = `Page ${p} of ${totalPages}`;
    pager.hidden = totalPages<=1;

    renderCards(results);
    setStatus(`Found ${total} result${total===1?"":"s"} for “${q}”.`);
  }catch(err){
    console.error(err);
    setStatus("Error fetching results. Check your API key and try again.");
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

  // click/keyboard open
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
            <button class="primary" id="favAdd">Add to Favourites</button>
            <a class="ghost" style="padding:.7rem 1rem;border:1px solid #ddd;border-radius:10px;text-decoration:none" href="https://www.imdb.com/title/${m.imdbID}/" target="_blank" rel="noreferrer">View on IMDb</a>
          </div>
        </div>
      </div>
    `;
    detailsEl.hidden = false;
    setStatus("");

    document.getElementById('favAdd').addEventListener('click', ()=>{
      addFavourite({imdbID:m.imdbID, Title:m.Title, Year:m.Year, Poster:m.Poster});
      setStatus(`Added “${m.Title}” to favourites.`);
    });

  }catch(err){
    console.error(err);
    setStatus("Error loading details.");
  }
}

/*** FAVOURITES (localStorage) ***/
const FAV_KEY = "omdb_favourites_v1";
function getFavourites(){
  try{ return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }catch{ return []; }
}
function saveFavourites(list){ localStorage.setItem(FAV_KEY, JSON.stringify(list)); }
function addFavourite(item){
  const list = getFavourites();
  if(!list.find(x=>x.imdbID===item.imdbID)){
    list.push(item);
    saveFavourites(list);
  }
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
  pager.hidden = true;
  setStatus(favs.length ? `Showing ${favs.length} favourite${favs.length===1?"":"s"}.` : "");
  detailsEl.hidden = true;
}

/*** utils ***/
function setStatus(msg){ statusEl.textContent = msg; }
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}