(function(){const c=document.createElement("link").relList;if(c&&c.supports&&c.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))f(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&f(o)}).observe(document,{childList:!0,subtree:!0});function l(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function f(e){if(e.ep)return;e.ep=!0;const t=l(e);fetch(e.href,t)}})();const g="modulepreload",w=function(r){return"/"+r},p={},E=function(c,l,f){let e=Promise.resolve();if(l&&l.length>0){let o=function(s){return Promise.all(s.map(a=>Promise.resolve(a).then(u=>({status:"fulfilled",value:u}),u=>({status:"rejected",reason:u}))))};document.getElementsByTagName("link");const n=document.querySelector("meta[property=csp-nonce]"),m=(n==null?void 0:n.nonce)||(n==null?void 0:n.getAttribute("nonce"));e=o(l.map(s=>{if(s=w(s),s in p)return;p[s]=!0;const a=s.endsWith(".css"),u=a?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${s}"]${u}`))return;const i=document.createElement("link");if(i.rel=a?"stylesheet":g,a||(i.as="script"),i.crossOrigin="",i.href=s,m&&i.setAttribute("nonce",m),document.head.appendChild(i),a)return new Promise((v,y)=>{i.addEventListener("load",v),i.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${s}`)))})}))}function t(o){const n=new Event("vite:preloadError",{cancelable:!0});if(n.payload=o,window.dispatchEvent(n),!n.defaultPrevented)throw o}return e.then(o=>{for(const n of o||[])n.status==="rejected"&&t(n.reason);return c().catch(t)})},L=[{label:"SweatyGM.com",href:"https://sweatygm.com"}];function P(r){return`
    <nav class="hill-marks" aria-label="Other projects">
      <p class="hill-marks-kicker">Other Projects:</p>
      <div class="hill-marks-list">${r.map(l=>`
      <a
        class="hill-mark"
        href="${A(l.href)}"
        target="_blank"
        rel="noopener noreferrer"
      >${b(l.label)}</a>`).join("")}</div>
    </nav>`}function A(r){return r.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;")}function b(r){return r.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}const d=document.querySelector("#app");if(!(d instanceof HTMLElement))throw new Error("#app missing");d.innerHTML=`
  <div class="hill-stage">
    <div class="desert-view"></div>
    ${P(L)}
  </div>
`;const h=d.querySelector(".desert-view");h instanceof HTMLElement&&E(async()=>{const{startDesert:r}=await import("./site-5t8xJebP.js");return{startDesert:r}},[]).then(({startDesert:r})=>{r(h)});
