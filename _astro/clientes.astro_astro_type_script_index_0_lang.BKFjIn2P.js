import{a as e,s as t}from"./appointments.DzP0NE2m.js";import{c as n,s as r}from"./clients.DW3BM9z2.js";var i=document.getElementById(`groups`),a=document.getElementById(`buscar`),o=e=>String(e).trim().split(/\s+/).slice(0,2).map(e=>e.charAt(0)).join(``).toUpperCase(),s=t=>`
          <li>
            <a
              class="row"
              data-banned="${t.banned?`true`:`false`}"
              href="/Webbyss/admin/cliente?id=${encodeURIComponent(t.id)}"
            >
              <span class="avatar" aria-hidden="true">${e(o(t.name))}</span>
              <span class="row-body">
                <span class="row-name">${e(t.name)}</span>
                <span class="row-phone">${e(t.phone)}</span>
              </span>
              ${t.banned?`<span class="status-chip">Baneado</span>`:`<span class="role-chip">Activo</span>`}
              <span class="chevron" aria-hidden="true">›</span>
            </a>
          </li>`;t();var c=()=>{n();let e=r(a.value);i.innerHTML=[{title:`Activos`,rows:e.filter(e=>!e.banned)},{title:`Baneados`,rows:e.filter(e=>e.banned)}].filter(e=>e.rows.length>0).map(e=>`
            <ul class="group">
              <li>
                <h2 class="group-title">${e.title}</h2>
                <ul class="rows">${e.rows.map(s).join(``)}</ul>
              </li>
            </ul>`).join(``)};a.addEventListener(`input`,c),c();