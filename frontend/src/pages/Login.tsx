import { useState } from 'react'
import useAuthStore from '../store/auth'
import f from '../components/Form.module.css'
import s from './Login.module.css'

export default function Login() {
  const { login, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <div className={s.wrap}>
            <h1 className="h1">Login</h1>
            <form onSubmit={async (e) => {
  e.preventDefault();
  try {
    await login(email, password, code);
    // optional: navigate('/dashboard');
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.message || 'Login failed';
    alert(msg);
  }
}}>
              <div className={f.field}>
                <label className="label">Email</label>
                <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div className={f.field}>
                <label className="label">Password</label>
                <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              <div className={f.field}>
                <label className="label">2FA code (if prompted)</label>
                <input className="input" value={code} onChange={e=>setCode(e.target.value)} />
              </div>
              <div className={f.actions}>
                <button disabled={loading} className="button primary w-full">{loading ? 'Working...' : 'Login'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
