import React,{useState,useEffect}from'react';
import{motion,AnimatePresence}from'framer-motion';
import{useAuth}from'../App';
import{getFeeSummary,recordPayment}from'../lib/api';
import{IndianRupee,Plus,X}from'lucide-react';
import{showToast}from'../utils';

export default function Billing(){
  const{user}=useAuth();
  const[fees,setFees]=useState([]);
  const[loading,setLoading]=useState(true);
  const[showPay,setShowPay]=useState(null);
  const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({amount:'',payment_method:'cash'});
  const[totalDemand,setTotalDemand]=useState(0);
  const[totalPaid,setTotalPaid]=useState(0);

  const load=async()=>{
    setLoading(true);
    try{
      const stdId=(user.role==='parent'||user.role==='student')?(user.students||[]).map(s=>s.id):undefined;
      const data=await getFeeSummary();
      const filtered=stdId?data.filter(f=>stdId.includes(f.student_id)):data;
      setFees(filtered||[]);
      const td=(filtered||[]).reduce((s,f)=>s+parseFloat(f.total_fees||0),0);
      const tp=(filtered||[]).reduce((s,f)=>s+parseFloat(f.paid_fees||0),0);
      setTotalDemand(td);setTotalPaid(tp);
    }catch(e){showToast('Failed to load','error')}
    setLoading(false);
  };
  useEffect(()=>{load()},[]);

  const openPay=(f)=>{setShowPay(f);setForm({amount:'',payment_method:'cash'})};
  const handlePay=async(e)=>{
    e.preventDefault();
    if(!form.amount||parseFloat(form.amount)<=0){showToast('Enter valid amount','error');return}
    setSaving(true);
    try{
      await recordPayment({student_id:showPay.student_id,amount:parseFloat(form.amount),payment_date:new Date().toISOString().split('T')[0],payment_method:form.payment_method});
      showToast('Payment recorded!');
      setShowPay(null);load();
    }catch(e){showToast(e.message||'Failed','error')}
    setSaving(false);
  };

  const statusColor=(s)=>s==='paid'?'var(--success)':s==='overdue'?'var(--danger)':'var(--warning)';

  return(
    <>
      <div className="page">
        {/* Summary Hero */}
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
          className="hero-card" style={{marginBottom:20,background:'linear-gradient(135deg,var(--gold),var(--gold-light))'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{fontSize:'0.75rem',opacity:0.8,marginBottom:4}}>Total Demand</div>
              <div style={{fontSize:'1.6rem',fontWeight:800}}>Rs.{totalDemand.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div style={{fontSize:'0.75rem',opacity:0.8,marginBottom:4}}>Collected</div>
              <div style={{fontSize:'1.6rem',fontWeight:800}}>Rs.{totalPaid.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div style={{marginTop:12,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2}}>
            <motion.div initial={{width:'0%'}} animate={{width:totalDemand>0?Math.min((totalPaid/totalDemand)*100,100)+'%':'0%'}} transition={{duration:1,ease:'easeOut'}}
              style={{height:'100%',background:'white',borderRadius:2}}/>
          </div>
          <div style={{fontSize:'0.75rem',opacity:0.7,marginTop:8}}>Pending: Rs.{(totalDemand-totalPaid).toLocaleString('en-IN')}</div>
        </motion.div>

        <div className="section-header" style={{marginBottom:12}}>
          <h3 className="section-title">Fee Records</h3>
          <span style={{fontSize:'0.8rem',color:'var(--text-tertiary)'}}>{fees.length} student{fees.length!==1?'s':''}</span>
        </div>

        <AnimatePresence>
          {loading?(<div style={{textAlign:'center',padding:48}}><div className="spinner dark" style={{margin:'0 auto'}}/></div>):
           fees.map((f,i)=>(
             <motion.div key={f.student_id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
               className="card" style={{padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:12}}>
               <div style={{flex:1,minWidth:0}}>
                 <div style={{fontWeight:600,fontSize:'0.95rem',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.student_name}</div>
                 <div style={{fontSize:'0.75rem',color:'var(--text-tertiary)'}}>{f.standard_name}</div>
               </div>
               <div style={{textAlign:'right',marginRight:10}}>
                 <div style={{fontSize:'0.95rem',fontWeight:700,color:statusColor(f.status)}}>Rs.{parseFloat(f.balance||0).toLocaleString('en-IN')}</div>
                 <div style={{fontSize:'0.7rem',color:'var(--text-tertiary)'}}>balance</div>
               </div>
               <motion.button whileTap={{scale:0.95}} onClick={()=>openPay(f)}
                 className="btn btn-gold btn-sm" style={{flexShrink:0,padding:'8px 14px'}}>
                 <Plus size={12}/>{f.balance>0?'Pay':'Receipt'}
               </motion.button>
             </motion.div>
           ))
          }
          {!loading&&fees.length===0&&(<div style={{textAlign:'center',padding:32,color:'var(--text-tertiary)'}}>No fee records found</div>)}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showPay&&(
          <div className="modal-overlay" onClick={()=>setShowPay(null)}>
            <motion.div className="modal" initial={{y:200}} animate={{y:0}} transition={{type:'spring',stiffness:300,damping:30}} onClick={e=>e.stopPropagation()}>
              <div className="modal-handle"/>
              <div className="modal-header"><h3>Record Payment</h3><button className="btn-icon" onClick={()=>setShowPay(null)}><X size={18}/></button></div>
              <div style={{marginBottom:16}}>
                <div style={{fontWeight:600,marginBottom:4}}>{showPay.student_name}</div>
                <div style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Balance: <strong style={{color:'var(--danger)'}}>Rs.{parseFloat(showPay.balance||0).toLocaleString('en-IN')}</strong></div>
              </div>
              <form onSubmit={handlePay} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="input-group"><label className="input-label">Amount (Rs.) *</label>
                  <input className="input" type="number" required min="1" max={showPay.balance||999999}
                    value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="Enter amount"/>
                </div>
                <div className="input-group"><label className="input-label">Payment Method</label>
                  <select className="input" value={form.payment_method} onChange={e=>setForm(p=>({...p,payment_method:e.target.value}))}>
                    <option value="cash">Cash</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={()=>setShowPay(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Recording...':'Record Payment'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}