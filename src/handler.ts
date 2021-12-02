import { Declaration, CustomElementDeclaration, CustomElement, Package, ClassDeclaration, ClassField, ClassMethod } from '../node_modules/custom-elements-manifest/schema.d.js';


export interface EnhancedClassField extends ClassField{
  val: any;
}
const headers =  {
  "content-type": "text/html;charset=UTF-8",
  'Access-Control-Allow-Origin': '*',
};

export async function handleRequest(request: Request): Promise<Response> {
  const url = request.url;
  const href = unescape(substr_between(url, 'href=', '&'));
  if(href === '') return new Response(html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
        <button type="submit">Submit</button>
      </form>
    </body>
  </html>
  `, {headers});
  const resp = await fetch(href);
  const json = await resp.json();
  const processed = getTagNameToDeclaration(json);
  let declarations = processed!.declarations;
  const tags = substr_between(url, 'tags=', '&');
  if(tags){
    declarations = declarations.filter(d => tags.split(',').includes((<any>d).tagName));
  }
  const embedded = substr_between(url, 'embedded=', '&');
  const stylesheet = unescape(substr_between(url, 'stylesheet=', '&')) || 'https://unpkg.com/wc-info/simple-ce-style.css';
  if(embedded === 'true'){
    return new Response(html`
        ${declarations.map(declaration => html`
          <h1>${(<any>declaration).tagName}</h1>
          ${tablify((<any>declaration).members.filter((x: any) => (x.kind === 'field') && (x.privacy !== 'private')) , 'Properties', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/ClassField', ['kind'])}
          ${tablify((<any>declaration).attributes, 'Attributes', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Attribute')}
          ${tablify((<any>declaration).cssProperties, 'CSS Properties', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/CssCustomProperty')}
          ${tablify((<any>declaration).cssParts, 'CSS Parts', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/CssPart')}
          ${tablify((<any>declaration).slots, 'Slots', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Slot')}
          ${tablify((<any>declaration).events, 'Events', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Event')}
          ${tablify((<any>declaration).members.filter((x: any) => (x.kind === 'method') && (x.privacy !== 'private')) , 'Methods', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Method', ['kind'])}
      `).join('')}
    `, {
    headers
  });
  }else{
    return new Response(html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WC Info</title>
      <link rel="preload" href="${stylesheet}" as="style" onload="this.onload=null;this.rel='stylesheet'">
      <noscript><link rel="stylesheet" href="${stylesheet}"></noscript>
    </head>
    <body>

    
    ${declarations.map(declaration => html`
        <h1>${(<any>declaration).tagName}</h1>
        ${tablify((<any>declaration).members.filter((x: any) => (x.kind === 'field') && (x.privacy !== 'private')) , 'Properties', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/ClassField', ['kind'])}
        ${tablify((<any>declaration).attributes, 'Attributes', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Attribute')}
        ${tablify((<any>declaration).cssProperties, 'CSS Properties', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/CssCustomProperty')}
        ${tablify((<any>declaration).cssParts, 'CSS Parts', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/CssPart')}
        ${tablify((<any>declaration).slots, 'Slots', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Slot')}
        ${tablify((<any>declaration).events, 'Events', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Event')}
        ${tablify((<any>declaration).members.filter((x: any) => (x.kind === 'method') && (x.privacy !== 'private')) , 'Methods', 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json#definitions/Method', ['kind'])}
    `).join('')}
    <xtal-editor read-only key=package>
    <textarea slot=initVal>
    ${JSON.stringify(json)}
    </textarea>
    </xtal-editor>
    <script type=module>
      import 'https://cdn.skypack.dev/xtal-editor';
    </script>
    <script type=module>
      import 'https://cdn.skypack.dev/wc-info/enhancements.js'
    </script>
    </body>
    </html>
  `, {
    headers
  })
  }
  
}



function tablify(obj: any[], name: string, itemType: string, exclude: string[] = []): string{
  if(obj === undefined || obj.length === 0) return '';
  const compactedName = name.replaceAll(' ', '-').toLowerCase();
  const keys = getKeys(obj).filter(x => !exclude.includes(x));
  const header = keys.map(x => html`<th part="${compactedName}-${x}-header" class="${x}">${x}</th>`).join('');
  const rows = obj.map(x => html`<tr itemscope itemtype="${itemType}">${keys.map(key => displayCell(key, x, compactedName)).join('')}</tr>`).join('');
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

function displayCell(key: string, x: any, compactedName: string){
  const val = x[key];
  const attrs =  `itemprop="${key}" part="cell ${compactedName}-${key}-cell" class="${key}"`;
  if(val === undefined) return html`<td part="cell ${compactedName}-${key}-cell" class="${key}"> - </td>`;
  if(typeof(val) === 'object'){
    if(Array.isArray(val) && key){
      return html`<td ${attrs}>${tablify(val, key, 'https://unpkg.com/custom-elements-manifest@1.0.0/schema.json')}</td>`;
    }else{
      return html`<td ${attrs} data-is-json>${JSON.stringify(val)}</td>`;
    }
    
  }else{
    return html`<td ${attrs}>${sanitize(val)}</td>`
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

function html(strings: TemplateStringsArray, ...keys: string[]) {
  const out: string[]  = [];
  for (let i = 0, ii = strings.length; i < ii; i++) {
      out.push(strings[i]);
      // if we have a variables for it, we need to bind it.
      const ithKey = keys[i];
      if (ithKey !== undefined) {
        out.push(ithKey);
      }
    }
  return out.join('');
}

function getTagNameToDeclaration(fetchResult: any){
  const tagNameToDeclaration: {[key: string]: CustomElementDeclaration} = {};
  const pack = fetchResult as Package;
  if(pack === undefined) return;
  const mods = pack.modules;
  if(mods === undefined) tagNameToDeclaration;
  
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

function substr_between(str: string, start: string, end: string): string {
  const start_pos = str.indexOf(start);
  if(start_pos === -1) return '';
  const iPos = str.indexOf(end, start_pos + start.length);
  return iPos === -1 ? str.substring(start_pos + start.length) :  str.substring(start_pos + start.length, iPos);
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