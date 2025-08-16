import { useState } from 'react'
import Recaptcha from '../components/Recaptcha'
import useAuthStore from '../store/auth'
import f from '../components/Form.module.css'
import s from './Register.module.css'

export default function Register() {
  const { register, loading } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [secretQ, setSecretQ] = useState('')
  const [secretA, setSecretA] = useState('')
  const [captcha, setCaptcha] = useState('')

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <div className={s.wrap}>
            <h1 className="h1">Create your account</h1>
            <form onSubmit={async (e) => {
  e.preventDefault();
  try {
    await register(name, email, password, secretQ, secretA, captcha);
    alert('Account created! Now log in.');
    // optional: navigate('/login');
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.message || 'Registration failed';
    alert(msg);
  }
}}>
              <div className={f.field}>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div className={f.field}>
                <label className="label">Email</label>
                <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div className={f.field}>
                <label className="label">Password</label>
                <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              <div className={f.field}>
                <label className="label">Secret Question</label>
                <input className="input" value={secretQ} onChange={e=>setSecretQ(e.target.value)} />
              </div>
              <div className={f.field}>
                <label className="label">Secret Answer</label>
                <input className="input" value={secretA} onChange={e=>setSecretA(e.target.value)} />
              </div>

              <div className="stack mt-3">
                <Recaptcha onToken={setCaptcha} />
                <span className="small muted">reCAPTCHA v3 token (dev)</span>
              </div>

              <div className={f.actions}>
                <button disabled={loading} className="button primary w-full">{loading ? 'Working...' : 'Create account'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
