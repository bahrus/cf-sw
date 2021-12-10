import { Declaration, CustomElementDeclaration, CustomElement, Package, ClassDeclaration, ClassField, ClassMethod, Module } from '../node_modules/custom-elements-manifest/schema.d.js';
import { substrBetween } from './substrBetween';
import {html} from './html';
declare const MY_KV: any;

export interface EnhancedClassField extends ClassField{
  val: any;
}
const headers =  {
  "content-type": "text/html;charset=UTF-8",
  'Access-Control-Allow-Origin': '*',
};

export async function handleRequest(request: Request): Promise<Response> {
  const mobile = request.headers.get('Sec-ch-ua-mobile') === '?1';
  console.log('mobile = ' + mobile);
  const url = request.url;
  const href = unescape(substrBetween(url, 'href=', '&'));
  const ts = unescape(substrBetween(url, 'ts=', '&'));
  if(href === '') return new Response(html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="ts" content="${new Date().toISOString()}">
      <title>WC Info Usage</title>
      <!-- Compiled and minified CSS -->
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">

      <!-- Compiled and minified JavaScript -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
    </head>
    <body>
      <h1>WC Info Usage</h1>
      <form style="display:flex;flex-direction:column">
        <label for="href">href</label>
        <input type="text" id="href" size=100 name="href" value="https://cdn.skypack.dev/@shoelace-style/shoelace/dist/custom-elements.json">
        <label for="stylesheet">stylesheet</label>
        <input type="text" id="stylesheet" size=100 name="stylesheet" value="https://unpkg.com/wc-info/simple-ce-style.css">
        <label for="embedded">embedded</label>
        <input type="text" id="embedded" name="embedded" value="false">
        <label for="tags">tags</label>
        <input type="text" id="tags" name="tags">
        <label for="ts">Timestamp</label>
        <input type="text" id="ts" name="ts" value="${new Date().toISOString()}">
        <label for="tocXSLT">tocXSLT</label>
        <input type="text" id="tocXSLT" name="tocXSLT" value="https://unpkg.com/wc-info/toc.xsl">
        <button type="submit">Submit</button>
      </form>
    </body>
  </html>
  `, {headers});
  let json: {package: Package, modules: Module[]} | undefined;
  if(ts){
    const text = await MY_KV.get(ts);
    if(text){
      console.log('parsing from cache');
      json = JSON.parse(text);
    }
  }
  if(!json){
    console.log('fetching', href);
    const resp = await fetch(href);
    const text = await resp.text();
    if(ts){
      await MY_KV.put(ts, text);
    }
    
    json = JSON.parse(text);
  }
  const processed = getTagNameToDeclaration(json);
  let declarations = processed?.declarations || [];

  const tags = substrBetween(url, 'tags=', '&');
  if(tags){
    declarations = declarations.filter(d => tags.split(',').includes((<any>d).tagName));
  }
  const embedded = substrBetween(url, 'embedded=', '&');
  const stylesheet = unescape(substrBetween(url, 'stylesheet=', '&')) || 'https://unpkg.com/wc-info/simple-ce-style.css';
  if(embedded === 'true'){
    return new Response(html`
        ${declarations.map(declaration => html`
          <h1 id="${(<any>declaration).tagName}">${(<any>declaration).tagName}</h1>
          ${tablify((<any>declaration).members.filter((x: any) => (x.kind === 'field') && (x.privacy !== 'private')) , 'Properties', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/ClassField', mobile, ['kind'])}
          ${tablify((<any>declaration).attributes, 'Attributes', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Attribute', mobile)}
          ${tablify((<any>declaration).cssProperties, 'CSS Properties', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/CssCustomProperty', false)}
          ${tablify((<any>declaration).cssParts, 'CSS Parts', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/CssPart', false)}
          ${tablify((<any>declaration).slots, 'Slots', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Slot', false)}
          ${tablify((<any>declaration).events, 'Events', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Event', false)}
          ${tablify((<any>declaration).members.filter((x: any) => (x.kind === 'method') && (x.privacy !== 'private')) , 'Methods', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Method', mobile, ['kind'])}
      `).join('')}
    `, {
    headers
  });
  }else{
    const tocXSLT = unescape(substrBetween(url, 'tocXSLT=', '&')) || 'https://unpkg.com/wc-info/toc.xsl';
    console.log('generating response');
    return new Response(html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="ts" content="${new Date().toISOString()}">
      <title>WC Info</title>
      <style>
        section{
          content-visibility: auto;
          contain-intrinsic-size: 0 500px;
        }
      </style>
      <link rel="preload" href="${stylesheet}" as="style" onload="this.onload=null;this.rel='stylesheet'">
      <noscript><link rel="stylesheet" href="${stylesheet}"></noscript>
    </head>
    <body>
    <header class="package-header" part="package-header" itemscope itemtype="https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Reference">
      <xtal-side-nav></xtal-side-nav>
      <h1 itemprop="name" class="package" part="package-title">${(<any>json?.package)?.name}</h1>
    </header>
    <main be-metamorphic='{
      "${tocXSLT}": {
        "target": "xtal-side-nav",
        "whenDefined": [],
        "mode": "append"
      }
    }'>
    ${declarations.map(declaration => html`
      <section itemscope id="${(<any>declaration).tagName}">
        <hgroup>
          <h1 itemprop="tagName" >${(<any>declaration).tagName}</h1>
          <h2 itemprop="description">${declaration.description || ''}</h2>
          <h3 itemprop="summary">${declaration.summary || ''}</h3>
        </hgroup>
        ${!(<any>declaration)?.members ? ''  : tablify((<any>declaration).members.filter((x: any) => (x.kind === 'field') && (x.privacy !== 'private')) , 'Properties', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/ClassField', mobile, ['kind'])}
        ${tablify((<any>declaration).attributes, 'Attributes', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Attribute', mobile)}
        ${tablify((<any>declaration).cssProperties, 'CSS Properties', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/CssCustomProperty', false)}
        ${tablify((<any>declaration).cssParts, 'CSS Parts', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/CssPart', false)}
        ${tablify((<any>declaration).slots, 'Slots', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Slot', false)}
        ${tablify((<any>declaration).events, 'Events', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Event', false)}
        ${!(<any>declaration)?.members ? ''  : tablify((<any>declaration).members.filter((x: any) => (x.kind === 'method') && (x.privacy !== 'private')) , 'Methods', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Method', mobile ,['kind'])}
      </section>
    `).join('')}
    <xtal-editor read-only key=package>
    <textarea slot=initVal>
    ${JSON.stringify(json)}
    </textarea>
    </xtal-editor>
    </main>
    <script type=module>
      import 'https://cdn.skypack.dev/xtal-editor';
    </script>
    <script type=module>
      import 'https://cdn.skypack.dev/xtal-side-nav';
      import 'https://cdn.skypack.dev/be-metamorphic';
    </script>
    </body>
    </html>
  `, {
    headers
  })
  }
  
}



function tablify(obj: any[], name: string, itemType: string, separateLineForDescription: boolean, exclude: string[] = []): string{
  console.log('tablifying ' + name);
  if(obj === undefined || obj.length === 0) return '';
  const compactedName = name.replaceAll(' ', '-').toLowerCase();
  const keys = getKeys(obj).filter(x => !exclude.includes(x));
  let header: string | undefined;
  let rows: string | undefined;
  if(separateLineForDescription){
    header = keys.filter(x => x !== 'description').map(x => html`<th part="${compactedName}-${x}-header" class="${x}">${x}</th>`).join('');
    const rowsArr: string[] = [];
    for(const item of obj){
      const row1 = html`<tr itemscope itemtype="${itemType}">${keys.filter(x => x !== 'description').map(key => displayCell(key, item, compactedName)).join('')}</tr>`;
      const row2 = html`<tr itemscope itemtype="${itemType}">${displayCell('description', item, compactedName, `colspan="${keys.length - 1}"`)}</tr>`;
      rowsArr.push(row1 + row2);
    }
    rows = rowsArr.join('');
  }else{
    header = keys.map(x => html`<th part="${compactedName}-${x}-header" class="${x}">${x}</th>`).join('');
    rows = obj.map(x => html`<tr itemscope itemtype="${itemType}">${keys.map(key => displayCell(key, x, compactedName)).join('')}</tr>`).join('');
  }
  return html`
  <table  part="table table-${compactedName}" class=${compactedName}>
    <caption class="title">${name}</caption>
    <thead >
      <tr>
    ${header}
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

function sanitize(str: string): string{
  if(!str) return '';
  if(typeof str !== 'string') return str;
  return str.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function displayCell(key: string, x: any, compactedName: string, colspan = ''){
  const val = x[key];
  const attrs =  `${colspan} itemprop="${key}" part="cell ${compactedName}-${key}-cell" class="${key}"`;
  const descriptionTitle = (key === 'description' && colspan !== '') ? '<strong>Description: </strong>' : '';

  if(val === undefined) return html`<td ${attrs}> - </td>`;
  if(typeof(val) === 'object'){
    if(Array.isArray(val) && key){
      return html`<td ${attrs}>${tablify(val, key, 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json', false)}</td>`;
    }else{
      return html`<td ${attrs} data-is-json>
        <details>
          <summary></summary>
          ${JSON.stringify(val, null, 2)}
        </details>
      </td>`;
    }
    
  }else{
    return html`<td ${attrs}>${descriptionTitle}${sanitize(val)}</td>`
  }
}

function getKeys(obj: any[]){
  const keyCounts: {[key: string]: number} = {};
  for(const item of obj){
    for(const key of Object.keys(item)){
      if(keyCounts[key] === undefined) keyCounts[key] = 0;
      keyCounts[key]++;
    }
  }
  if(keyCounts['name'] !== undefined){
    keyCounts['name']++;
  }
  return Object.keys(keyCounts).sort((a,b) => keyCounts[b] - keyCounts[a]);

}

function getTagNameToDeclaration(fetchResult: any){
  const tagNameToDeclaration: {[key: string]: CustomElementDeclaration} = {};
  const pack = fetchResult as Package;
  if(pack === undefined) return;
  const mods = pack.modules;
  if(mods === undefined) return;
  console.log(typeof mods);
  for(const mod of mods){
      const declarations = mod.declarations;
      if(declarations === undefined) continue;
      const tagDeclarations = declarations.filter(x => (x as CustomElement).tagName !== undefined);
      
      for(const declaration of tagDeclarations){
          const ce = declaration as CustomElementDeclaration;
          
          const tagName = (declaration as CustomElement).tagName!;
          
          
          if(tagName === undefined) continue;
          if(tagNameToDeclaration[tagName] !== undefined){
              if(countTypes(declaration) >  countTypes(tagNameToDeclaration[tagName] as Declaration)){
                  tagNameToDeclaration[tagName] = ce;
              }
          }else{
              tagNameToDeclaration[tagName] = ce;
          }
          (<any>ce).unevaluatedNonStaticPublicFields = getUnevaluatedNonStaticPublicFieldsFromDeclaration(ce);
          (<any>ce).methods = getMethodsFromDeclaration(ce);
      }

  }
  const declarations = Object.values(tagNameToDeclaration) as Declaration[];
  return {tagNameToDeclaration, declarations};  
}

function getFields(tagNameToDeclaration:  {[key: string]: CustomElementDeclaration}, tag: string){
  const ce = tagNameToDeclaration[tag!] as CustomElementDeclaration;
  const customElement = ce as unknown as CustomElement;
  if(ce === undefined || ce.members === undefined) return;
  const unevaluatedFields = getUnevaluatedNonStaticPublicFieldsFromDeclaration(ce);

  const fields = unevaluatedFields.map(field => {
      if(field.default !== undefined){
          let val = field.default;
          if(field.type !== undefined && field.type.text !== undefined){
              switch(field.type.text){
                  case 'boolean':
                  case 'number':
                      val = JSON.parse(val);
                      break;
                  case 'string':
                  case 'object':
                      try{
                          val = eval('(' + val + ')'); //yikes
                      }catch(e){
                        console.warn('Could not parse ' + val)
                      }
                      
                      break;
              }
          }
          return {
              ...field,
              val: val,
          };
      }else{
          return {
              ...field
          } as unknown as EnhancedClassField;
      }            
  });
  return {fields, customElement};
}

function getUnevaluatedNonStaticPublicFieldsFromDeclaration(ce: CustomElementDeclaration){
  if(ce === undefined || ce.members === undefined) return [];
  return ce.members.filter(x=> x.kind ==='field' && !x.static && !(x.privacy==='private')) as ClassField[];
}

function getMethodsFromDeclaration(ce: CustomElementDeclaration): ClassMethod[]{
  if(ce === undefined || ce.members === undefined) return [];
  return ce.members.filter(x => x.kind === 'method') as ClassMethod[];
}



function countTypes(declaration: Declaration){
  let count = 0;
  if(declaration.kind !== 'class') return count;
  const classDeclaration = declaration as ClassDeclaration;
  if(classDeclaration.members === undefined) return count;
  for(const member of classDeclaration.members){
      const classField = member as ClassField;
      if(classField.type !== undefined) count++;
  }
  return count;
}