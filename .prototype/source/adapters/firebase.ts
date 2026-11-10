// No Firebase SDK or backend is initialized in the conference bundle.
import { useClefStore } from '@/Store';
const denied = () => { throw new Error('This action is unavailable in the local conference demo.'); };
const demoUser = { get uid() { return useClefStore.getState().user?.uid ?? 'demo-conference-musician'; }, getIdToken: async () => 'local-demo-no-credential', emailVerified: true, providerData: [] };
export const auth = { currentUser: demoUser };
export const firestore = {};
export const storage = {};
export const getAuth = () => auth;
export const onAuthStateChanged = (_auth: unknown, callback: (user: unknown)=>void) => { let active=true; queueMicrotask(()=>{if(active) callback(demoUser);}); return ()=>{active=false;}; };
export const onIdTokenChanged = onAuthStateChanged;
export const collection = (...args: unknown[]) => ({args});
export const doc = collection;
export const query = collection;
export const where = collection;
export const orderBy = collection;
export const limit = collection;
export const startAfter = collection;
export const documentId = ()=>'id';
const emptySnapshot = {docs: [], empty:true, size:0, exists:()=>false, data:()=>undefined, forEach:()=>{}, docChanges:()=>[]};
export const onSnapshot = (_ref:unknown, callback:(snapshot:unknown)=>void) => { let active=true; queueMicrotask(()=>{if(active) callback(emptySnapshot);}); return ()=>{active=false;}; };
export const getDoc = async()=>emptySnapshot;
export const getDocs = getDoc;
export const serverTimestamp = ()=>new Date();
export class Timestamp { constructor(public seconds:number,public nanoseconds:number=0){} toMillis(){return this.seconds*1000+this.nanoseconds/1e6;} toDate(){return new Date(this.toMillis());} static now(){return Timestamp.fromMillis(Date.now());} static fromMillis(ms:number){return new Timestamp(Math.floor(ms/1000),(ms%1000)*1e6);} static fromDate(d:Date){return Timestamp.fromMillis(d.getTime());} }
export const setDoc=denied, updateDoc=denied, deleteDoc=denied, addDoc=denied, writeBatch=denied, runTransaction=denied;
export const ref=collection, uploadBytes=denied, uploadBytesResumable=denied, deleteObject=denied, getDownloadURL=denied;
export const signOut=denied, signInWithEmailAndPassword=denied, createUserWithEmailAndPassword=denied, signInWithCredential=denied, sendEmailVerification=denied, sendPasswordResetEmail=denied, updatePassword=denied, updateEmail=denied, deleteUser=denied, reload=denied, reauthenticateWithCredential=denied, linkWithCredential=denied, signInWithPopup=denied, signInAnonymously=denied, fetchSignInMethodsForEmail=denied;
export const GoogleAuthProvider={credential:denied}, OAuthProvider=class{}, EmailAuthProvider={credential:denied};
