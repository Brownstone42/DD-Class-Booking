import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// REPLACE WITH YOUR ACTUAL CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: 'AIzaSyAvBCPOKPQm1PIVIhqKar7bAhLlVYln-N0',
    authDomain: 'dd-tennis-booking.firebaseapp.com',
    projectId: 'dd-tennis-booking',
    storageBucket: 'dd-tennis-booking.firebasestorage.app',
    messagingSenderId: '710369615089',
    appId: '1:710369615089:web:f846a605dc2c2d2fff9d50',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

export { auth, db, googleProvider }
