import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, {useEffect,useRef,useState} from 'react';
import { createPortal } from 'react-dom';
import { Stack, router, usePathname, useRootNavigationState } from 'expo-router';
import { View } from 'react-native';
import { Text, PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lightTheme } from '@/lib/theme';
import { useFonts, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { useClefStore } from '@/Store';
import { useDemoStore } from '@/components/demo/demoStore';
import DemoHost from '@/components/demo/DemoHost';
import { cleanUpDemoLocalState } from '@/utils/demoCleanup';
import { endDemoForSignOut } from '@/utils/demoSession';
import { AccountType } from '@/models/AccountTypeModel';
import DemoEntry, {type DemoPersona} from './index';
import ConferenceGuide from '../guidance/ConferenceGuide';
import LoadingScreen from '@/components/LoadingScreen';
import '../guidance/guide.css';
import { setWasmUrl } from '../web-deps/node_modules/@lottiefiles/dotlottie-react';
setWasmUrl('/lottie-player.wasm');

export function ErrorBoundary() {
 return <View style={{padding:32,gap:16}}><Text variant="headlineSmall">Let’s restart the demo.</Text><Text>No real changes were made.</Text><a href="/demo/">Restart CLEF demo</a></View>;
}

export default function ConferenceLayout() {
 const [loaded,error]=useFonts({BricolageGrotesque_700Bold});
 const pathname=usePathname();
 const [persona,setPersona]=useState<DemoPersona>('musician');
 const [splashDone,setSplashDone]=useState(false);
 const active=useDemoStore(s=>s.active);
 const role=useDemoStore(s=>s.role);
 const stage=useDemoStore(s=>s.stage);
 const navigation=useRootNavigationState();
 const entered=useRef(false);
 useEffect(()=>{
  if(!active){entered.current=false;return;}
  if(!navigation?.key||entered.current)return;
  entered.current=true;
  router.replace(role==='musician'?'/(tabs)/discoverVenues':'/(tabs)/calendar');
 },[active,role,navigation?.key]);
 if(!loaded&&!error)return <main className="conference-loading" aria-label="Loading CLEF"><strong>CLEF</strong></main>;
 const reset=()=>{
  cleanUpDemoLocalState(useClefStore.getState().user?.uid,useDemoStore.getState().target);
  endDemoForSignOut();
  useClefStore.setState({user:undefined,accountType:AccountType.None});
  setPersona('musician');
  router.replace('/');
 };
 // A body portal keeps the coach card above React Native's modal host without
 // stealing vertical space from the actual product screen.
 const banner=active?createPortal(<aside className="conference-chrome" aria-label="Demo controls"><ConferenceGuide key={`${role}-${persona}`} role={role} persona={persona} stage={stage} pathname={pathname} onReset={reset}/></aside>,document.body):null;
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><PaperProvider theme={lightTheme}>
  {banner}
  <View style={{flex:1,backgroundColor:lightTheme.colors.background,maxWidth:600,width:'100%',alignSelf:'center'}}>
   {!active?<DemoEntry onStartRole={setPersona}/>:<Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:lightTheme.colors.background}}}>
    <Stack.Screen name="index"/><Stack.Screen name="(tabs)"/>
    <Stack.Screen name="venue/ApplyNightSheet" options={{presentation:'modal'}}/>
   </Stack>}
   <DemoHost/>
   {!splashDone&&createPortal(<div className="conference-splash"><LoadingScreen start onFadeComplete={()=>setSplashDone(true)}/></div>,document.body)}
  </View>
 </PaperProvider></SafeAreaProvider></GestureHandlerRootView>;
}
