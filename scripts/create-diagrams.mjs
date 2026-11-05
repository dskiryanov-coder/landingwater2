import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('dist/assets', { recursive: true });
const head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 260" fill="none"><g stroke-linecap="round" stroke-linejoin="round">';
const tail = '</g></svg>';
function tank(x, y, w, h, color = '#c9dfe7', pattern = '') {
  return `<path d="M${x+w/2} ${y-24}V${y-12}" stroke="#193d4b" stroke-width="5"/><rect x="${x+w/2-18}" y="${y-22}" width="36" height="22" rx="3" fill="#214553"/><rect x="${x+w/2-11}" y="${y-17}" width="15" height="7" rx="1" fill="#90b9c9"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w/2}" fill="${color}" stroke="#729aa9" stroke-width="2"/><path d="M${x+8} ${y+h-12}h${w-16}" stroke="#729aa9" stroke-width="2"/>${pattern}`;
}
const dots = (x,y,rows,color) => Array.from({length:rows},(_,r)=>Array.from({length:4},(_,c)=>`<circle cx="${x+c*10+(r%2)*3}" cy="${y+r*11}" r="2" fill="${color}"/>`).join('')).join('');
const pipe = '<path d="M30 70h180M30 62v16m180-16v16" stroke="#789daa" stroke-width="5"/>';
const art = {
  uv: '<path d="M30 128h180M35 116v24m170-24v24" stroke="#729aa9" stroke-width="5"/><rect x="44" y="106" width="150" height="44" rx="22" fill="#d7e7ed" stroke="#729aa9" stroke-width="2"/><path d="M55 128h127" stroke="#0078a6" stroke-width="4"/><path d="M103 105V65h28v40m-14-40V43h18" stroke="#214553" stroke-width="3"/><rect x="104" y="162" width="32" height="29" rx="3" fill="#214553"/><path d="M120 150v12M110 177h20" stroke="#90b9c9" stroke-width="2"/>',
  clarification: pipe + tank(81,82,78,153,'#d5e6eb',dots(102,160,5,'#8cafb8')),
  sorption: pipe + tank(81,82,78,153,'#d0e2e9',dots(102,148,6,'#436775')),
  iron: pipe + tank(81,82,78,153,'#d7e7ed',dots(102,160,5,'#a79078')),
  softening: '<path d="M31 70h126M31 62v16" stroke="#789daa" stroke-width="5"/>' + tank(47,82,70,153) + '<rect x="145" y="148" width="63" height="85" rx="5" fill="#e4edf0" stroke="#729aa9" stroke-width="2"/><rect x="141" y="142" width="71" height="10" rx="3" fill="#8ba7b2"/><path d="M105 84h22v67h20" stroke="#729aa9" stroke-width="3"/>' + dots(160,184,3,'#afc5ce'),
  complex: '<path d="M16 66h181M16 58v16" stroke="#789daa" stroke-width="4"/>' + tank(29,82,52,151) + tank(102,82,52,151,'#dce9ee') + '<path d="M81 90h21m51 0h26v68" stroke="#729aa9" stroke-width="3"/><rect x="174" y="166" width="49" height="67" rx="4" fill="#e4edf0" stroke="#729aa9" stroke-width="2"/><rect x="171" y="160" width="55" height="9" rx="2" fill="#8ba7b2"/>'
};
for (const [name, svg] of Object.entries(art)) await writeFile(`dist/assets/${name}.svg`, head + svg + tail);
console.log('Created 6 technical diagrams.');
