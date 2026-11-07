import { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Logo from '@/components/layout/Logo/Logo';
import { useAuth } from '@/admin/auth/AuthContext';
import { isApiMode } from '@/services/contentService';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './AdminLoginPage.module.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLoginPage() {
  usePageTitle('ورود مدیر');
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only ever return to an admin path (never an arbitrary URL).
  const from = typeof location.state?.from === 'string' && location.state.from.startsWith('/admin') ? location.state.from : '/admin';
  if (status === 'authenticated') return <Navigate to={from} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!EMAIL.test(values.email.trim())) next.email = 'ایمیل را درست وارد کن.';
    if (!values.password) next.password = 'گذرواژه را وارد کن.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(error?.message ?? 'ورود انجام نشد.');
      setValues((v) => ({ ...v, password: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.box}>
        <Logo />
        <h1 className={styles.title}>ورود مدیر</h1>

        {!isApiMode ? (
          <p className={styles.notice} role="note">
            <ShieldAlert size={20} aria-hidden="true" />
            <span>
              پنل مدیریت به سرور نیاز دارد. در پوشه‌ی پروژه <code dir="ltr">VITE_CONTENT_SOURCE=api</code> را در فایل <code dir="ltr">.env</code> بگذار،
              سرور را با <code dir="ltr">npm run server</code> اجرا کن و دوباره وارد شو.
            </span>
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <Input
              label="ایمیل"
              type="email"
              dir="ltr"
              autoComplete="username"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              error={errors.email}
            />
            <Input
              label="گذرواژه"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              value={values.password}
              onChange={(e) => setValues({ ...values, password: e.target.value })}
              error={errors.password}
            />
            {formError && <p className={styles.formError} role="alert">{formError}</p>}
            <Button type="submit" size="lg" fullWidth loading={submitting} iconStart={<LogIn size={20} aria-hidden="true" />}>ورود</Button>
          </form>
        )}
        <Link to="/" className={styles.back}>بازگشت به سایت</Link>
      </div>
    </main>
  );
}
