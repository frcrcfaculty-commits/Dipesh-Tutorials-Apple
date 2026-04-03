import React,{useState,useEffect}from'react';
import{motion}from'framer-motion';
import{getTests,getTestResults,getStandards}from'../lib/api';
import{BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer}from'recharts';
import{showToast}from'../utils';

const COLORS=['#0A2351','#B6922E','#10B981','#3B82F6','#EF4444'];

export default function Analytics(){
  const[tests,setTests]=useState([]);
  const[selectedTest,setSelectedTest]=useState(null);
  const[results,setResults]=useState([]);
  const[standards,setStandards]=useState([]);
  const[stdFilter,setStdFilter]=useState('all');
  const[loading,setLoading]=useState(true);

  useEffect(()=>{loadAll()},[]);
  useEffect(()=>{if(selectedTest)loadResults()},[selectedTest,stdFilter]);

  async function loadAll(){
    setLoading(true);
    try{
      const[t,stds]=await Promise.all([getTests(),getStandards()]);
      setTests(t||[]);setStandards(stds||[]);
      if((t||[]).length>0)setSelectedTest(t[0]);
    }catch(e){showToast('Failed','error')}
    setLoading(false);
  }
  async function loadResults(){
    try{
      const data=await getTestResults({testId:selectedTest.id,standardId:stdFilter!=='all'?Number(stdFilter):undefined});
      setResults(data||[]);
    }catch(_){setResults([])}
  }

  const subjectAverages={};
  (results||[]).forEach(r=>{
    const sub=r.subjects?.name||'Unknown';
    if(!subjectAverages[sub]) subjectAverages[sub]=[];
    if(r.max_marks>0)subjectAverages[sub].push(Math.round((r.marks_obtained/r.max_marks)*100));
  });
  const barData=Object.entries(subjectAverages).map(([subject,scores])=>({
    subject,avg:Math.round(scores.reduce((a,b)=>a+b,0)/(scores.length||1))
  })).sort((a,b)=>b.avg-a.avg);

  const gradeDist={'A+':0,'A':0,'B+':0,'B':0,'C':0,'D':0,'F':0};
  (results||[]).forEach(r=>{if(r.grade&&r.grade in gradeDist)gradeDist[r.grade]++});
  const gradeData=Object.entries(gradeDist).filter(([,v])=>v>0).map(([grade,count])=>({grade,count}));

  const gradeColor={'A+':'var(--success)','A':'var(--success)','B+':'var(--blue)','B':'var(--blue)','C':'var(--warning)','D':'var(--danger)','F':'var(--danger)'};
  const classAvg=barData.length>0?Math.round(barData.reduce((s,r)=>s+r.avg,0)/barData.length):0;

  return(
    <>
      <div className="page">
        <div style={{marginBottom:16,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <select className="input" style={{flex:1,minWidth:140,fontSize:'0.85rem'}} value={stdFilter} onChange={e=>setStdFilter(e.target.value)}>
            <option value="all">All Standards</option>
            {(standards||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input" style={{flex:1,minWidth:160,fontSize:'0.85rem'}}
            value={selectedTest?.id||''} onChange={e=>setSelectedTest(tests.find(t=>t.id===e.target.value))}>
            {(tests||[]).map(t=><option key={t.id} value={t.id}>{t.name} — {t.test_date}</option>)}
          </select>
        </div>

        {/* Summary Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
          {[['Class Avg',classAvg+'%','var(--navy)'],['Students',results.length,'var(--gold)'],['Subjects',barData.length,'var(--success)']].map(([label,val,color],i)=>(
            <motion.div key={label} className="metric-card" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}>
              <div className="metric-label">{label}</div>
              <div className="metric-value" style={{color}}>{loading?'—':val}</div>
            </motion.div>
          ))}
        </div>

        {loading&&<div style={{textAlign:'center',padding:32}}><div className="spinner dark" style={{margin:'0 auto'}}/></div>}

        {!loading&&results.length===0&&selectedTest&&(
          <div className="card" style={{padding:48,textAlign:'center',marginBottom:20}}>
            <p style={{color:'var(--text-tertiary)'}}>No results for this test yet</p>
          </div>
        )}

        {!loading&&barData.length>0&&(
          <>
            {/* Subject Performance Bar Chart */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
              className="card" style={{padding:20,marginBottom:16}}>
              <h3 style={{marginBottom:16}}>Subject Performance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{top:5,right:10,left:-20,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="subject" fontSize={11} angle={-30} textAnchor="end" height={60}/>
                  <YAxis domain={[0,100]} fontSize={11} tickFormatter={v=>v+'%'}/>
                  <Tooltip formatter={(v)=>[v+'%','Avg']} contentStyle={{borderRadius:10,border:'0.5px solid var(--border)',fontSize:'0.85rem'}}/>
                  <Bar dataKey="avg" fill="#0A2351" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Grade Distribution */}
            {gradeData.length>0&&(
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
                className="card" style={{padding:20,marginBottom:16}}>
                <h3 style={{marginBottom:16}}>Grade Distribution</h3>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {gradeData.map(({grade,count})=>(
                    <motion.div key={grade} initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'12px 16px',background:gradeColor[grade]+'14',borderRadius:14,minWidth:56}}>
                      <div style={{fontSize:'1.2rem',fontWeight:800,color:gradeColor[grade]}}>{count}</div>
                      <div style={{fontSize:'0.7rem',fontWeight:700,color:gradeColor[grade]}}>{grade}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </>
  );
}