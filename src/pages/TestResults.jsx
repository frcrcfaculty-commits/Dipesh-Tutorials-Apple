import React,{useState,useEffect}from"react";
import{motion,AnimatePresence}from"framer-motion";
import{useAuth}from"../App";
import{getTests,getTestResults,createTest,upsertTestResults,getStandards,getSubjects}from"../lib/api";
import{Plus,X,FileText}from"lucide-react";
import{showToast}from"../utils";

export default function TestResults(){
  const{user}=useAuth();
  const[tests,setTests]=useState([]);
  const[selectedTest,setSelectedTest]=useState(null);
  const[results,setResults]=useState([]);
  const[standards,setStandards]=useState([]);
  const[subjects,setSubjects]=useState([]);
  const[loading,setLoading]=useState(true);
  const[showCreate,setShowCreate]=useState(false);
  const[creating,setCreating]=useState(false);
  const[showEntry,setShowEntry]=useState(false);
  const[saving,setSaving]=useState(false);
  const[newTest,setNewTest]=useState({name:"",standard_id:"",test_date:new Date().toISOString().split("T")[0]});
  const[entry,setEntry]=useState({});
  const isAdmin=user?.role==="admin"||user?.role==="superadmin";

  useEffect(()=>{loadAll()},[]);
  useEffect(()=>{if(selectedTest)loadResults()},[selectedTest]);

  async function loadAll(){
    setLoading(true);
    try{
      const[t,stds,subs]=await Promise.all([getTests(),getStandards(),getSubjects()]);
      setTests(t||[]);setStandards(stds||[]);setSubjects(subs||[]);
      if((t||[]).length>0&&!selectedTest)setSelectedTest(t[0]);
    }catch(e){showToast("Failed to load","error")}
    setLoading(false);
  }
  async function loadResults(){
    try{
      const data=await getTestResults({testId:selectedTest.id});
      setResults(data||[]);
    }catch(_){setResults([])}
  }
  async function handleCreate(e){
    e.preventDefault();
    setCreating(true);
    try{
      const t=await createTest({...newTest,created_by:user.id});
      showToast("Test created!");
      setShowCreate(false);
      await loadAll();
      setSelectedTest(t);
    }catch(e){showToast(e.message||"Failed","error")}
    setCreating(false);
  }
  async function handleSaveResults(){
    setSaving(true);
    try{
      const rows=Object.entries(entry).map(([sid,marks])=>({
        test_id:selectedTest.id,student_id:sid,
        subject_id:subjects.find(s=>s.standard_id===selectedTest.standard_id)?.id||subjects[0]?.id,
        marks_obtained:parseFloat(marks)||0,max_marks:100
      })).filter(r=>r.marks_obtained>=0);
      await upsertTestResults(rows);
      showToast("Results saved!");
      setShowEntry(false);
      await loadResults();
    }catch(e){showToast(e.message||"Failed","error")}
    setSaving(false);
  }

  const gradeColors={"A+":"var(--success)","A":"var(--success)","B+":"var(--blue)","B":"var(--blue)","C":"var(--warning)","D":"var(--danger)","F":"var(--danger)"};
  const gradePct=(r)=>r.max_marks>0?Math.round((r.marks_obtained/r.max_marks)*100):0;
  const testStudents=results.map(r=>({id:r.student_id,name:r.students?.name||"—",roll_no:r.students?.roll_no||"—",subject:r.subjects?.name||"—",obtained:r.marks_obtained,max:r.max_marks,grade:r.grade||"—",pct:gradePct(r)}));

  return(
    <>
      <div className="page">
        <div style={{marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <select className="input" style={{maxWidth:260,fontSize:"0.85rem"}}
            value={selectedTest?.id||""}
            onChange={e=>setSelectedTest(tests.find(t=>t.id===e.target.value))}>
            {(tests||[]).map(t=><option key={t.id} value={t.id}>{t.name} — {t.test_date}</option>)}
          </select>
          {isAdmin&&<motion.button whileTap={{scale:0.95}} onClick={()=>setShowCreate(p=>!p)} className="btn btn-primary btn-sm"><Plus size={14}/>New Test</motion.button>}
        </div>

        {showCreate&&isAdmin&&(
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="card" style={{padding:20,marginBottom:16}}>
            <h3 style={{marginBottom:14}}>Create New Test</h3>
            <form onSubmit={handleCreate} style={{display:"flex",flexDirection:"column",gap:12}}>
              <div className="input-group"><label className="input-label">Test Name *</label>
                <input className="input" required value={newTest.name} onChange={e=>setNewTest(p=>({...p,name:e.target.value}))} placeholder="e.g. Unit Test 1"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="input-group"><label className="input-label">Standard *</label>
                  <select className="input" required value={newTest.standard_id} onChange={e=>setNewTest(p=>({...p,standard_id:Number(e.target.value)}))}>
                    <option value="">Select...</option>{(standards||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="input-group"><label className="input-label">Date *</label>
                  <input className="input" type="date" required value={newTest.test_date} onChange={e=>setNewTest(p=>({...p,test_date:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating?"Creating...":"Create Test"}</button>
              </div>
            </form>
          </motion.div>
        )}

        {results.length===0&&!loading&&selectedTest&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card" style={{padding:32,textAlign:"center",marginBottom:16}}>
            <FileText size={32} style={{marginBottom:12,opacity:0.3,color:"var(--text-tertiary)"}}/>
            <p style={{color:"var(--text-tertiary)"}}>No results yet for this test</p>
            {isAdmin&&<motion.button whileTap={{scale:0.95}} onClick={()=>setShowEntry(true)} className="btn btn-primary btn-sm" style={{marginTop:16}}><Plus size={14}/>Enter Results</motion.button>}
          </motion.div>
        )}

        {results.length>0&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <div className="card" style={{overflow:"hidden",marginBottom:16}}>
              <div style={{padding:"12px 16px",borderBottom:"0.5px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"0.85rem",color:"var(--text-secondary)"}}>{results.length} student{results.length!==1?"s":""}</span>
                {isAdmin&&<motion.button whileTap={{scale:0.95}} onClick={()=>setShowEntry(true)} className="btn btn-primary btn-sm"><Plus size={14}/>Update Results</motion.button>}
              </div>
              {testStudents.map((r,i)=>(
                <motion.div key={r.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:"0.5px solid var(--border)"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:"0.9rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                    <div style={{fontSize:"0.72rem",color:"var(--text-tertiary)"}}>{r.subject} &middot; Roll {r.roll_no}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:800,fontSize:"1rem",color:gradeColors[r.grade]||"var(--text)"}}>{r.pct}%</div>
                    <div style={{fontSize:"0.72rem",color:"var(--text-tertiary)"}}>{r.obtained}/{r.max}</div>
                  </div>
                  <div style={{width:36,height:36,borderRadius:10,background:(gradeColors[r.grade]||"var(--text)")+"18",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"0.85rem",color:gradeColors[r.grade]||"var(--text)"}}>
                    {r.grade}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showEntry&&isAdmin&&(
          <div className="modal-overlay" onClick={()=>setShowEntry(false)}>
            <motion.div className="modal" initial={{y:200}} animate={{y:0}} transition={{type:"spring",stiffness:300,damping:30}} onClick={e=>e.stopPropagation()}>
              <div className="modal-handle"/>
              <div className="modal-header"><h3>Enter / Update Results</h3><button className="btn-icon" onClick={()=>setShowEntry(false)}><X size={18}/></button></div>
              <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:"60vh",overflowY:"auto"}}>
                {testStudents.map(r=>(
                  <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 80px auto",gap:10,alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid var(--border)"}}>
                    <div style={{fontWeight:500,fontSize:"0.9rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                    <input className="input" type="number" min="0" max={r.max} value={entry[r.id]!==undefined?entry[r.id]:r.obtained}
                      onChange={e=>setEntry(p=>({...p,[r.id]:parseFloat(e.target.value)||0}))}
                      style={{padding:"8px 10px",fontSize:"0.9rem",textAlign:"center"}}/>
                    <div style={{fontSize:"0.8rem",color:"var(--text-tertiary)",fontWeight:600}}>/ {r.max}</div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={()=>setShowEntry(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={saving} onClick={handleSaveResults}>{saving?"Saving...":"Save Results"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}