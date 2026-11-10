import React,{useEffect,useRef,useState} from 'react';
import {Pressable,StyleSheet,View} from 'react-native';
import {Text} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import OnboardingScaffold from '../.generated/OnboardingScaffold';
import {OB_THEME} from '@/app/entry/onboardingData';
import {BRAND_GRADIENT} from '@/lib/theme';
import {useClefStore} from '@/Store';
import {startDemo} from '@/utils/demoSession';
import {AccountType} from '@/models/AccountTypeModel';
import {DEMO_ACT_PROFILE} from '@/components/demo/demoFixtures';
import Welcome from '../.generated/Welcome';
import {venueProfile} from '../adapters/transport';
import '../guidance/entry.css';

export type DemoPersona='musician'|'band'|'venue';
const options=[{role:'musician',label:'Musician',sub:'Find venues and apply for open nights.',icon:'music',perks:['Discover venues','Apply to play']},{role:'band',label:'Band',sub:'Find venues and fill your calendar together.',icon:'account-group',perks:['One profile for the group','Apply as a band']},{role:'venue',label:'Venue',sub:'Open dates and connect with local artists.',icon:'storefront-outline',perks:['Open a date','Review applicants']}] as const;
const paths={musician:['Find a venue','Choose a night & apply','Chat & review terms'],band:['Find a venue','Choose a night & apply','Chat & review terms'],venue:['Open a date','Review an artist','Chat & send terms']} as const;
const stepIcons={musician:['map-marker-outline','calendar-check-outline','message-text-outline'],band:['map-marker-outline','calendar-check-outline','message-text-outline'],venue:['calendar-plus','account-music-outline','file-document-check-outline']} as const;
export default function DemoEntry({onStartRole}:{onStartRole:(role:DemoPersona)=>void}){
 const [step,setStep]=useState(0);
 const [role,setRole]=useState<DemoPersona|null>(null);
 const [failed,setFailed]=useState(false);
 const container=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(step>0)container.current?.focus({preventScroll:true});},[step]);
 const enter=()=>{
  if(!role)return;
  setFailed(false);
  try{const isVenue=role==='venue';onStartRole(role);useClefStore.setState({user:isVenue?venueProfile():{...DEMO_ACT_PROFILE,uid:'demo-conference-musician',latitude:40.4406,longitude:-79.9959,ageVerified:true},accountType:isVenue?AccountType.Venue:role==='band'?AccountType.Band:AccountType.Musician,seenWelcome:true,isSplashOutroActive:false,onboarding:{},isDarkMode:false});startDemo(isVenue?'venue':'musician');}catch{setFailed(true);}
 };
 if(step===0)return <div className="released-welcome"><Welcome onContinue={()=>setStep(1)}/></div>;
 return <div className="released-entry" ref={container} tabIndex={-1} role="region" aria-label={step===1?'Step 1 of 2: Choose your side':'Step 2 of 2: Try the app'}>
  <OnboardingScaffold progress={step/2} onBack={()=>setStep(step-1)} eyebrow={step===1?'Step 1 of 2 · Choose your side':'Step 2 of 2 · You’re ready'} title={step===1?'What brings you here?':role==='venue'?'Fill your next open night.':role==='band'?"Find your band’s next stage.":'Find your next stage.'} subtitle={step===1?'Try either side of CLEF. You can switch anytime.':'Three steps. About a minute.'} continueLabel={step===1?'Continue':'Start exploring'} onContinue={step===1?()=>setStep(2):enter} continueDisabled={!role} footnote={<Text style={styles.disclosure}>Sample demo · No signup · No real changes</Text>}>
   {step===1?<View style={styles.roleStack}>{options.map(item=>{const selected=role===item.role;return <Pressable key={item.role} accessibilityRole="radio" accessibilityState={{checked:selected}} accessibilityLabel={item.label} onPress={()=>setRole(item.role)} style={[styles.roleCard,{borderWidth:selected?2:1,borderColor:selected?OB_THEME.orange:OB_THEME.outlineVariant}]}><LinearGradient colors={selected?BRAND_GRADIENT:['#FFF1E0','#FFE0B7']} style={styles.iconHeader}><MaterialCommunityIcons name={item.icon} size={30} color={selected?'#fff':OB_THEME.orange}/></LinearGradient><View style={styles.cardBody}><View style={styles.titleRow}><View style={{flex:1}}><Text style={styles.cardTitle}>{item.label}</Text><Text style={styles.cardSub}>{item.sub}</Text></View><View style={[styles.radio,{borderColor:selected?OB_THEME.orange:OB_THEME.outline}]}>{selected&&<View style={styles.radioDot}/>}</View></View><View style={styles.perks}>{item.perks.map(perk=><View key={perk} style={styles.perk}><MaterialCommunityIcons name="check" size={11} color={OB_THEME.orangeText}/><Text style={styles.perkText}>{perk}</Text></View>)}</View></View></Pressable>;})}</View>:<View style={styles.readyStack}>
    <View testID="demo-entry-steps" style={styles.instructions}>{paths[role??'musician'].map((title,index)=><View key={title} style={[styles.instruction,index>0&&styles.instructionDivider]}><View style={styles.stepIcon} accessible={false}><MaterialCommunityIcons name={stepIcons[role??'musician'][index]} size={26} color={OB_THEME.orangeText}/><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{index+1}</Text></View></View><Text style={[styles.cardTitle,{flex:1,fontSize:17,lineHeight:23}]}>{title}</Text></View>)}</View>
    <View style={styles.tip}><MaterialCommunityIcons name="gesture-tap" size={22} color={OB_THEME.orangeText}/><Text style={styles.tipText}>Follow the “Tap me” hints. Explore at your own pace.</Text></View>
    {failed&&<Text accessibilityRole="alert">The demo couldn’t open. Please try again.</Text>}
   </View>}
  </OnboardingScaffold>
 </div>;
}
// Role-card geometry and typography follow released entry/RoleSelect.tsx.
const styles=StyleSheet.create({
 roleStack:{gap:12},readyStack:{gap:14},roleCard:{minHeight:112,flexDirection:'row',alignItems:'stretch',borderRadius:20,overflow:'hidden',backgroundColor:OB_THEME.card,boxShadow:'0 3px 12px rgba(139,105,20,.07)'},iconHeader:{width:74,alignItems:'center',justifyContent:'center'},cardBody:{flex:1,paddingVertical:14,paddingHorizontal:15,gap:9,justifyContent:'center'},titleRow:{flexDirection:'row',alignItems:'center',gap:10},cardTitle:{fontSize:18,fontWeight:'800',letterSpacing:-.35,color:OB_THEME.onSurface},cardSub:{fontSize:12.5,fontWeight:'500',marginTop:2,lineHeight:17,color:OB_THEME.onSurfaceVariant},radio:{width:22,height:22,borderRadius:11,borderWidth:2,alignItems:'center',justifyContent:'center'},radioDot:{width:10,height:10,borderRadius:5,backgroundColor:OB_THEME.orange},perks:{flexDirection:'row',flexWrap:'wrap',gap:5},perk:{flexDirection:'row',alignItems:'center',gap:3,paddingVertical:4,paddingHorizontal:7,borderRadius:9,backgroundColor:'#FFF8EE'},perkText:{fontSize:10.5,fontWeight:'700',color:OB_THEME.orangeText},disclosure:{fontSize:11,lineHeight:15,textAlign:'center',color:OB_THEME.onSurfaceVariant,marginBottom:6},instructions:{borderRadius:22,borderWidth:1,borderColor:OB_THEME.outlineVariant,backgroundColor:'white',paddingHorizontal:18,paddingVertical:4},instruction:{flexDirection:'row',alignItems:'center',gap:18,paddingVertical:18,minHeight:84},instructionDivider:{borderTopWidth:1,borderTopColor:'#F2E9DE'},stepIcon:{width:48,height:48,borderRadius:16,backgroundColor:OB_THEME.primaryContainer,alignItems:'center',justifyContent:'center'},stepBadge:{position:'absolute',right:-5,bottom:-3,width:20,height:20,borderRadius:10,backgroundColor:OB_THEME.orangeText,borderWidth:2,borderColor:'white',alignItems:'center',justifyContent:'center'},stepBadgeText:{fontSize:10,fontWeight:'800',color:'white'},number:{width:28,height:28,borderRadius:14,backgroundColor:OB_THEME.primaryContainer,alignItems:'center',justifyContent:'center'},numberText:{fontSize:12,fontWeight:'800',color:OB_THEME.onPrimaryContainer},tip:{flexDirection:'row',alignItems:'flex-start',gap:9},tipText:{fontSize:12.5,lineHeight:18,color:OB_THEME.onSurfaceVariant,flex:1},safety:{fontSize:11.5,lineHeight:17,color:OB_THEME.onSurfaceVariant},
});
