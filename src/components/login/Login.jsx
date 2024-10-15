import { useState } from 'react'
import './login.css'
import { toast } from 'react-toastify'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../lib/firebase'
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import upload from '../../lib/upload'

const Login = () => {
  const [avatar, setAvatar] = useState({ file: null, url: '' })

  const [loading, setLoading] = useState(false)

  const handleAvatar = (e) => {
    if (e.target.files[0]) setAvatar({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) })
  }

  const handleRegister = async (ev) => {
    ev.preventDefault()
    setLoading(true)

    const { username, fullName, email, password } = Object.fromEntries(new FormData(ev.target))

    if (!avatar.file) return toast.warn('Please upload an avatar!')

    // VALIDATING UNIQUE USERNAME
    const querySnapshot = await getDocs(query(collection(db, 'users'), where('username', '==', username)))
    if (!querySnapshot.empty) return toast.warn('Select another username')

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)

      const imgUrl = await upload(avatar.file)

      await setDoc(doc(db, 'users', res.user.uid), {
        fullName,
        username,
        email,
        avatar: imgUrl,
        id: res.user.uid,
        blocked: []
      })

      await setDoc(doc(db, 'userchats', res.user.uid), { chats: [] })

      toast.success('Account created! You can login now!')
      window.reload()
    } catch (err) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  const handleLogin = async (ev) => {
    ev.preventDefault()
    setLoading(true)

    const { email, password } = Object.fromEntries(new FormData(ev.target))

    try {
      await signInWithEmailAndPassword(auth, email, password)
      window.reload()
    } catch (err) {
      console.log(err)
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className='login'>
      <div className='item'>
        <h2>Welcome back,</h2>
        <form onSubmit={handleLogin}>
          <input type='text' placeholder='Email' name='email' />
          <input type='password' placeholder='Password' name='password' />
          <button disabled={loading}>{loading ? 'Loading' : 'Sign In'}</button>
        </form>
      </div>
      <div className='separator'></div>
      <div className='item'>
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor='file'>
            <img src={avatar.url || './avatar.png'} alt='' />
            Upload an image
          </label>
          <input type='file' id='file' style={{ display: 'none' }} onChange={handleAvatar} />
          <input type='text' placeholder='Full Name' name='fullName' />

          <input type='text' placeholder='Username' name='username' />
          <input type='text' placeholder='Email' name='email' />
          <input type='password' placeholder='Password' name='password' />
          <button disabled={loading}>{loading ? 'Loading' : 'Sign Up'}</button>
        </form>
      </div>
    </div>
  )
}

export default Login
