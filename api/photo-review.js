const SUPABASE_URL='https://fjbrdqzvcyenglamraxi.supabase.co';
const TABLE='companycam_photo_reviews';
function key(){return process.env.SUPABASE_SERVICE_ROLE_KEY}
function headers(){return {'apikey':key(),'Authorization':`Bearer ${key()}`,'Content-Type':'application/json'}}
function validSurface(v){return ['Stamped','Broomed','Aggregate','Pavers'].includes(v)}
function validTreatments(v){return Array.isArray(v)&&v.every(x=>['Sand Blast','Revival'].includes(x))}
function send(res,status,data){res.status(status).setHeader('Cache-Control','no-store').json(data)}
export default async function handler(req,res){
  if(!key()) return send(res,500,{ok:false,error:'Server persistence is not configured'});
  try{
    if(req.method==='GET'){
      const projectId=req.query?.project_id;
      if(projectId){
        const r=await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?project_id=eq.${encodeURIComponent(projectId)}&select=*`,{headers:headers()});
        const rows=await r.json(); if(!r.ok) return send(res,r.status,{ok:false,error:rows});
        return send(res,200,{ok:true,review:rows[0]||null});
      }
      const r=await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=project_id,status`,{headers:headers()});
      const rows=await r.json(); if(!r.ok) return send(res,r.status,{ok:false,error:rows});
      return send(res,200,{ok:true,reviews:rows,progress:{reviewed:rows.filter(x=>x.status==='reviewed').length,skipped:rows.filter(x=>x.status==='skipped').length,total:rows.length}});
    }
    if(req.method!=='POST') return send(res,405,{ok:false,error:'Method not allowed'});
    const b=typeof req.body==='string'?JSON.parse(req.body):req.body;
    const status=b.status||'reviewed';
    if(!b.project_id) return send(res,400,{ok:false,error:'project_id is required'});
    if(!['reviewed','skipped'].includes(status)) return send(res,400,{ok:false,error:'Invalid status'});
    if(status==='reviewed'){
      if(!validSurface(b.surface_type)) return send(res,400,{ok:false,error:'Choose a surface type'});
      if(!b.before_photo_id||!b.after_photo_id) return send(res,400,{ok:false,error:'Choose one Before and one After'});
      if(String(b.before_photo_id)===String(b.after_photo_id)) return send(res,400,{ok:false,error:'Before and After must be different'});
    }
    if(!validTreatments(b.treatment_tags||[])) return send(res,400,{ok:false,error:'Invalid treatment tag'});
    const row={project_id:String(b.project_id),project_name:b.project_name||null,surface_type:b.surface_type||null,treatment_tags:b.treatment_tags||[],before_photo_id:b.before_photo_id?String(b.before_photo_id):null,after_photo_id:b.after_photo_id?String(b.after_photo_id):null,glam_photo_ids:(b.glam_photo_ids||[]).map(String),status,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=project_id`,{method:'POST',headers:{...headers(),'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)});
    const out=await r.json(); if(!r.ok) return send(res,r.status,{ok:false,error:out});
    return send(res,200,{ok:true,review:out[0]||row});
  }catch(e){return send(res,500,{ok:false,error:e.message||'Unexpected error'})}
}