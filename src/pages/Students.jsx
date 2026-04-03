import React,{useState,useEffect,useMemo}from'react';
import{motion,AnimatePresence}from'framer-motion';
import{getStudents,getStandards,addStudent,updateStudent,deleteStudent,getFeeSummary}from'../lib/api';
import{Search,Plus,X,Edit2,Trash2,ChevronRight}from'lucide-react';
import{showToast}from'../utils';

export default function Students(){
  const[students,setStudents]=useState([]);
  const[standards,setStandards]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState('');
  const[feeFilter,setFeeFilter]=useState('All');
  const[showModal,setShowModal]=useState(false);
  const[editingId,setEditingId]=useState(null);
  const[saving,setSaving]=useState(false);
  const[confirmDel,setConfirmDel]=useState(null);
  const[feeMap,setFeeMap]=useState({});
  const[form,setForm]=useState({name:'',roll_no:'',gender:'Male',standard_id:'',parent_name:'',parent_phone:'',parent_email:'',date_of_birth:'',address:'',enrollment_date:new Date().toISOString().split('T')[0]});

  useEffect(()=>{
    async function ld(){
      setLoading(true);
      const[studs,stds,fees]=await Promise.all([getStudents(),getStandards(),getFeeSummary()]);
      setStudents(studs||[]);setStandards(stds||[]);
      const fm={};
      (fees||[]).forEach(f=>{fm[f.student_id]=f.status||'pending'});
      setFeeMap(fm);setLoading(false);
    }
    ld();
  },[]);

  const filtered=useMemo(()=>{
    return(students||[]).filter(s=>{
      if(feeFilter!=='All'&&(feeMap[s.id]||'pending')!==feeFilter)return false;
      if(search){
        const q=search.toLowerCase();
        if(!s.name?.toLowerCase().includes(q)&&!String(s.roll_no||'').includes(q)&&!s.parent_name?.toLowerCase().includes(q))return false;
      }
      return true;
    });
  },[students,search,feeFilter,feeMap]);

  const openAdd=()=>{
    setForm({name:'',roll_no:'',gender:'Male',standard_id:standards[0]?.id||'',parent_name:'',parent_phone:'',parent_email:'',date_of_birth:'',address:'',enrollment_date:new Date().toISOString().split('T')[0]});
    setEditingId(null);setShowModal(true);
  };
  const openEdit=(s)=>{
    setForm({name:s.name||'',roll_no:s.roll_no||'',gender:s.gender||'Male',standard_id:s.standard_id||'',parent_name:s.parent_name||'',parent_phone:s.parent_phone||'',parent_email:s.parent_email||'',date_of_birth:s.date_of_birth||'',address:s.address||'',enrollment_date:s.enrollment_date||''});
    setEditingId(s.id);setShowModal(true);
  };
  const handleSave=async(e)=>{
    e.preventDefault();setSaving(true);
    try{
      if(editingId){await updateStudent(editingId,form);showToast('Student updated')}
      else{await addStudent(form);showToast('Student added')}
      setShowModal(false);
      const[studs,fees]=await Promise.all([getStudents(),getFeeSummary()]);
      setStudents(studs||[]);
      const fm={};(fees||[]).forEach(f=>{fm[f.student_id]=f.status||'pending'});setFeeMap(fm);
    }catch(err){showToast(err.message||'Save failed','error')}finally{setSaving(false)}
  };
  const handleDelete=async(id)=>{
    await deleteStudent(id);showToast('Deleted');
    const[studs,fees]=await Promise.all([getStudents(),getFeeSummary()]);
    setStudents(studs||[]);
    const fm={};(fees||[]).forEach(f=>{fm[f.student_id]=f.status||'pending'});setFeeMap(fm);
    setConfirmDel(null);
  };
  const feeColor=(s)=>s==='paid'?'var(--success)':s==='overdue'?'var(--danger)':'var(--warning)';

  return(
    <>
      <div className="page">
        <div style={{marginBottom:12}}>
          <div style={{position:'relative',marginBottom:10}}>
            <Search size={16}className="si"/>
            <input className="input input-search" placeholder="Search students..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="filter-chips">
            {['All','paid','pending','overdue'].map(f=>(
              <button key={f} className={"chip"+(feeFilter===f?" active":"")} onClick={()=>setFeeFilter(f)}>
                {f==='All'?'All Fees':f}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{overflow:'hidden',marginBottom:20}}>
          <div style={{padding:'12px 16px',borderBottom:'0.5px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'0.85rem',color:'var(--text-secondary)',fontWeight:500}}>{filtered.length} student{filtered.length!==1?'s':''}</span>
            <motion.button whileTap={{scale:0.95}} onClick={openAdd} className="btn btn-primary btn-sm"><Plus size={14}/>Add</motion.button>
          </div>
          <AnimatePresence>
            {loading?(<div style={{padding:48,textAlign:'center'}}><div className="spinner dark" style={{margin:'0 auto'}}/></div>):
             filtered.map((s,i)=>(
               <motion.div key={s.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.02}}
                 style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom:'0.5px solid var(--border)',cursor:'pointer',background:'var(--surface)'}}
                 onClick={()=>openEdit(s)}>
                 <div className="list-item-avatar">{s.name?.charAt(0)||'?'}</div>
                 <div style={{flex:1,minWidth:0}}>
                   <div style={{fontWeight:600,fontSize:'0.95rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                   <div style={{fontSize:'0.75rem',color:'var(--text-tertiary)',marginTop:2}}>{s.standards?.name} &middot; {s.parent_name||'—'}</div>
                 </div>
                 <div style={{display:'flex',alignItems:'center',gap:8}}>
                   <span className={"badge "+s.status} style={{background:feeColor(s.status)+'18',color:feeColor(s.status)}}>{s.status||'pending'}</span>
                   <ChevronRight size={16}style={{color:'var(--text-tertiary)'}}/>
                 </div>
               </motion.div>
             ))
            }
            {!loading&&filtered.length===0&&(<div style={{padding:32,textAlign:'center',color:'var(--text-tertiary)'}}>No students found</div>)}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showModal&&(
          <div className="modal-overlay" onClick={()=>setShowModal(false)}>
            <motion.div className="modal" initial={{y:200}} animate={{y:0}} transition={{type:'spring',stiffness:300,damping:30}} onClick={e=>e.stopPropagation()}>
              <div className="modal-handle"/>
              <div className="modal-header">
                <h3>{editingId?'Edit Student':'Add Student'}</h3>
                <button className="btn-icon" onClick={()=>setShowModal(false)}><X size={18}/></button>
              </div>
              <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="input-group"><label className="input-label">Student Name *</label><input className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Full name"/></div>
                <div className="input-group"><label className="input-label">Standard *</label>
                  <select className="input" required value={form.standard_id} onChange={e=>setForm(p=>({...p,standard_id:Number(e.target.value)}))}>
                    <option value="">Select...</option>{standards.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="input-group"><label className="input-label">Roll No</label><input className="input" type="number" value={form.roll_no} onChange={e=>setForm(p=>({...p,roll_no:Number(e.target.value)}))}/></div>
                  <div className="input-group"><label className="input-label">Gender</label><select className="input" value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value}))}><option>Male</option><option>Female</option><option>Other</option></select></div>
                </div>
                <div className="input-group"><label className="input-label">Parent Name *</label><input className="input" required value={form.parent_name} onChange={e=>setForm(p=>({...p,parent_name:e.target.value}))}/></div>
                <div className="input-group"><label className="input-label">Phone *</label><input className="input" required value={form.parent_phone} onChange={e=>setForm(p=>({...p,parent_phone:e.target.value}))}/></div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':editingId?'Update':'Add Student'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDel&&(
          <div className="modal-overlay" onClick={()=>setConfirmDel(null)}>
            <motion.div className="modal" initial={{y:200}} animate={{y:0}} onClick={e=>e.stopPropagation()}>
              <div className="modal-handle"/>
              <h3 style={{marginBottom:12}}>Delete {confirmDel.name}?</h3>
              <p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>This action cannot be undone.</p>
              <div style={{display:'flex',gap:12,marginTop:20}}>
                <button className="btn btn-outline" style={{flex:1}} onClick={()=>setConfirmDel(null)}>Cancel</button>
                <motion.button className="btn btn-danger" style={{flex:1}} whileTap={{scale:0.95}} onClick={()=>handleDelete(confirmDel.id)}>Delete</motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}