import { useState, useEffect } from 'react';

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<circle cx='50' cy='50' r='50' fill='%23DDDCF7'/>" +
  "<circle cx='50' cy='40' r='18' fill='%235F2EEA'/>" +
  "<path d='M25 80c0-15 11-20 25-20s25 5 25 20' fill='%235F2EEA'/></svg>";

function BackArrow({ onClick }) {
  return (
    <button className="btn-back" onClick={onClick}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function InputField({ id, name, type = 'text', label, value, onChange, error, required }) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value !== '';

  return (
    <div className={`input-field ${isActive ? 'active' : ''} ${error ? 'has-error' : ''}`}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
      />
      <label htmlFor={id}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const [signupForm, setSignupForm] = useState({
    name: '', phone: '', email: '', password: '', company: '', agency: 'no',
  });
  const [signupErrors, setSignupErrors] = useState({});

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem('popx_users');
    if (stored) setUsers(JSON.parse(stored));

    const active = localStorage.getItem('popx_active_user');
    if (active) {
      setCurrentUser(JSON.parse(active));
      setScreen('profile');
    }
  }, []);

  function showToast(message, type = 'success') {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }

  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = phone => /^\d{10}$/.test(phone);

  function handleSignupChange(e) {
    const { name, value } = e.target;
    setSignupForm(f => ({ ...f, [name]: value }));
    if (signupErrors[name]) setSignupErrors(err => ({ ...err, [name]: '' }));
  }

  function handleSignupSubmit(e) {
    e.preventDefault();
    const errors = {};

    if (!signupForm.name.trim()) {
      errors.name = 'Full name is required';
    } else if (signupForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!signupForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!isValidPhone(signupForm.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit number';
    }

    if (!signupForm.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!isValidEmail(signupForm.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!signupForm.password) {
      errors.password = 'Password is required';
    } else if (signupForm.password.length < 6) {
      errors.password = 'Minimum 6 characters required';
    }

    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const email = signupForm.email.trim().toLowerCase();
    if (users.some(u => u.email === email)) {
      setSignupErrors(err => ({ ...err, email: 'Email is already registered' }));
      showToast('Email already exists', 'error');
      return;
    }

    const newUser = {
      name: signupForm.name.trim(),
      phone: signupForm.phone.trim(),
      email,
      password: signupForm.password,
      company: signupForm.company.trim(),
      agency: signupForm.agency,
      avatar: null,
    };

    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('popx_users', JSON.stringify(updated));
    setCurrentUser(newUser);
    localStorage.setItem('popx_active_user', JSON.stringify(newUser));

    showToast('Account created successfully!');
    setSignupForm({ name: '', phone: '', email: '', password: '', company: '', agency: 'no' });
    setTimeout(() => setScreen('profile'), 1000);
  }

  function handleLoginChange(e) {
    const { name, value } = e.target;
    setLoginForm(f => ({ ...f, [name]: value }));
    if (loginErrors[name]) setLoginErrors(err => ({ ...err, [name]: '' }));
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const errors = {};

    if (!loginForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(loginForm.email.trim())) {
      errors.email = 'Enter a valid email';
    }

    if (!loginForm.password) {
      errors.password = 'Password is required';
    }

    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const email = loginForm.email.trim().toLowerCase();
    const match = users.find(u => u.email === email && u.password === loginForm.password);

    if (match) {
      setCurrentUser(match);
      localStorage.setItem('popx_active_user', JSON.stringify(match));
      showToast('Logged in successfully!');
      setLoginForm({ email: '', password: '' });
      setTimeout(() => setScreen('profile'), 1000);
    } else {
      showToast('Invalid email or password', 'error');
      setLoginErrors({ email: ' ', password: 'Incorrect credentials' });
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const src = event.target.result;
      const updatedUser = { ...currentUser, avatar: src };
      setCurrentUser(updatedUser);
      localStorage.setItem('popx_active_user', JSON.stringify(updatedUser));

      const updatedList = users.map(u =>
        u.email === currentUser.email ? { ...u, avatar: src } : u
      );
      setUsers(updatedList);
      localStorage.setItem('popx_users', JSON.stringify(updatedList));
      showToast('Profile picture updated!');
    };
    reader.readAsDataURL(file);
  }

  function handleLogout() {
    setCurrentUser(null);
    localStorage.removeItem('popx_active_user');
    showToast('Logged out');
    setTimeout(() => setScreen('landing'), 800);
  }

  return (
    <main className="app-card">
      <div className={`toast ${toast.type} ${toast.visible ? 'visible' : ''}`}>
        {toast.message}
      </div>

      {screen === 'landing' && (
        <div className="screen">
          <div className="page-content">
            <div className="landing-content">
              <div>
                <h1 className="landing-title">Welcome to PopX</h1>
                <p className="landing-subtitle">
                The all-in-one platform to manage your agency, connect with clients, and grow your brand.
              </p>
              </div>
              <div className="btn-group">
                <button className="btn btn-primary" onClick={() => setScreen('signup')}>
                  Create Account
                </button>
                <button className="btn btn-secondary" onClick={() => setScreen('login')}>
                  Already Registered? Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'signup' && (
        <div className="screen">
          <div className="topbar">
            <BackArrow onClick={() => { setSignupErrors({}); setScreen('landing'); }} />
          </div>
          <div className="page-content">
            <h2 className="form-title">Create your<br />PopX account</h2>
            <form className="form" onSubmit={handleSignupSubmit} noValidate>
              <InputField
                id="s-name" name="name" label="Full name"
                value={signupForm.name} onChange={handleSignupChange}
                error={signupErrors.name} required
              />
              <InputField
                id="s-phone" name="phone" type="tel" label="Phone number"
                value={signupForm.phone} onChange={handleSignupChange}
                error={signupErrors.phone} required
              />
              <InputField
                id="s-email" name="email" type="email" label="Email address"
                value={signupForm.email} onChange={handleSignupChange}
                error={signupErrors.email} required
              />
              <InputField
                id="s-password" name="password" type="password" label="Password"
                value={signupForm.password} onChange={handleSignupChange}
                error={signupErrors.password} required
              />
              <InputField
                id="s-company" name="company" label="Company name"
                value={signupForm.company} onChange={handleSignupChange}
              />

              <div className="radio-section">
                <span className="radio-section-label">
                  Are you an Agency?<span className="required">*</span>
                </span>
                <div className="radio-options">
                  {['yes', 'no'].map(val => (
                    <label key={val} className="radio-option">
                      <input
                        type="radio"
                        name="agency"
                        value={val}
                        checked={signupForm.agency === val}
                        onChange={handleSignupChange}
                      />
                      <span className="radio-circle"></span>
                      {val === 'yes' ? 'Yes' : 'No'}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-submit">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {screen === 'login' && (
        <div className="screen">
          <div className="topbar">
            <BackArrow onClick={() => { setLoginErrors({}); setScreen('landing'); }} />
          </div>
          <div className="page-content">
            <h2 className="form-title">Signin to your<br />PopX account</h2>
            <p className="form-subtitle">
              Enter your credentials to access<br />your PopX account.
            </p>
            <form className="form" onSubmit={handleLoginSubmit} noValidate>
              <InputField
                id="l-email" name="email" type="email" label="Email Address"
                value={loginForm.email} onChange={handleLoginChange}
                error={loginErrors.email}
              />
              <InputField
                id="l-password" name="password" type="password" label="Password"
                value={loginForm.password} onChange={handleLoginChange}
                error={loginErrors.password}
              />
              <button type="submit" className="btn btn-primary btn-submit">
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {screen === 'profile' && currentUser && (
        <div className="screen">
          <div className="profile-topbar">
            <h1 className="profile-topbar-title">Account Settings</h1>
          </div>
          <div className="page-content">
            <div className="profile-section">
              <div className="profile-user-row">
                <div className="avatar-wrap">
                  <img
                    className="avatar-img"
                    src={currentUser.avatar || DEFAULT_AVATAR}
                    alt="User avatar"
                  />
                  <label htmlFor="avatar-input" className="avatar-edit-btn">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </label>
                  <input
                    type="file"
                    id="avatar-input"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </div>
                <div>
                  <p className="profile-name">{currentUser.name}</p>
                  <p className="profile-email">{currentUser.email}</p>
                </div>
              </div>

              <p className="profile-bio">
                Welcome to your PopX account. Manage your campaigns, track your agency performance, and stay connected with your clients all in one place.
              </p>
            </div>

            <div className="profile-actions">
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
