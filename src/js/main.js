import "../styles/app.css";
import { api, supabase, uploadPhoto } from "./api.js";
import { state, initSession, signIn, signUp, signOut, resetPassword, loadBusinesses, loadAll, setBusiness } from "./state.js";
import { money, today, dateLabel, escapeHtml, waHref, phoneHref, mapsHref, toast, getRoute, setRoute, quoteTotals, serializeForm, downloadBlob, publicUrlForSlug } from "./utils.js";

const app = document.getElementById("app");
const DEFAULT_TERMS = "Valid until expiry date. Deposit payable before work starts unless otherwise agreed. Balance payable on completion.";

window.addEventListener("hashchange", render);
window.addEventListener("online", () => toast("Back online."));
window.addEventListener("offline", () => toast("You are offline. Saved changes need a connection.", "warn"));

init();

async function init() {
  registerServiceWorker();
  await initSession();
  if (supabase) supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    state.user = session?.user || null;
    if (!session) renderAuth();
  });
  render();
}

async function render() {
  const route = getRoute();
  if (location.pathname.startsWith("/business/")) return renderPublicPage(location.pathname.split("/").pop());
  if (!state.session) return renderAuth();
  try {
    await loadBusinesses();
    if (!state.business && route !== "/business-setup") return renderBusinessSetup();
    await loadAll();
    renderShell(route);
  } catch (err) {
    console.error(err);
    app.innerHTML = errorView(err.message || "Unable to load app.");
  }
}

function renderAuth() {
  app.innerHTML = `<main class="auth-page">
    <section class="auth-card">
      <div class="brand-mark">LC</div>
      <h1>Lead-to-cash for contractors</h1>
      <p>Manage enquiries, quotes, follow-ups, jobs and payments from a phone-first PWA.</p>
      ${!supabase ? `<div class="alert error">Missing <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>. Add them in your hosting environment.</div>` : ""}
      <form id="auth-form" class="stack">
        <label>Email<input name="email" type="email" autocomplete="email" required /></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" minlength="6" required /></label>
        <button class="primary" name="mode" value="login">Log in</button>
        <button class="secondary" name="mode" value="signup">Create account</button>
        <button class="link-button" name="mode" value="reset">Send password reset</button>
      </form>
    </section>
  </main>`;
  document.getElementById("auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitter = event.submitter?.value || "login";
    const { email, password } = serializeForm(event.currentTarget);
    try {
      if (submitter === "signup") { await signUp(email, password); toast("Account created. Check your email if confirmation is enabled."); }
      else if (submitter === "reset") { await resetPassword(email); toast("Password reset email sent if the address exists."); return; }
      else { await signIn(email, password); toast("Logged in."); }
      setRoute("/dashboard");
      render();
    } catch (err) { toast(err.message, "error"); }
  });
}

function renderShell(route) {
  const tabs = [["/dashboard","Today"],["/leads","Leads"],["/customers","Customers"],["/quotes","Quotes"],["/more","More"]];
  app.innerHTML = `<div class="app-shell">
    <header class="topbar">
      <div><strong>${escapeHtml(state.business?.name || "Contractor")}</strong><small>${navigator.onLine ? "Online" : "Offline"}</small></div>
      <select id="business-switch" aria-label="Switch business">${state.businesses.map(b => `<option value="${b.id}" ${b.id===state.business?.id?"selected":""}>${escapeHtml(b.name)}</option>`).join("")}</select>
    </header>
    <main class="screen" id="screen"></main>
    <nav class="bottom-nav">${tabs.map(([href,label]) => `<button class="${route.startsWith(href) ? "active" : ""}" data-route="${href}">${label}</button>`).join("")}</nav>
  </div>`;
  document.getElementById("business-switch").addEventListener("change", async (e) => { await setBusiness(e.target.value); await render(); });
  document.querySelectorAll("[data-route]").forEach(btn => btn.addEventListener("click", () => setRoute(btn.dataset.route)));
  const screen = document.getElementById("screen");
  if (route === "/dashboard") screen.innerHTML = dashboardView();
  else if (route === "/leads") screen.innerHTML = leadsView();
  else if (route.startsWith("/lead/")) screen.innerHTML = leadDetailView(route.split("/").pop());
  else if (route === "/customers") screen.innerHTML = customersView();
  else if (route.startsWith("/customer/")) screen.innerHTML = customerDetailView(route.split("/").pop());
  else if (route === "/quotes") screen.innerHTML = quotesView();
  else if (route.startsWith("/quote/")) screen.innerHTML = quoteBuilderView(route.split("/").pop());
  else if (route === "/more") screen.innerHTML = moreView();
  else if (route === "/jobs") screen.innerHTML = jobsView();
  else if (route === "/calendar") screen.innerHTML = calendarView();
  else if (route === "/payments") screen.innerHTML = paymentsView();
  else if (route === "/templates") screen.innerHTML = templatesView();
  else if (route === "/business-setup") screen.innerHTML = businessFormView();
  bindActions();
}

function dashboardView() {
  const d = state.data.dashboard;
  return `<section class="hero-card"><h1>What needs attention today?</h1><p>${d.followups_due} follow-ups due, ${d.upcoming_jobs} upcoming jobs, ${d.outstanding_payments} outstanding payments.</p><button class="primary" data-modal="lead">+ Add Lead</button></section>
  <section class="metric-grid">${metric("New leads", d.new_leads)}${metric("Quotes waiting", d.quotes_awaiting)}${metric("Follow-ups due", d.followups_due)}${metric("Upcoming jobs", d.upcoming_jobs)}${metric("Outstanding", money(d.outstanding_amount))}</section>
  <h2>Today list</h2><div class="card-list">${state.data.followUps.filter(f=>f.due_date<=today() && f.status!=="Completed").map(followUpCard).join("") || empty("No follow-ups due today.")}${state.data.jobs.filter(j=>j.job_date>=today()).slice(0,3).map(jobCard).join("")}</div>`;
}
function metric(label, value) { return `<article class="metric"><small>${label}</small><strong>${value}</strong></article>`; }
function leadsView() { return header("Leads", "+ Add Lead", "lead") + `<div class="status-row">${["New","Contacted","Site Visit","Quoted","Won","Lost"].map(s=>`<span>${s}</span>`).join("")}</div><div class="card-list">${state.data.leads.map(leadCard).join("") || empty("No leads yet. Add your first enquiry.")}</div>`; }
function leadCard(l) { return `<article class="card"><div class="row"><h3>${escapeHtml(l.customer_name)}</h3><span class="badge">${l.status}</span></div><p>${escapeHtml(l.job_type || l.description || "Lead")}</p><small>${dateLabel(l.created_at)} · ${money(l.estimated_value)}</small><div class="actions"><a href="${phoneHref(l.phone)}">Call</a><a target="_blank" href="${waHref(l.whatsapp||l.phone, templateText("New enquiry", { customer: l.customer_name }))}">WhatsApp</a><a target="_blank" href="${mapsHref(l.location)}">Map</a><button data-go="/lead/${l.id}">Open</button></div></article>`; }
function leadDetailView(id) { const l = state.data.leads.find(x=>x.id===id); if(!l) return empty("Lead not found."); return `<section class="detail"><button data-go="/leads">← Leads</button><h1>${escapeHtml(l.customer_name)}</h1><p>${escapeHtml(l.description||"")}</p><div class="actions"><button data-convert-lead="${l.id}">Convert to customer</button><button data-create-quote="${l.id}">Create quote</button><a href="${phoneHref(l.phone)}">Call</a><a target="_blank" href="${waHref(l.whatsapp||l.phone, templateText("New enquiry", { customer:l.customer_name }))}">WhatsApp</a></div>${activityFor("lead", l.id)}<form class="note-form" data-note="lead:${l.id}"><textarea name="note" placeholder="Add note"></textarea><button>Add note</button></form></section>`; }
function customersView() { return header("Customers", "+ Add Customer", "customer") + `<div class="card-list">${state.data.customers.map(customerCard).join("") || empty("No customers yet. Convert a lead or add one.")}</div>`; }
function customerCard(c) { return `<article class="card"><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.address||c.notes||"")}</p><div class="actions"><a href="${phoneHref(c.phone)}">Call</a><a target="_blank" href="${waHref(c.whatsapp||c.phone, `Hi ${c.name}, `)}">WhatsApp</a><button data-go="/customer/${c.id}">History</button></div></article>`; }
function customerDetailView(id) { const c=state.data.customers.find(x=>x.id===id); if(!c) return empty("Customer not found."); const related = { leads: state.data.leads.filter(x=>x.customer_id===id), quotes: state.data.quotes.filter(x=>x.customer_id===id), jobs: state.data.jobs.filter(x=>x.customer_id===id), payments: state.data.payments.filter(x=>x.customer_id===id) }; return `<section class="detail"><button data-go="/customers">← Customers</button><h1>${escapeHtml(c.name)}</h1><p>${escapeHtml(c.address||"")}</p><div class="actions"><a href="${phoneHref(c.phone)}">Call</a><a target="_blank" href="${waHref(c.whatsapp||c.phone, `Hi ${c.name}, `)}">WhatsApp</a><a target="_blank" href="${mapsHref(c.address)}">Map</a></div><h2>Customer history</h2>${historyBlock("Leads", related.leads, leadCard)}${historyBlock("Quotes", related.quotes, quoteCard)}${historyBlock("Jobs", related.jobs, jobCard)}${historyBlock("Payments", related.payments, paymentCard)}${activityFor("customer", id)}</section>`; }
function quotesView() { return header("Quotes", "+ New Quote", "quote") + `<div class="card-list">${state.data.quotes.map(quoteCard).join("") || empty("No quotes yet.")}</div>`; }
function quoteCard(q) { const c=state.data.customers.find(x=>x.id===q.customer_id); return `<article class="card"><div class="row"><h3>${escapeHtml(q.quote_number)}</h3><span class="badge">${q.status}</span></div><p>${escapeHtml(c?.name||q.customer_name||"Customer")}</p><strong>${money(q.total_amount)}</strong><div class="actions"><button data-go="/quote/${q.id}">Open</button><button data-accept-quote="${q.id}">Accept → Job</button><a target="_blank" href="${waHref(c?.whatsapp||c?.phone, templateText("Quote sent", { quote:q.quote_number, amount:money(q.total_amount) }))}">WhatsApp</a></div></article>`; }
function quoteBuilderView(id) { const q=state.data.quotes.find(x=>x.id===id) || newQuoteDraft(); const customers=state.data.customers; const items=q.quote_items?.length?q.quote_items:[{description:"",quantity:1,unit_price:0}]; const totals=quoteTotals(q, items); return `<section><button data-go="/quotes">← Quotes</button><h1>Quote builder</h1><form id="quote-form" class="form-grid"><input type="hidden" name="id" value="${q.id||""}" /><label>Customer<select name="customer_id" required>${customers.map(c=>`<option value="${c.id}" ${c.id===q.customer_id?"selected":""}>${escapeHtml(c.name)}</option>`).join("")}</select></label><label>Quote number<input name="quote_number" value="${escapeHtml(q.quote_number)}" required /></label><label>Issue date<input type="date" name="issue_date" value="${q.issue_date||today()}" /></label><label>Expiry date<input type="date" name="expiry_date" value="${q.expiry_date||today()}" /></label><label>Description<textarea name="description">${escapeHtml(q.description||"")}</textarea></label><label>Discount<input type="number" step="0.01" name="discount_amount" value="${q.discount_amount||0}" /></label><label class="check"><input type="checkbox" name="vat_enabled" ${q.vat_enabled?"checked":""}/> VAT enabled</label><label>VAT %<input type="number" step="0.01" name="vat_rate" value="${q.vat_rate ?? state.business.vat_rate ?? 15}" /></label><label>Deposit<input type="number" step="0.01" name="deposit_amount" value="${q.deposit_amount||0}" /></label><label>Notes<textarea name="notes">${escapeHtml(q.notes||"")}</textarea></label><label>Terms<textarea name="terms">${escapeHtml(q.terms||DEFAULT_TERMS)}</textarea></label><h2>Line items</h2><div id="quote-items">${items.map((it,i)=>lineItemRow(it,i)).join("")}</div><button type="button" class="secondary" id="add-line">Add line</button><aside class="quote-summary"><p>Subtotal ${money(totals.subtotal)}</p><p>VAT ${money(totals.vat)}</p><strong>Total ${money(totals.total)}</strong><p>Balance ${money(totals.balance)}</p></aside><button class="primary">Save quote</button><button type="button" class="secondary" data-pdf="${q.id||"draft"}">Download PDF</button><button type="button" class="secondary" onclick="window.print()">Print</button></form></section>`; }
function lineItemRow(it,i){return `<div class="line-row"><input name="item_description_${i}" placeholder="Work/item" value="${escapeHtml(it.description||"")}" /><input name="item_quantity_${i}" type="number" step="0.01" value="${it.quantity||1}" /><input name="item_unit_price_${i}" type="number" step="0.01" value="${it.unit_price||0}" /></div>`}
function newQuoteDraft(){return { quote_number:`Q-${new Date().getFullYear()}-${String(state.data.quotes.length+1).padStart(4,"0")}`, issue_date:today(), expiry_date:today(), vat_enabled:false, vat_rate: state.business?.vat_rate || 15, discount_amount:0, deposit_amount:0, terms:DEFAULT_TERMS, quote_items:[] };}
function jobsView(){return header("Jobs", "+ Add Job", "job") + `<div class="card-list">${state.data.jobs.map(jobCard).join("")||empty("No jobs booked.")}</div>`;}
function jobCard(j){const c=state.data.customers.find(x=>x.id===j.customer_id);return `<article class="card"><div class="row"><h3>${escapeHtml(j.description||"Job")}</h3><span class="badge">${j.status}</span></div><p>${escapeHtml(c?.name||"")} · ${dateLabel(j.job_date)} ${j.job_time||""}</p><p>${escapeHtml(j.address||"")}</p><div class="actions"><a href="${phoneHref(c?.phone)}">Call</a><a target="_blank" href="${waHref(c?.whatsapp||c?.phone, templateText("Job reminder", { date: dateLabel(j.job_date), job:j.description }))}">WhatsApp</a><a target="_blank" href="${mapsHref(j.address)}">Navigate</a><button data-complete-job="${j.id}">Complete</button></div></article>`;}
function calendarView(){const jobs=[...state.data.jobs].sort((a,b)=>(a.job_date||"").localeCompare(b.job_date||""));return `<h1>Calendar</h1><div class="segmented"><button>Upcoming</button><button>Day</button><button>Week</button></div><div class="card-list">${jobs.map(jobCard).join("")||empty("No calendar jobs.")}</div>`;}
function paymentsView(){return header("Payments", "+ Add Payment", "payment") + `<div class="card-list">${state.data.payments.map(paymentCard).join("")||empty("No payment records yet.")}</div>`;}
function paymentCard(p){const c=state.data.customers.find(x=>x.id===p.customer_id);return `<article class="card"><div class="row"><h3>${money(p.amount)}</h3><span class="badge">${p.status}</span></div><p>${escapeHtml(c?.name||"")} · Paid ${money(p.amount_paid)} · Balance ${money(p.balance)}</p>${p.payment_link?`<a target="_blank" href="${escapeHtml(p.payment_link)}">Open payment link</a>`:""}</article>`;}
function templatesView(){return `<h1>Message templates</h1><p class="muted">Edit templates. Use placeholders like {{customer}}, {{quote}}, {{amount}}, {{date}}, {{business}}.</p><div class="card-list">${state.data.templates.map(t=>`<article class="card"><form data-template="${t.id}" class="stack"><label>Name<input name="name" value="${escapeHtml(t.name)}" /></label><label>Body<textarea name="body">${escapeHtml(t.body)}</textarea></label><button>Save template</button></form></article>`).join("")}</div>`;}
function moreView(){return `<h1>More</h1><div class="menu-list"><button data-go="/jobs">Jobs</button><button data-go="/calendar">Calendar</button><button data-go="/payments">Payments</button><button data-go="/templates">Message templates</button><button data-go="/business-setup">Business profile</button><a href="${publicUrlForSlug(state.business.slug)}" target="_blank">Public page</a><button id="logout">Log out</button></div>`;}
function businessFormView(){const b=state.business||{};return `<section><h1>Business profile</h1><form id="business-form" class="form-grid"><input type="hidden" name="id" value="${b.id||""}"/><label>Name<input name="name" value="${escapeHtml(b.name||"")}" required /></label><label>Slug<input name="slug" value="${escapeHtml(b.slug||"")}" /></label><label>Phone<input name="phone" value="${escapeHtml(b.phone||"")}" /></label><label>WhatsApp<input name="whatsapp" value="${escapeHtml(b.whatsapp||"")}" /></label><label>Email<input name="email" value="${escapeHtml(b.email||"")}" /></label><label>Address<textarea name="address">${escapeHtml(b.address||"")}</textarea></label><label>Service area<input name="service_area" value="${escapeHtml(b.service_area||"")}" /></label><label>Services<textarea name="services">${escapeHtml((b.services||[]).join(", "))}</textarea></label><label>Hours<input name="hours" value="${escapeHtml(b.hours||"")}" /></label><label>Description<textarea name="description">${escapeHtml(b.description||"")}</textarea></label><label>VAT rate<input type="number" step="0.01" name="vat_rate" value="${b.vat_rate||15}" /></label><button class="primary">Save business</button></form></section>`;}
function header(title, action, modal){return `<div class="page-head"><h1>${title}</h1><button class="primary" data-modal="${modal}">${action}</button></div>`;}
function empty(msg){return `<div class="empty">${msg}</div>`;}
function errorView(msg){return `<main class="auth-page"><section class="auth-card"><h1>Something went wrong</h1><p>${escapeHtml(msg)}</p><button onclick="location.reload()">Retry</button></section></main>`;}
function historyBlock(title, rows, renderer){return `<h3>${title}</h3><div class="mini-list">${rows.map(renderer).join("")||empty(`No ${title.toLowerCase()} yet.`)}</div>`;}
function activityFor(type,id){return `<h3>Activity</h3><div class="mini-list">${(state.data.dashboard?.activity_logs||[]).filter(a=>a.entity_type===type&&a.entity_id===id).map(a=>`<p><strong>${escapeHtml(a.action)}</strong><br><small>${dateLabel(a.created_at)} ${escapeHtml(a.note||"")}</small></p>`).join("")||empty("No activity yet.")}</div>`;}
function followUpCard(f){const q=state.data.quotes.find(x=>x.id===f.quote_id); const c=state.data.customers.find(x=>x.id===f.customer_id); return `<article class="card"><div class="row"><h3>${escapeHtml(f.stage)}</h3><span class="badge">${f.result}</span></div><p>${escapeHtml(c?.name||"")} · Due ${dateLabel(f.due_date)}</p><div class="actions"><a target="_blank" href="${waHref(c?.whatsapp||c?.phone, templateText("Quote follow-up", { quote:q?.quote_number, customer:c?.name }))}">WhatsApp</a><a href="${phoneHref(c?.phone)}">Call</a><button data-complete-followup="${f.id}">Complete</button></div></article>`;}
function templateText(name, data={}){const t=state.data.templates.find(x=>x.name===name); let body=t?.body||"Hi {{customer}}, this is {{business}}."; return body.replace(/{{(\w+)}}/g,(_,k)=>data[k]||state.business?.[k]||"");}

function bindActions(){
  document.querySelectorAll("[data-go]").forEach(el=>el.addEventListener("click",()=>setRoute(el.dataset.go)));
  document.querySelectorAll("[data-modal]").forEach(el=>el.addEventListener("click",()=>openModal(el.dataset.modal)));
  document.getElementById("logout")?.addEventListener("click",async()=>{await signOut(); renderAuth();});
  document.getElementById("business-form")?.addEventListener("submit", saveBusiness);
  document.getElementById("quote-form")?.addEventListener("submit", saveQuote);
  document.getElementById("add-line")?.addEventListener("click",()=>{document.getElementById("quote-items").insertAdjacentHTML("beforeend", lineItemRow({}, document.querySelectorAll(".line-row").length));});
  document.querySelectorAll("[data-convert-lead]").forEach(b=>b.addEventListener("click",async()=>run(async()=>{await api.post(`/api/leads/${b.dataset.convertLead}/convert`); toast("Lead converted to customer."); setRoute("/customers"); await render();})));
  document.querySelectorAll("[data-create-quote]").forEach(b=>b.addEventListener("click",async()=>run(async()=>{const out=await api.post(`/api/quotes/from-lead`,{lead_id:b.dataset.createQuote}); toast("Quote created."); setRoute(`/quote/${out.id}`);}))); 
  document.querySelectorAll("[data-accept-quote]").forEach(b=>b.addEventListener("click",async()=>run(async()=>{await api.post(`/api/quotes/${b.dataset.acceptQuote}/accept`); toast("Quote accepted. Job and payment tracking created."); await render();})));
  document.querySelectorAll("[data-complete-followup]").forEach(b=>b.addEventListener("click",async()=>run(async()=>{await api.patch(`/api/follow-ups/${b.dataset.completeFollowup}`,{status:"Completed",result:"Contacted"}); toast("Follow-up completed."); await render();})));
  document.querySelectorAll("[data-complete-job]").forEach(b=>b.addEventListener("click",async()=>run(async()=>{await api.patch(`/api/jobs/${b.dataset.completeJob}`,{status:"Completed"}); toast("Job marked completed."); await render();})));
  document.querySelectorAll("[data-template]").forEach(f=>f.addEventListener("submit",async(e)=>{e.preventDefault(); await run(async()=>{await api.patch(`/api/message-templates/${f.dataset.template}`, serializeForm(f)); toast("Template saved."); await render();});}));
  document.querySelectorAll("[data-pdf]").forEach(b=>b.addEventListener("click",()=>generateQuotePdf()));
}
async function run(fn){try{await fn();}catch(err){console.error(err);toast(err.message||"Action failed. Check your connection and try again.","error");}}
async function saveBusiness(e){e.preventDefault(); await run(async()=>{const body=serializeForm(e.currentTarget); body.services=body.services?body.services.split(",").map(s=>s.trim()).filter(Boolean):[]; const saved=body.id?await api.patch(`/api/businesses/${body.id}`,body):await api.post("/api/businesses",body); toast("Business saved."); localStorage.setItem("active_business_id", saved.id); setRoute("/dashboard"); await render();});}
async function saveQuote(e){e.preventDefault(); await run(async()=>{const body=serializeForm(e.currentTarget); body.vat_enabled=!!e.currentTarget.querySelector('[name="vat_enabled"]').checked; const items=[...document.querySelectorAll(".line-row")].map((row)=>{const inputs=row.querySelectorAll("input"); return {description:inputs[0].value, quantity:Number(inputs[1].value||0), unit_price:Number(inputs[2].value||0)};}).filter(i=>i.description); const totals=quoteTotals(body,items); Object.assign(body, { subtotal:totals.subtotal, vat_amount:totals.vat, total_amount:totals.total, balance_amount:totals.balance, items, business_id:state.business.id }); const saved=body.id?await api.patch(`/api/quotes/${body.id}`,body):await api.post("/api/quotes",body); toast("Quote saved."); setRoute(`/quote/${saved.id}`); await render();});}
function openModal(type){ const forms={lead:leadForm(),customer:customerForm(),job:jobForm(),payment:paymentForm(),quote:quickQuoteForm()}; const wrap=document.createElement("div"); wrap.className="modal"; wrap.innerHTML=`<div class="modal-card"><button class="close">×</button>${forms[type]}</div>`; document.body.appendChild(wrap); wrap.querySelector(".close").onclick=()=>wrap.remove(); wrap.querySelector("form")?.addEventListener("submit",async(e)=>{e.preventDefault(); await run(async()=>{const body=serializeForm(e.currentTarget); body.business_id=state.business.id; const endpoint={lead:"leads",customer:"customers",job:"jobs",payment:"payments",quote:"quotes"}[type]; const saved=await api.post(`/api/${endpoint}`, body); toast(`${type[0].toUpperCase()+type.slice(1)} saved.`); wrap.remove(); if(type==="quote") setRoute(`/quote/${saved.id}`); await render();});});}
function leadForm(){return `<h2>Add lead</h2><form class="form-grid"><label>Customer<input name="customer_name" required></label><label>Phone<input name="phone"></label><label>WhatsApp<input name="whatsapp"></label><label>Email<input name="email"></label><label>Job type<input name="job_type"></label><label>Description<textarea name="description"></textarea></label><label>Location<input name="location"></label><label>Estimated value<input type="number" name="estimated_value"></label><label>Source<input name="source" placeholder="WhatsApp, referral, Facebook"></label><label>Notes<textarea name="notes"></textarea></label><button class="primary">Save lead</button></form>`;}
function customerForm(){return `<h2>Add customer</h2><form class="form-grid"><label>Name<input name="name" required></label><label>Phone<input name="phone"></label><label>WhatsApp<input name="whatsapp"></label><label>Email<input name="email"></label><label>Address<textarea name="address"></textarea></label><label>Notes<textarea name="notes"></textarea></label><button class="primary">Save customer</button></form>`;}
function quickQuoteForm(){return `<h2>New quote</h2><form class="form-grid"><label>Customer<select name="customer_id" required>${state.data.customers.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}</select></label><label>Description<textarea name="description"></textarea></label><button class="primary">Create quote</button></form>`;}
function jobForm(){return `<h2>Add job</h2><form class="form-grid"><label>Customer<select name="customer_id" required>${state.data.customers.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}</select></label><label>Description<textarea name="description"></textarea></label><label>Address<input name="address"></label><label>Date<input type="date" name="job_date"></label><label>Time<input type="time" name="job_time"></label><label>Responsible<input name="responsible_person"></label><button class="primary">Save job</button></form>`;}
function paymentForm(){return `<h2>Add payment</h2><form class="form-grid"><label>Customer<select name="customer_id" required>${state.data.customers.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}</select></label><label>Amount<input type="number" step="0.01" name="amount"></label><label>Amount paid<input type="number" step="0.01" name="amount_paid"></label><label>Status<select name="status"><option>Unpaid</option><option>Deposit Paid</option><option>Partially Paid</option><option>Paid</option></select></label><label>Method<input name="method"></label><label>Payment link<input name="payment_link"></label><label>Notes<textarea name="notes"></textarea></label><button class="primary">Save payment</button></form>`;}
function generateQuotePdf(){ const html=document.querySelector("section")?.innerHTML||"Quote"; const blob=new Blob([`<html><head><title>Quote</title><style>body{font-family:Arial;padding:24px;color:#111}button,.bottom-nav{display:none}.quote-summary{border:1px solid #ddd;padding:12px}</style></head><body>${html}</body></html>`],{type:"text/html"}); downloadBlob(blob, "quote-preview.html"); toast("Browser PDF ready: open the downloaded quote and print/save as PDF."); }
async function renderPublicPage(slug){ try{ const b=await api.get(`/api/public/business/${slug}`); app.innerHTML=`<main class="public-page"><section class="public-hero"><div class="brand-mark">${escapeHtml((b.name||"B").slice(0,2))}</div><h1>${escapeHtml(b.name)}</h1><p>${escapeHtml(b.description||"")}</p><div class="actions"><a class="primary" href="${waHref(b.whatsapp||b.phone,"Hi, I would like to request a quote.")}">Request quote</a><a class="secondary" href="${phoneHref(b.phone)}">Call</a></div></section><section class="card"><h2>Services</h2><p>${escapeHtml((b.services||[]).join(", "))}</p><h2>Service area</h2><p>${escapeHtml(b.service_area||"")}</p><h2>Hours</h2><p>${escapeHtml(b.hours||"")}</p></section></main>`;}catch(err){app.innerHTML=errorView("Business page not found.");}}
function registerServiceWorker(){ if("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(err=>console.warn("SW",err)); }
