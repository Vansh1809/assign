import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Navbar from './Navbar';

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const strengthData = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { label: 'Weak', color: '#f24d4d', width: '22%' };
  if (score === 2) return { label: 'Fair', color: '#f6c948', width: '50%' };
  if (score === 3) return { label: 'Good', color: '#00d19d', width: '72%' };
  return { label: 'Strong', color: '#3ddc97', width: '100%' };
};

const requirements = [
  { label: 'At least 8 characters', validator: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', validator: (pw) => /[A-Z]/.test(pw) },
  { label: 'One number', validator: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', validator: (pw) => /[^A-Za-z0-9]/.test(pw) },
];



  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    roleName: 'User'
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState('');

  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE}/roles`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const passwordValidity = useMemo(
    () => requirements.map((field) => ({ ...field, valid: field.validator(formData.password) })),
    [formData.password]
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((current) => ({ ...current, [e.target.name]: '' }));
    setMessage('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, profilePic: 'File size must be less than 5MB' });
        setProfilePic(null);
        setProfilePreviewUrl('');
        return;
      }

      setProfilePic(file);
      const objectUrl = URL.createObjectURL(file);
      setProfilePreviewUrl(objectUrl);

      setErrors((current) => {
        const newErrors = { ...current };
        delete newErrors.profilePic;
        return newErrors;
      });
    } else {
      setProfilePic(null);
      setProfilePreviewUrl('');
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Please enter your full name.';
    if (!formData.email.trim()) nextErrors.email = 'Please enter your email address.';
    else if (!emailPattern.test(formData.email)) nextErrors.email = 'Please enter a valid email.';
    if (!formData.password) nextErrors.password = 'Please choose a password.';
    else if (formData.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    if (!formData.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
    else if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    return nextErrors;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage('');

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Create FormData for file upload
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('email', formData.email.trim());
      data.append('password', formData.password);
      data.append('roleName', formData.roleName);
      
      if (profilePic) {
        data.append('profilePicture', profilePic);
      }

      const response = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        body: data
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Account created successfully. Redirecting...');
        setFormData({ name: '', email: '', password: '', confirmPassword: '', roleName: 'User' });
        setProfilePic(null);
        setProfilePreviewUrl('');
        setErrors({});

        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(result.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      setMessage(error.message || 'Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = strengthData(formData.password);

  return (
    <div>
      <Navbar />
      <div className='page-shell'>
        <div className='main-page'>
          <div className='auth-card'>
            <div className='form-head'>
              <p className='heading'>Create your account</p>
              <p className='subheading'>A polished signup flow built for professionals and product demos.</p>
            </div>
            <form className='auth-form' onSubmit={handleSignUp}>
              <div className='input-group'>
                <input
                  type='text'
                  name='name'
                  autoComplete='name'
                  placeholder='Full name'
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.name && <p className='field-note'>{errors.name}</p>}
              </div>

              <div className='input-group'>
                <input
                  type='email'
                  name='email'
                  autoComplete='email'
                  placeholder='Email address'
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.email && <p className='field-note'>{errors.email}</p>}
              </div>

              <div className='input-group password-group'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name='password'
                  autoComplete='new-password'
                  placeholder='Create password'
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type='button'
                  className='password-toggle'
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                {errors.password && <p className='field-note'>{errors.password}</p>}
              </div>

              <div className='strength-meter'>
                <div className='strength-bar'>
                  <div className='strength-fill' style={{ width: strength.width, backgroundColor: strength.color }} />
                </div>
                <span className='strength-label'>{strength.label}</span>
              </div>

              <div className='input-group'>
                <input
                  type='password'
                  name='confirmPassword'
                  autoComplete='new-password'
                  placeholder='Confirm password'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.confirmPassword && <p className='field-note'>{errors.confirmPassword}</p>}
              </div>

              <div className='policy-list'>
                {passwordValidity.map((rule) => (
                  <div key={rule.label} className={`policy-row ${rule.valid ? 'policy-valid' : ''}`}>
                    <span className='policy-dot'>{rule.valid ? '✓' : '•'}</span>
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>

              <div className='input-group'>
                <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Select Role:</label>
                <select 
                  name="roleName" 
                  value={formData.roleName}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  {roles.length > 0 ? (
                    roles.map(role => (
                      <option key={role._id} value={role.name}>
                        {role.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="User">User</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Admin">Admin</option>
                    </>
                  )}
                </select>
              </div>

              <div className='input-group'>
                <label style={{ display: 'block', marginBottom: '10px', color: '#666' }}>Profile Picture:</label>

                <div className='avatar-upload'>
                  <div className='avatar-preview'>
                    {profilePreviewUrl ? (
                      <img src={profilePreviewUrl} alt='Profile preview' />
                    ) : (
                      <div className='avatar-placeholder'>
                        <span>+</span>
                      </div>
                    )}
                  </div>

                  <div className='avatar-uploader'>
                    <input
                      type='file'
                      name='profilePic'
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                    {profilePic && (
                      <p style={{ fontSize: '12px', margin: '8px 0 0', color: 'rgba(255, 255, 255, 0.6)' }}>
                        Selected: {profilePic.name}
                      </p>
                    )}
                  </div>
                </div>

                {errors.profilePic && <p className='field-note'>{errors.profilePic}</p>}
              </div>


              {message && (
                <div className={`errMsg ${message.toLowerCase().includes('success') ? 'successMsg' : ''}`} role='status'>
                  {message}
                </div>
              )}

              <button className='auth-button' type='submit' disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>
              <p className='hint-text'>Already have an account? <Link to='/login'>Log in</Link></p>
            </form>
          </div>

          <div className='hero-panel'>
            <img src='https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' alt='Signup illustration' />
            <div className='hero-caption'>
              <h3>Refined for demos and portfolios</h3>
              <ul className='feature-list'>
                <li>Backend signup validation</li>
                <li>Instant password feedback</li>
                <li>Role-based user system</li>
                <li>Profile picture upload</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
