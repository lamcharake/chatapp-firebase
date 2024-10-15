import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: 'reactchatapp-13562.firebaseapp.com',
  projectId: 'reactchatapp-13562',
  storageBucket: 'reactchatapp-13562.appspot.com',
  messagingSenderId: '975823518783',
  appId: '1:975823518783:web:db483ce54fbf71b0a9cc8a'
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(),
  db = getFirestore(),
  storage = getStorage()
