import React, { useState, useEffect } from 'react'
import main from "../Images/main.jpg"
import Navbar from './Navbar'
import { useNavigate } from 'react-router-dom'

const Signup = () => {
    const navigate = useNavigate()
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        roleName: "User"
    })
    
    const [profilePic, setProfilePic] = useState(null)
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Fetch roles on component mount
    useEffect(() => {
        fetchRoles()
    }, [])

    const fetchRoles = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/roles')
            if (response.ok) {
                const data = await response.json()
                setRoles(data)
            }
        } catch (err) {
            console.error('Error fetching roles:', err)
        }
    }

    const handleInput = (event) => {
        const name = event.target.name
        const value = event.target.value
        setFormData({ ...formData, [name]: value })
        setError('')
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB')
                setProfilePic(null)
                return
            }
            setProfilePic(file)
            setError('')
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            if (!formData.email || !formData.name || !formData.password) {
                setError("Please enter all details!")
                setLoading(false)
                return
            }

            // Create FormData for file upload
            const data = new FormData()
            data.append('name', formData.name)
            data.append('email', formData.email)
            data.append('password', formData.password)
            data.append('roleName', formData.roleName)
            
            if (profilePic) {
                data.append('profilePicture', profilePic)
            }

            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                body: data
            })

            const result = await response.json()

            if (response.ok) {
                setSuccess('Sign up successful! Redirecting...')
                console.log("User registered:", result.user)
                
                setFormData({ name: "", email: "", password: "", roleName: "User" })
                setProfilePic(null)
                
                setTimeout(() => {
                    navigate("/login")
                }, 2000)
            } else {
                setError(result.message || 'Sign up failed')
            }
        } catch (err) {
            console.error('Error during signup:', err)
            setError('Network error. Please check your connection.')
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <div>
            <Navbar/>
            <div className='main-page'>
                <form onSubmit={handleSubmit}>
                    <div>
                        <p className='heading'>Sign Up</p>
                    </div>

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

                    <div className='account'>
                        <input 
                            type='text' 
                            placeholder='Name' 
                            name="name" 
                            value={formData.name}
                            onChange={handleInput}
                            disabled={loading}
                        />
                        <input 
                            type='email' 
                            placeholder='Email' 
                            name="email" 
                            value={formData.email}
                            onChange={handleInput}
                            disabled={loading}
                        />
                        <input 
                            type='password' 
                            placeholder='Password' 
                            name="password" 
                            value={formData.password}
                            onChange={handleInput}
                            disabled={loading}
                        />
                        
                        <div style={{ margin: '15px 0' }}>
                            <label style={{ marginRight: '10px', display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', fontWeight: '500' }}>Role:</label>
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

                        <div style={{ margin: '15px 0' }}>
                            <label style={{ marginRight: '10px', display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', fontWeight: '500' }}>Profile Picture:</label>
                            <input 
                                type='file' 
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

                        <p>Already have an account <a href='/login'>Login</a></p>
                    </div>
                    <button disabled={loading}>
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
                <img src={main} alt="main"/>
            </div>
        </div>
    )
}

export default Signup;