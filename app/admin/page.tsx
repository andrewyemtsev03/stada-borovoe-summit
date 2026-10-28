import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import './race-control.css';
import './sign-in.css';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

// Every visit to /admin starts at Sign in, even with an existing session.
export default function AdminSignIn() {
  return <div className="rc-shell is-login"><main id="main-content" className="rc-login-stage"><section className="rc-login-panel" aria-labelledby="rc-login-title"><div className="rc-login-identity"><svg className="rc-login-symbol" viewBox="0 0 32 36" aria-hidden="true"><path fill="currentColor" d="M13 3h9L10 18H1zm10 0h8L19 18h-8zM12 20h9L11 33H2zm11 0h8L21 33h-8z"/></svg><h1 id="rc-login-title">Race Control</h1></div><p className="rc-login-description">STADA NEO TOKYO / 2026</p><LoginForm/></section><Link href="/" className="rc-login-back"><ArrowLeft size={13}/>Вернуться на сайт</Link></main>
  </div>;
}
