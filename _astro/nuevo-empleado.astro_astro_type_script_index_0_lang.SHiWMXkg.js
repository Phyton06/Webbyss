import{a as e,f as t,i as n}from"./appointments.DzP0NE2m.js";import{a as r,c as i,l as a,n as o,r as s,s as c}from"./employees.B_zwVqIX.js";var l=document.getElementById(`employee-form`),u=document.getElementById(`form-view`),d=document.getElementById(`fallback-view`),f=document.getElementById(`result-view`),p=document.getElementById(`form-title`),m=document.getElementById(`f-name`),h=document.getElementById(`f-phone`),g=document.getElementById(`f-email`),_=document.getElementById(`f-start`),v=document.getElementById(`f-schedule`),y=document.getElementById(`result-name`),b=document.getElementById(`share-url`),x=document.getElementById(`copy-url`),S=document.getElementById(`copy-status`),C=new URLSearchParams(window.location.search).get(`id`);i();var w=C?c(C):null,T=(e,t,n,r)=>{let i=document.getElementById(t);i.hidden=!r,i.textContent=n,e.setAttribute(`aria-invalid`,r?`true`:`false`)},E=document.getElementById(`role-trigger`),D=document.getElementById(`role-panel`),O=document.getElementById(`role-value`),k=()=>{D.hidden=!0,E.setAttribute(`aria-expanded`,`false`)};E.addEventListener(`click`,()=>{let e=E.getAttribute(`aria-expanded`)===`true`;E.setAttribute(`aria-expanded`,String(!e)),D.hidden=e}),D.addEventListener(`change`,e=>{let t=e.target.closest(`input[name="role"]`);t&&(O.textContent=o[t.value]||t.value,k())}),document.addEventListener(`click`,e=>{e.target instanceof Element&&!D.hidden&&!D.contains(e.target)&&!E.contains(e.target)&&k()}),document.addEventListener(`keydown`,e=>{e.key!==`Escape`||D.hidden||(k(),E.focus())});var A=e=>{let t=[...D.querySelectorAll(`input[name="role"]`)].find(t=>t.value===e);t&&(t.checked=!0,O.textContent=o[e]||e)},ee=()=>D.querySelector(`input[name="role"]:checked`)?.value||`barbero`,j=[`enero`,`febrero`,`marzo`,`abril`,`mayo`,`junio`,`julio`,`agosto`,`septiembre`,`octubre`,`noviembre`,`diciembre`],M=document.getElementById(`start-grid`),te=document.getElementById(`start-title`),N=new Date,P=N.getFullYear(),F=N.getMonth(),I=``,L=()=>{let r=(new Date(P,F,1).getDay()+6)%7,i=new Date(P,F+1,0).getDate(),a=new Date(P,F,0).getDate(),o=Math.ceil((r+i)/7)*7,s=t(),c=[];for(let t=0;t<o;t++){let o=t-r+1,l,u=!1;o<1?(l=new Date(P,F-1,a+o),u=!0):o>i?(l=new Date(P,F+1,o-i),u=!0):l=new Date(P,F,o);let d=n(l),f=`${l.getDate()} de ${j[l.getMonth()]} de ${l.getFullYear()}`;c.push(`<button type="button" class="cal-cell${u?` is-outside`:``}${d===s?` is-today`:``}${d===I?` is-selected`:``}" data-key="${d}" aria-label="${e(f)}" aria-pressed="${d===I}"${d===s?` aria-current="date"`:``}><span class="cal-day">${l.getDate()}</span></button>`)}te.textContent=`${j[F]} ${P}`,M.innerHTML=c.join(``)},R=e=>{let t=new Date(P,F+e,1);P=t.getFullYear(),F=t.getMonth(),L()};document.getElementById(`start-prev`).addEventListener(`click`,()=>R(-1)),document.getElementById(`start-next`).addEventListener(`click`,()=>R(1)),M.addEventListener(`click`,e=>{let t=e.target.closest(`.cal-cell`);t&&z(t.dataset.key)});function z(e){if(I=e||``,I){let e=new Date(`${I}T00:00:00`);P=e.getFullYear(),F=e.getMonth()}_.value=I,L()}var B=[`Lun`,`Mar`,`Mié`,`Jue`,`Vie`,`Sáb`,`Dom`],V=Array.from({length:13},(e,t)=>t+8),H=document.getElementById(`schedule-blocks`),U=document.getElementById(`add-schedule`),W=e=>e==null?`—`:`${e} h`,G=()=>({days:new Set,from:null,to:null}),K=[G()],ne=e=>{if(!e.days.size||e.from==null||e.to==null)return``;let t=[...e.days].sort((e,t)=>e-t),n=[],r=t[0],i=t[0];for(let e=1;e<=t.length;e++){let a=t[e];if(a===i+1){i=a;continue}n.push([r,i]),r=a,i=a}return`${n.map(([e,t])=>e===t?B[e]:t-e>=2?`${B[e]} a ${B[t]}`:`${B[e]}, ${B[t]}`).join(`, `)} · ${e.from}–${e.to} h`},q=()=>K.map(ne).filter(Boolean).join(`; `),J=e=>e.trim().toLowerCase().normalize(`NFD`).replace(/[\u0300-\u036f]/g,``);function re(e,t){let[n=``,r=``]=e.split(`·`),i=B.map(J),a=e=>i.indexOf(J(e)),o=n.trim().match(/^\s*(\S+)\s+a\s+(\S+)\s*$/i);if(o){let e=a(o[1]),n=a(o[2]);if(e>=0&&n>=0){let r=e;for(let e=0;e<7&&(t.days.add(r),r!==n);e++)r=(r+1)%7}}else for(let e of n.split(`,`)){let n=a(e);n>=0&&t.days.add(n)}let s=r.replace(/h\s*$/i,``).match(/(\d{1,2})(?::\d{2})?\s*[–-]\s*(\d{1,2})(?::\d{2})?/);s&&(t.from=Number(s[1]),t.to=Number(s[2]))}function Y(e){let t=String(e||``).split(`;`).map(e=>e.trim()).filter(Boolean);K=t.length?t.map(e=>{let t=G();return re(e,t),t}):[G()]}var X=V[V.length-1],ie=(e,t,n)=>e===`to`?t<=n.from:t>=X,Z=(e,t,n,r)=>`
        <div class="filter sched-time">
          <button
            type="button"
            class="filter-trigger"
            data-hour-trigger="${e}:${t}"
            aria-expanded="false"
            aria-controls="hour-panel-${e}-${t}"
          >
            <span class="filter-name">${n}</span>
            <span class="filter-value" data-hour-value="${e}:${t}">${W(r)}</span>
            <span class="filter-caret" aria-hidden="true">▾</span>
          </button>
          <div
            class="filter-panel sched-hours"
            id="hour-panel-${e}-${t}"
            role="group"
            aria-label="${n} — horario ${e+1}"
            hidden
          >
            ${V.map(n=>{let i=ie(t,n,K[e]);return`
                <button
                  type="button"
                  class="time-chip${n===r?` is-selected`:``}${i?` is-disabled`:``}"
                  data-hour="${e}:${t}:${n}"
                  aria-pressed="${n===r}"
                  ${i?`disabled`:``}
                >${n}</button>`}).join(``)}
          </div>
        </div>`,ae=(e,t)=>`
        <div class="sched-block" data-block="${t}">
          <div class="sched-head">
            <p class="pick-label">Horario ${t+1}</p>
            ${K.length>1?`<button type="button" class="sched-remove" data-remove="${t}" aria-label="Quitar horario ${t+1}">✕</button>`:``}
          </div>
          <div class="day-row" role="group" aria-label="Días del horario ${t+1}">
            ${B.map((n,r)=>`
                <button
                  type="button"
                  class="day-chip${e.days.has(r)?` is-selected`:``}"
                  data-day="${t}:${r}"
                  aria-pressed="${e.days.has(r)}"
                >${n}</button>`).join(``)}
          </div>
          <div class="sched-times">
            ${Z(t,`from`,`Desde`,e.from)}
            ${Z(t,`to`,`Hasta`,e.to)}
          </div>
        </div>`;function Q(){K.forEach(e=>{e.from>=X&&(e.from=X-1),e.to<=e.from&&(e.to=e.from+1)}),H.innerHTML=K.map(ae).join(``),v.value=q()}var $=()=>{H.querySelectorAll(`[data-hour-trigger]`).forEach(e=>{e.setAttribute(`aria-expanded`,`false`),document.getElementById(e.getAttribute(`aria-controls`))?.setAttribute(`hidden`,``)})};if(H.addEventListener(`click`,e=>{let t=e.target.closest(`[data-remove]`);if(t){K.splice(Number(t.dataset.remove),1),Q();return}let n=e.target.closest(`[data-hour-trigger]`);if(n){let e=n.getAttribute(`aria-expanded`)===`true`;$(),e||(n.setAttribute(`aria-expanded`,`true`),document.getElementById(n.getAttribute(`aria-controls`))?.removeAttribute(`hidden`));return}let r=e.target.closest(`.day-chip`);if(r){let[e,t]=r.dataset.day.split(`:`).map(Number),n=K[e].days;n.has(t)?n.delete(t):n.add(t);let i=n.has(t);r.classList.toggle(`is-selected`,i),r.setAttribute(`aria-pressed`,String(i)),v.value=q();return}let i=e.target.closest(`[data-hour]`);if(i){let[e,t,n]=i.dataset.hour.split(`:`);K[Number(e)][t]=Number(n),Q(),document.querySelector(`[data-hour-trigger="${e}:${t}"]`)?.focus()}}),U.addEventListener(`click`,()=>{K.push(G()),Q(),H.lastElementChild?.querySelector(`.day-chip`)?.focus()}),document.addEventListener(`click`,e=>{e.target.closest(`.sched-time`)||$()}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&$()}),C&&!w)u.hidden=!0,d.hidden=!1;else{if(w)p.textContent=`Editar empleado`,m.value=w.name,h.value=w.phone,g.value=w.email||``,A(w.role||`barbero`),z(w.startDate||t()),Y(w.schedule||``);else{A(`barbero`),z(t()),Y(``);for(let e of[`field-email`,`field-start`,`field-schedule`])document.getElementById(e).hidden=!0}Q(),l.addEventListener(`submit`,e=>{e.preventDefault();let t={name:m.value.trim(),phone:h.value.trim(),email:g.value.trim(),role:ee(),startDate:_.value,schedule:q()};if(T(m,`error-name`,`Ingresá el nombre.`,!t.name),T(h,`error-phone`,`Ingresá el teléfono.`,!t.phone),!t.name){m.focus();return}if(!t.phone){h.focus();return}if(w){a(w.id,t),location.href=`/Webbyss/admin/empleado?id=${encodeURIComponent(w.id)}`;return}let n=r({name:t.name,phone:t.phone,role:t.role}),i=`/Webbyss/registro?nombre=${encodeURIComponent(n.name)}&tel=${encodeURIComponent(n.phone)}&rol=${encodeURIComponent(s[n.role]||n.role)}&empleado=${encodeURIComponent(n.id)}`;u.hidden=!0,f.hidden=!1,y.textContent=n.name,b.value=i,window.scrollTo(0,0)}),x.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(b.value),S.textContent=`Link copiado`}catch{b.focus(),b.select(),S.textContent=`Link seleccionado, copiá con Ctrl+C`}S.hidden=!1})}