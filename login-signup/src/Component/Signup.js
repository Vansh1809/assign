import React, { useState, useEffect } from 'react';
import main from "./images/main.jpg";

const Signup = () => {
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        roleName: 'User'
    });

    // Profile picture file state
    const [profilePic, setProfilePic] = useState(null);
    
    // Roles list
    const [roles, setRoles] = useState([]);
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch roles on component mount
    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/roles');
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    };

    // Handle text input changes
    const handleInput = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError(''); // Clear error when user starts typing
    };

    // Handle file input changes
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                setProfilePic(null);
                return;
            }
            setProfilePic(file);
            setError('');
        }
    };

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Validate inputs
            if (!formData.name || !formData.email || !formData.password) {
                setError('All fields are required');
                setLoading(false);
                return;
            }

            // Create FormData object for file upload
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('roleName', formData.roleName);
            
            // Append profile picture if selected
            if (profilePic) {
                data.append('profilePicture', profilePic);
            }

            // Send signup request
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                body: data
                // Note: Don't set Content-Type header - browser will set it automatically for FormData
            });

            const result = await response.json();

            if (response.ok) {
                setSuccess('Sign up successful! Redirecting to login...');
                console.log('User registered:', result.user);
                
                // Clear form
                setFormData({ name: '', email: '', password: '', roleName: 'User' });
                setProfilePic(null);
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                setError(result.message || 'Sign up failed. Please try again.');
            }
        } catch (err) {
            console.error('Error during signup:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='main-page'>
            <form onSubmit={handleSubmit}>
                <div>
                    <p className='heading'>Sign Up</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{ 
                        margin: '10px 0', 
                        padding: '10px', 
                        backgroundColor: '#ff6b6b', 
                        color: '#fff', 
                        borderRadius: '4px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div style={{ 
                        margin: '10px 0', 
                        padding: '10px', 
                        backgroundColor: '#51cf66', 
                        color: '#fff', 
                        borderRadius: '4px',
                        textAlign: 'center'
                    }}>
                        {success}
                    </div>
                )}

                <div>
                    <input 
                        type='text' 
                        name='name'
                        placeholder='Enter Name' 
                        value={formData.name}
                        onChange={handleInput} 
                        required
                        disabled={loading}
                    />
                    <input 
                        type='email' 
                        name='email'
                        placeholder='Enter Email' 
                        value={formData.email}
                        onChange={handleInput} 
                        required
                        disabled={loading}
                    />
                    <input 
                        type='password' 
                        name='password'
                        placeholder='Enter Password' 
                        value={formData.password}
                        onChange={handleInput} 
                        required
                        disabled={loading}
                    />

                    {/* Role Selection Dropdown */}
                    <div style={{ margin: '15px 0' }}>
                        <label style={{ marginRight: '10px', display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', fontWeight: '500' }}>Select Role:</label>
                        <select 
                            name="roleName" 
                            value={formData.roleName} 
                            onChange={handleInput}
                            disabled={loading}
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

                    {/* Profile Picture Upload Field */}
                    <div style={{ margin: '15px 0' }}>
                        <label style={{ marginRight: '10px', display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', fontWeight: '500' }}>Upload Profile Pic:</label>
                        <input 
                            type='file' 
                            name='profilePic' 
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        {profilePic && (
                            <p style={{ fontSize: '12px', marginTop: '5px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                Selected: {profilePic.name}
                            </p>
                        )}
                    </div>
                </div>

                <div className='account'>
                    <p>Already have an account?<a href='/login'>LogIn</a></p>
                </div>
                <div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </div>
            </form>

            <img src={main} alt="Main Background"/>
        </div>
    );
};

export default Signup;