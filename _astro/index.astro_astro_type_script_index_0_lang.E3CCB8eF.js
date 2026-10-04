import{a as e,c as t,d as n,f as r,n as i,o as a,s as o,t as s}from"./appointments.DzP0NE2m.js";var c=r(),l=a(),u=o(),d=u.filter(e=>e.date===c).sort((e,t)=>e.time.localeCompare(t.time));document.getElementById(`kpi-citas`).textContent=String(d.length),document.getElementById(`kpi-pendientes`).textContent=String(d.filter(e=>e.status===`Pendiente`).length);var f=u.filter(e=>e.date>c||e.date===c&&e.time>=l).sort((e,t)=>`${e.date} ${e.time}`.localeCompare(`${t.date} ${t.time}`)),p=t(c);p.setDate(p.getDate()+1);var m=`${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,`0`)}-${String(p.getDate()).padStart(2,`0`)}`;function h(e){if(e.date===c)return`Hoy · ${e.time}`;if(e.date===m)return`Mañana · ${e.time}`;let n=t(e.date).toLocaleDateString(`es-AR`,{weekday:`short`,day:`2-digit`});return`${n.charAt(0).toUpperCase()+n.slice(1)} · ${e.time}`}var g=document.getElementById(`agenda-groups`);g.innerHTML=s.map(t=>{let r=f.filter(e=>e.barber===t).slice(0,4),a=r.length===0?`<p class="agenda-free">Sin citas próximas</p>`:`<ul class="agenda-list">
                ${r.map(t=>`
                  <li class="agenda-item">
                    <span class="agenda-time">${e(h(t))}</span>
                    <span class="agenda-body">
                      <strong class="agenda-client">${e(t.client)}</strong>
                      <span class="agenda-service">${e(t.service)}</span>
                    </span>
                    <span class="pill ${n(t.status)}">${e(t.status)}</span>
                  </li>`).join(``)}
              </ul>`;return`
          <section class="barber-group" aria-label="${e(t)}">
            <h3 class="barber-group-title">
              <span class="dot" style="background: ${i[t]}"></span>
              ${e(t)}
              <span class="barber-count">${r.length}</span>
            </h3>
            ${a}
          </section>`}).join(``);var _=new Date().toLocaleDateString(`es-AR`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`});document.getElementById(`full-date`).textContent=_.charAt(0).toUpperCase()+_.slice(1);