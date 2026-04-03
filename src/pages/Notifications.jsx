import React,{useState,useEffect}from'react';
import{motion,AnimatePresence}from'framer-motion';
import{useAuth}from'../App';
import{getNotifications,createNotification,markNotificationRead,getStandards}from'../lib/api';
import{Bell,Send,BellRing,BellOff}from'lucide-react';
import{showToast}from'../utils';

export default function Notifications(){
  const{user}=useAuth();
  const[notifs,setNotifs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[showForm,setShowForm]=useState(false);
  const[sending,setSending]=useState(false);
  const[soundOn,setSoundOn]=useState(localStorage.getItem('dt_notif_sound')!=='false');
  const[form,setForm]=useState({title:'',message:'',type:'general',target_roles:['student','parent'],target_standard_id:null});
  const[standards,setStandards]=useState([]);
  const isAdmin=user?.role==='admin'||user?.role==='superadmin';

  const load=async()=>{
    setLoading(true);
    try{setNotifs(await getNotifications(user.role,50)||[]);}
    catch(e){showToast('Failed to load','error')}
    setLoading(false);
  };
  useEffect(()=>{load()},[]);
  useEffect(()=>{if(showForm)getStandards().then(s=>setStandards(s||[])).catch(()=>{})},[showForm]);

  const toggleRole=(role)=>{
    setForm(p=>{
      const roles=p.target_roles.includes(role)?p.target_roles.filter(r=>r!==role):[...p.target_roles,role];
      return{...p,target_roles:roles.length>0?roles:p.target_roles};
    });
  };

  const handleSend=async(e)=>{
    e.preventDefault();
    if(!form.title.trim()){showToast('Enter a title','error');return}
    if(!form.message.trim()){showToast('Enter a message','error');return}
    setSending(true);
    try{
      await createNotification({...form,sent_by:user.id});
      showToast('Notification sent!');
      setShowForm(false);
      setForm({title:'',message:'',type:'general',target_roles:['student','parent'],target_standard_id:null});
      load();
    }catch(e){showToast(e.message||'Failed','error')}
    setSending(false);
  };

  const handleRead=async(id)=>{
    await markNotificationRead(id,user.id).catch(()=>{});
    setNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n));
  };

  const typeColors={general:'var(--blue)',fee:'var(--danger)',attendance:'var(--warning)',exam:'var(--navy)',resource:'var(--success)'};
  const canSend=form.title.trim()&&form.message.trim();

  return(
    <>
      <div className="page">
        <AnimatePresence>
          {isAdmin&&(
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{marginBottom:16}}>
              <motion.button whileTap={{scale:0.95}}
                onClick={()=>{setShowForm(p=>!p);setSoundOn(localStorage.getItem('dt_notif_sound')!=='false')}}
                className="btn btn-primary" style={{width:'100%',gap:8}}>
                {showForm?<Bell size={16}/>:<Send size={16}/>}
                {showForm?'Close':'Send Notification'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {showForm&&isAdmin&&(
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="card" style={{padding:20,marginBottom:16}}>
            <form onSubmit={handleSend} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="input-group"><label className="input-label">Title *</label>
                <input className="input" required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Notification title"/>
              </div>
              <div className="input-group"><label className="input-label">Type</label>
                <select className="input" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                  <option value="general">General</option><option value="fee">Fee Reminder</option><option value="attendance">Attendance</option><option value="resource">Resource</option><option value="exam">Exam</option>
                </select>
              </div>
              <div className="input-group"><label className="input-label">Message *</label>
                <textarea className="input" required rows={3} value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} placeholder="Write your message..."/>
              </div>
              <div style={{display:'flex',gap:8}}>
                {['student','parent','admin'].map(role=>(
                  <motion.button key={role} type="button" whileTap={{scale:0.95}}
                    className={"chip"+(form.target_roles.includes(role)?" active":"")}
                    onClick={()=>toggleRole(role)}>
                    {role.charAt(0).toUpperCase()+role.slice(1)}
                  </motion.button>
                ))}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button type="submit" className="btn btn-primary" disabled={!canSend||sending} style={{flex:1}}>
                  {sending?'Sending...':'Send'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        )}

        {loading?(<div style={{textAlign:'center',padding:48}}><div className="spinner dark" style={{margin:'0 auto'}}/></div>):
         notifs.length===0?(<div style={{textAlign:'center',padding:48,color:'var(--text-tertiary)'}}><Bell size={32} style={{marginBottom:12,opacity:0.4}}/><p>No notifications yet</p></div>):
         (<AnimatePresence>
           {notifs.map((n,i)=>(
             <motion.div key={n.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
               className="card" style={{padding:0,marginBottom:10,borderLeft:'3px solid '+(typeColors[n.type]||'var(--blue)'),cursor:'pointer'}}
               onClick={()=>!n.read&&handleRead(n.id)}>
               <div style={{padding:'14px 16px'}}>
                 <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                   <span className={"badge "+n.type} style={{background:(typeColors[n.type]||'var(--blue)')+'18',color:typeColors[n.type]||'var(--blue)'}}>{n.type}</span>
                   {!n.read&&<div style={{width:8,height:8,borderRadius:'50%',background:'var(--gold)',marginLeft:'auto'}}/>}
                 </div>
                 <div style={{fontWeight:600,fontSize:'0.95rem',marginBottom:4}}>{n.title}</div>
                 <div style={{fontSize:'0.82rem',color:'var(--text-secondary)',lineHeight:1.4}}>{n.message}</div>
                 <div style={{fontSize:'0.72rem',color:'var(--text-tertiary)',marginTop:8}}>
                   {n.created_at?new Date(n.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):''}
                 </div>
               </div>
             </motion.div>
           ))}
         </AnimatePresence>)}
      </div>
    </>
  );
}