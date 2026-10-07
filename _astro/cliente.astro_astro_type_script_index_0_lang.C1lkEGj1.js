import{a as e,s as t}from"./appointments.DzP0NE2m.js";import{a as n,c as r,i,l as a,o,t as s}from"./clients.DW3BM9z2.js";var c=document.getElementById(`detail`),l=new URLSearchParams(window.location.search).get(`id`),u=e=>String(e).trim().split(/\s+/).slice(0,2).map(e=>e.charAt(0)).join(``).toUpperCase(),d=e=>{let t=new Date(e);return Number.isNaN(t.getTime())?``:t.toLocaleDateString(`es-AR`)},f=(t,n)=>`
          <li class="note">
            <span class="note-body">
              <span class="note-text">${e(n.text)}</span>
              <span class="note-date">${e(d(n.at))}</span>
            </span>
            <button
              type="button"
              class="note-remove"
              data-note-id="${e(n.id)}"
              aria-label="Borrar comentario: ${e(n.text)}"
            >✕</button>
          </li>`,p=n=>{let r=t().filter(e=>e.phone?e.phone===n.phone:e.client===n.name).sort((e,t)=>`${t.date}${t.time}`.localeCompare(`${e.date}${e.time}`));return r.length===0?`<p class="card-empty">Todavía no tiene citas.</p>`:`
          <ul class="history">
            ${r.map(t=>`
              <li class="history-row">
                <span class="history-when">${e(t.date)} · ${e(t.time)}</span>
                <span class="history-what">${e(t.service)}</span>
                <span class="status-chip">${e(t.status)}</span>
              </li>`).join(``)}
          </ul>`};t(),r();var m=n().find(e=>e.id===l);if(!m)c.innerHTML=`
          <h1 class="hero-name">No encontramos ese cliente</h1>
          <p class="fallback-text">Revisá el enlace o volvé a la lista de clientes.</p>
          <a class="back" href="/Webbyss/admin/clientes">Volver a clientes</a>`;else{let t=String(m.phone).replace(/\D/g,``),n=e(m.name),r=m.banned?`<button type="button" class="secondary-btn" id="toggle-ban">Desbanear</button>`:`<p class="ban-hint">Al banear se cancelan sus citas pendientes.</p>
             <button type="button" class="danger-btn" id="toggle-ban">Banear</button>`;c.innerHTML=`
          <header class="hero">
            <span class="avatar" aria-hidden="true">${e(u(m.name))}</span>
            <h1 class="hero-name">${n}</h1>
            <span class="hero-chips">
              <span class="role-chip">${m.banned?`Baneado`:`Activo`}</span>
            </span>
          </header>

          <div class="quick-actions">
            <a class="quick" href="tel:${e(m.phone)}" aria-label="Llamar a ${n}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></a>
            <a class="quick" href="https://wa.me/${t}" aria-label="WhatsApp con ${n}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" stroke="none" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></a>
          </div>

          <section class="card">
            <h2 class="card-title">Contacto</h2>
            <dl class="card-list">
              <div class="card-row">
                <dt>Teléfono</dt>
                <dd><a href="tel:${e(m.phone)}">${e(m.phone)}</a></dd>
              </div>
              ${m.banned&&m.bannedAt?`<div class="card-row"><dt>Baneado desde</dt><dd>${e(d(m.bannedAt))}</dd></div>`:``}
            </dl>
          </section>

          <section class="card">
            <h2 class="card-title">Comentarios</h2>
            <p class="card-hint">Sirven a cualquiera que atienda a ${n}.</p>
            ${m.notes.length===0?`<p class="card-empty">Sin comentarios todavía.</p>`:`<ul class="notes">${m.notes.map(e=>f(m,e)).join(``)}</ul>`}
            <form class="note-form" id="note-form" novalidate>
              <div class="field">
                <label for="f-note">Nuevo comentario</label>
                <input
                  id="f-note"
                  name="note"
                  type="text"
                  placeholder="Ej: no llega a tiempo"
                  autocomplete="off"
                />
                <p class="field-error" id="error-note" hidden>Ingresá un comentario.</p>
              </div>
              <button class="secondary-btn" type="submit">Agregar</button>
            </form>
          </section>

          <section class="card">
            <h2 class="card-title">Citas</h2>
            ${p(m)}
          </section>

          <div class="mutations">
            <a class="secondary-btn" href="/Webbyss/admin/nuevo-cliente?id=${encodeURIComponent(m.id)}">Editar</a>
            ${r}
          </div>`,document.getElementById(`toggle-ban`).addEventListener(`click`,()=>{m.banned?a(m.id):i(m.id),location.reload()}),document.getElementById(`note-form`).addEventListener(`submit`,e=>{e.preventDefault();let t=document.getElementById(`f-note`),n=document.getElementById(`error-note`),r=t.value.trim();if(n.hidden=r!==``,t.setAttribute(`aria-invalid`,r===``?`true`:`false`),r===``){t.focus();return}s(m.id,r),location.reload()});for(let e of c.querySelectorAll(`.note-remove`))e.addEventListener(`click`,()=>{o(m.id,e.dataset.noteId),location.reload()})}