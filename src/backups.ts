import {validateRule,type Rule} from './core';
import type {AppEnv} from './meta';

export function exportRules(rows:Rule[]){
 return {format:'directcash-backup',version:1,created:new Date().toISOString(),rules:rows.map(r=>({name:r.name,trigger:r.trigger,media_id:r.media_id,keywords:r.keywords,message:r.message,link:r.link,public_reply:r.public_reply,active:!!r.active,flow:r.flow||'{}'}))};
}
export function decodeBackup(data:any){
 if(data?.format!=='directcash-backup'||data.version!==1||!Array.isArray(data.rules)||!data.rules.length||data.rules.length>30)throw Error('Use um backup DirectCA$H com até 30 fluxos e automações.');
 return data.rules.map((r:any)=>{if(!r||typeof r!=='object')throw Error('Automação inválida no backup.');return validateRule({...r,active:false});});
}
export async function restoreRules(env:AppEnv,data:unknown){
 const rows=decodeBackup(data),count=await env.DB.prepare('SELECT count(*) n FROM rules').first<{n:number}>();
 if((count?.n||0)+rows.length>30)throw Error('O backup ultrapassa o limite de 30 automações do perfil. Libere espaço antes de importar.');
 const created=Math.floor(Date.now()/1000);
 await env.DB.batch(rows.map((r:ReturnType<typeof validateRule>)=>env.DB.prepare('INSERT INTO rules(id,name,trigger,media_id,keywords,message,link,public_reply,active,created,flow) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),r.name,r.trigger,r.media_id,r.keywords,r.message,r.link,r.public_reply,0,created,r.flow||'{}')));
 return {imported:rows.length};
}
