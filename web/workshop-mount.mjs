import { mountWorkshopController } from './workshop.mjs';

/** Mount the actual published Workshop inside a native, isolated surface.
 * onAction returns true when the host has handled an action; false continues
 * the Workshop action. onChange receives the complete portable save envelope.
 */
export async function mountWorkshop(root, options = {}) {
  const base = new URL(options.dataBaseUrl ?? './', import.meta.url);
  const scope = root instanceof ShadowRoot ? root : (root.shadowRoot ?? root.attachShadow({mode:'open'}));
  const styles = ['workshop.css','forge.css','sheet-compact.css','creator-compact.css','roll-ui.css'];
  const css = options.styles === false ? '' : (await Promise.all(styles.map(async name=>{
    const url = new URL(name,base);
    const response=await fetch(url);
    if(!response.ok) throw new Error(`Could not load Workshop style ${name}.`);
    return (await response.text()).replace(/^:root\s*\{/gm,':host {').replace(/^body\s*\{/gm,'.workshop-surface {')
      .replace(/\b(Cinzel|Garamond)\b(?!\.)/g,'"HOL $1"')
      .replace(/([\d.]+)rem\b/g,(_,value)=>`${Number(value)*14}px`)
      .replace(/url\(["']?([^)'"\s]+)["']?\)/g,(_,path)=>`url("${new URL(path,url)}")`);
  }))).join('\n');
  scope.innerHTML=`<style>${css}
    :host{display:block;height:100%;min-height:0;font-size:14px}
    .workshop-surface{height:100%;overflow:auto}
    #app{height:100%;min-height:0;min-width:520px;width:calc(100% - 48px);margin:0 6px 0 42px}
    .hero-mark[role=button]{cursor:pointer}
    .attribute-effect{display:block;font-size:10px;font-style:normal;line-height:1.1}
  </style><div class="workshop-surface"><main id="app" aria-busy="true"></main><div id="notice" role="status" aria-live="polite"></div><dialog id="picker" aria-labelledby="picker-title"></dialog><dialog id="reference" aria-labelledby="reference-title"></dialog><input type="file" id="import-file" accept=".json,application/json" hidden></div>`;
  const lifetime=new AbortController();
  const capturedKeys = new Set();
  // Foundry sees the shadow host instead of the focused input. Contain the
  // keystroke after local handlers run, while retaining native text and control defaults.
  scope.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !scope.querySelector('dialog[open]')) return;
    capturedKeys.add(event.code);
    event.stopPropagation();
  }, { signal: lifetime.signal });
  scope.addEventListener('keyup', event => {
    if (capturedKeys.delete(event.code)) event.stopPropagation();
  }, { signal: lifetime.signal });
  const fixAssets=()=>scope.querySelectorAll('[src^="assets/"]').forEach(node=>node.setAttribute('src',new URL(node.getAttribute('src'),base).href));
  const assets=new MutationObserver(fixAssets);
  assets.observe(scope,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
  try {
    const controller=await mountWorkshopController(scope,{...options,host:options.host ?? {},dataBaseUrl:base});
    fixAssets();
    return {...controller,root:scope,dispose(){lifetime.abort();assets.disconnect();controller.dispose();scope.replaceChildren();}};
  } catch(error) {lifetime.abort();assets.disconnect();throw error;}
}
