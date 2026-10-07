import{a as e}from"./appointments.DzP0NE2m.js";import{c as t,i as n,n as r,r as i,t as a}from"./employees.B_zwVqIX.js";var o=document.getElementById(`groups`),s=document.getElementById(`buscar`),c=e=>String(e).trim().split(/\s+/).slice(0,2).map(e=>e.charAt(0)).join(``).toUpperCase(),l=t=>{let r=n[t.role]||n.barbero,a=t.status===`Baja`?`<span class="status-chip">Baja</span>`:``;return`
          <li>
            <a class="row" href="/Webbyss/admin/empleado?id=${encodeURIComponent(t.id)}">
              <span class="avatar" style="background:${r}" aria-hidden="true">${e(c(t.name))}</span>
              <span class="row-body">
                <span class="row-name">${e(t.name)}</span>
                <span class="row-phone">${e(t.phone)}</span>
              </span>
              <span class="role-chip">${e(i[t.role]||t.role)}</span>
              ${a}
              <span class="chevron" aria-hidden="true">›</span>
            </a>
          </li>`},u=()=>{let e=s.value.trim().toLowerCase(),n=t().filter(t=>e===``||String(t.name).toLowerCase().includes(e)||String(t.phone).toLowerCase().includes(e));o.innerHTML=a.map(e=>{let t=n.filter(t=>t.role===e);return t.length===0?``:`
            <ul class="group">
              <li>
                <h2 class="group-title">${r[e]}</h2>
                <ul class="rows">${t.map(l).join(``)}</ul>
              </li>
            </ul>`}).join(``)};s.addEventListener(`input`,u),u();