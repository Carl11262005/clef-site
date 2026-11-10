import {readFileSync,writeFileSync,mkdirSync,rmSync,symlinkSync,realpathSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const repo=resolve(process.env.CLEF_APP_REPO ?? join(root,'../Clef-App'));
if(!process.env.CLEF_APP_REPO)console.log('Using sibling CLEF app checkout: '+repo);
const {commit}=JSON.parse(readFileSync(join(root,'source.json'),'utf8'));
if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('Expected a verified, full release commit.');
const archive=spawnSync('git',['archive',commit,'frontend'],{cwd:repo,maxBuffer:100*1024*1024});
if(archive.status!==0)throw new Error(archive.stderr.toString());
const destination=join(root,'.source');
rmSync(destination,{recursive:true,force:true});mkdirSync(destination,{recursive:true});
const extract=spawnSync('tar',['-x','-C',destination],{input:archive.stdout});
if(extract.status!==0)throw new Error(extract.stderr.toString());
const adaptSource=(relative,replacements)=>{
 const file=join(destination,'frontend',relative);
 let source=readFileSync(file,'utf8');
 for(const [from,to] of replacements){
  if(!source.includes(from))throw new Error(`Conference adaptation no longer matches ${relative}: ${from.slice(0,90)}`);
  source=source.replace(from,to);
 }
 writeFileSync(file,source);
};
// Same dependency lock as the release; only application source is pinned.
const modules=realpathSync(join(repo,'frontend/node_modules'));
const actualLock=readFileSync(join(repo,'frontend/package-lock.json'));
const releaseLock=readFileSync(join(destination,'frontend/package-lock.json'));
if(!actualLock.equals(releaseLock))throw new Error('Frontend dependency lock differs from the pinned release. Install matching dependencies before building.');
symlinkSync(modules,join(destination,'frontend/node_modules'),'dir');
mkdirSync(join(root,'.generated'),{recursive:true});
let welcome=readFileSync(join(destination,'frontend/app/entry/Welcome.tsx'),'utf8');
const replace=(from,to)=>{if(!welcome.includes(from))throw new Error('Welcome adaptation no longer matches release source: '+from.slice(0,70));welcome=welcome.replace(from,to);};
replace("import { useClefStore } from '@/Store';",'');
replace("import { setSeenWelcome as persistSeenWelcome } from '@/utils/identityStorage';",'');
replace("import { router } from 'expo-router';",'');
replace("from './onboardingData'","from '@/app/entry/onboardingData'");
replace("import SpringyClickView from '@/components/springy-click-view';","import SpringyClickView from '../guidance/WelcomeButton';");
replace('export default function Welcome() {', 'export default function Welcome({onContinue}:{onContinue:()=>void}) {');
replace('  const setSeenWelcome = useClefStore((state) => state.setSeenWelcome);','');
const start=welcome.indexOf('  const handleGetStarted = () => {');
const end=welcome.indexOf('\n  return (',start);
if(start<0||end<0)throw new Error('Missing welcome actions.');
welcome=welcome.slice(0,start)+'  const handleGetStarted = onContinue;\n'+welcome.slice(end);
replace('Create your profile','Explore CLEF');
replace('Where live music','Live music.');
replace('gets booked.','Less hassle.');
replace('Discover venues, book gigs, and fill your nights — artists and venues, one platform.','Discover gigs or book local talent with CLEF. Try the app in about a minute.');
const secondaryStart=welcome.indexOf('            <SpringyClickView onPress={handleSignIn}');
const secondaryEnd=welcome.indexOf('</SpringyClickView>',secondaryStart)+20;
if(secondaryStart<0||secondaryEnd<20)throw new Error('Missing welcome secondary action.');
welcome=welcome.slice(0,secondaryStart)+'            <Text style={[styles.signIn,{fontSize:12,textAlign:"center"}]}>Interactive demo · Sample data · No signup</Text>'+welcome.slice(secondaryEnd);
// Preserve released photography but serve optimized local copies, without a
// third-party request from the visitor's phone. Image failure leaves the cream backdrop.
welcome=welcome.replace(/https:\/\/images.unsplash.com\/(photo-[^?']+)\?[^']+/g,(_,id)=>'/welcome/'+id+'.webp');
replace('  Easing,','  useReducedMotion,\n  Easing,');
replace('  const loop = [...cards, ...cards];','  const reduceMotion = useReducedMotion();\n  const loop = [...cards, ...cards];');
replace('    translateY.value = withRepeat(','    if(reduceMotion)return;\n    translateY.value = withRepeat(');
replace('[translateY, totalCardHeight, durationSec, direction]','[translateY, totalCardHeight, durationSec, direction, reduceMotion]');
replace('      <View style={[StyleSheet.absoluteFill, styles.wallContainer]}>','      <View aria-hidden={true} style={[StyleSheet.absoluteFill, styles.wallContainer]}>');
writeFileSync(join(root,'.generated/Welcome.tsx'),'// Generated from source.json. Do not edit; see prepare-source.mjs.\n'+welcome);
writeFileSync(join(destination,'commit'),commit+'\n');
console.log('Prepared verified CLEF release '+commit);

// The conference root owns entry once its navigator is mounted. The native
// session's 50ms timer can run before a cold browser has mounted the tabs.
adaptSource('utils/demoSession.ts',[[
 "router.replace(role === 'musician' ? '/(tabs)/discoverVenues' : '/(tabs)/calendar');",
 '// ConferenceLayout performs the navigation-ready role handoff.'
]]);

adaptSource('components/venue/OpenNightsCalendar.tsx',[[
 `    if (open) {
        return (
            <View style={styles.cellWrap}>`,
 `    if (open) {
        return (
            <View style={styles.cellWrap}>
                {interactive && <span className="demo-date-cue" aria-hidden="true">Tap me<span>↓</span></span>}`
],[
 `                <View key={wi} style={styles.weekRow}>`,
 `                <View key={wi} style={[styles.weekRow, musicianDemo && week.some(day=>day && openDates.has(day.format(DAY_KEY)) && !applied.has(day.format(DAY_KEY))) ? {marginTop:30} : undefined]}>`
]]);

adaptSource('app/(tabs)/discoverVenues/index.tsx',[[
 'const {results,query,radiusMiles,city,ready,loading,error,placed,point,viewer,setQuery,setRadiusMiles,reload}=discovery;',
 "const {results:allResults,query,radiusMiles,city,ready,loading,error,placed,point,viewer,setQuery,setRadiusMiles,reload}=discovery;\n  const results=allResults.filter(venue=>venue.id==='demo-venue-lamplighter');"
],['radiusMiles={radiusMiles} showOwnLiveLocation={showOwnLiveLocation}','radiusMiles={2} showOwnLiveLocation={false}']]);
// Preserve the released map's closed preview on entry. The focused radius and
// single fixture above center discovery without opening an obstructing sheet.

let scaffold=readFileSync(join(destination,'frontend/app/entry/OnboardingScaffold.tsx'),'utf8');
scaffold=scaffold.replace("import SpringyClickView from '@/components/springy-click-view';","import SpringyClickView from '../guidance/WelcomeButton';")
 .replace("from './useOnboardingStepMotion'","from '@/app/entry/useOnboardingStepMotion'")
 .replace("from './onboardingFlow'","from '@/app/entry/onboardingFlow'")
 .replace("from './onboardingData'","from '@/app/entry/onboardingData'")
 .replace('testID="onboarding-continue"','testID="onboarding-continue" label={continueLabel}')
 .replace('testID="onboarding-back"','testID="onboarding-back" accessibilityRole="button" accessibilityLabel="Back"');
scaffold=scaffold.replace('<View style={styles.skipWrap}>','<View style={[styles.skipWrap, !onSkip && {display:"none"}]}>');
writeFileSync(join(root,'.generated/OnboardingScaffold.tsx'),'// Generated from source.json. Browser semantics only.\n'+scaffold);

// The conference musician path mirrors the released tutorial's conversation:
// application -> Messages -> set-time reply -> pay reply -> View terms. These
// are demo-only adaptations inside the ignored pinned-source copy. They never
// write to production services, and every replacement fails closed if the
// release source changes underneath it.
adaptSource('components/demo/demoStore.ts',[[
`  InContact = 2,
  /** The venue sent terms — an offer is waiting on "OFFER — YOUR MOVE". */
  OfferReceived = 3,
  /** The musician accepted the terms — the gig is booked. */
  Booked = 4,`,
`  InContact = 2,
  /** The musician confirmed the set time; the venue replies with sample pay. */
  TimeAgreed = 3,
  /** The venue sent terms — an offer is waiting on "OFFER — YOUR MOVE". */
  OfferReceived = 4,
  /** The musician accepted the terms — the gig is booked. */
  Booked = 5,`
]]);

adaptSource('components/demo/musicianDemoFixtures.ts',[[
`  if (stage >= MusicianDemoStage.InContact) {
    messages.push({
      _id: 'demo-venue-msg-0',
      text: "Hey! Thanks for applying — loved your profile, give us just a bit to pull the details together.",
      createdAt: new Date(Date.now() - 150_000),
      user: from,
    });
  }
  if (stage >= MusicianDemoStage.OfferReceived) {
    messages.push({
      _id: 'demo-venue-msg-1',
      text: "Just sent the details over — take a look whenever you're ready.",
      createdAt: new Date(Date.now() - 90_000),
      user: from,
    });
  }`,
`  if (stage >= MusicianDemoStage.InContact) {
    messages.push({
      _id: 'demo-venue-msg-0',
      text: "Thanks for applying! We'd love to have you. Does 9 to 11 work for your set?",
      createdAt: new Date(Date.now() - 150_000),
      user: from,
    });
  }`
]]);

adaptSource('app/(tabs)/messages/index.tsx',[[
`        demoMusicianStage === MusicianDemoStage.InContact`,
`        demoMusicianStage >= MusicianDemoStage.InContact &&
        demoMusicianStage < MusicianDemoStage.OfferReceived`
],[
`          mostRecentMessage: "Hey! Thanks for applying — loved your profile, give us just a bit to pull the details together.",`,
`          mostRecentMessage: "Thanks for applying! We'd love to have you. Does 9 to 11 work for your set?",`
]]);

adaptSource('app/venue/ApplyNightSheet.tsx',[
 ["import { DEMO_REACTION_DELAY_MS } from '@/components/demo/demoFixtures';\n",''],
 ["import { syncMusicianDemoDeal } from '@/stores/dealStore';\n",''],
 [`        useDemoStore.getState().setStage(MusicianDemoStage.Applied as number);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        emitNightApplied(venueId, date, chosenSlot ? 'listing' : 'night');
        setStep('success');
        // Two visible beats, not one jump straight to a finished offer —
        // this is the fix for applying reading as an instant booking. The
        // venue "accepts" first (In Contact: a conversation opens, nothing
        // to review yet), and only after that does it "send terms" (an
        // offer the musician has to actually accept or counter before
        // anything is booked).
        setTimeout(() => {
          if (!isOperationalSessionCurrent(session) || !isMusicianDemoActive()) return;
          useDemoStore.getState().setStage(MusicianDemoStage.InContact as number);
        }, DEMO_REACTION_DELAY_MS * 2);
        setTimeout(() => {
          if (!isOperationalSessionCurrent(session) || !isMusicianDemoActive()) return;
          useDemoStore.getState().setStage(MusicianDemoStage.OfferReceived as number);
          syncMusicianDemoDeal();
        }, DEMO_REACTION_DELAY_MS * 5);
        return;`,
`        useDemoStore.getState().setStage(MusicianDemoStage.InContact as number);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        emitNightApplied(venueId, date, chosenSlot ? 'listing' : 'night');
        router.replace({
          pathname: '/chat/[chatId]',
          params: {
            chatId: \`\${musicianUid}_\${venueId}\`,
            uid1: musicianUid,
            uid2: venueId,
            userName: venueName,
            gigDate: date,
          },
        });
        return;`]
]);

adaptSource('app/chat/[chatId].tsx',[
 ["import { isDemoActive } from '@/components/demo/demoStore';",
  "import { MusicianDemoStage, currentMusicianDemoStage, isDemoActive, isMusicianDemoActive, useDemoStore } from '@/components/demo/demoStore';"],
 ["import { useDealStore, getGigEndDateTime, formatClock } from '@/stores/dealStore';",
  "import { useDealStore, getGigEndDateTime, formatClock, syncMusicianDemoDeal } from '@/stores/dealStore';\nimport { musicianQuickReplies, musicianVenueReplyAfterMessage, nextMusicianStageAfterMessage } from 'clef-conference-musician-flow';"],
 [`  const handleSend = async () => {
    if (!canSend) return;
    const text = inputMessage.trim();`,
`  const handleSend = async (suggestedText?: string) => {
    if (!canSend) return;
    const text = (suggestedText ?? inputMessage).trim();`],
 [`    useChatStore.getState().sendMessage({
      chatId: activeChatKey,
      text,
      senderUid,
      senderRole: perspective,
      receiverUid,
      senderName: perspective === 'venue' ? (user?.venueName || user?.name || 'Venue') : rawUserName,
      avatarUrl: displayedAvatar,
    });`,
`    const sentMessage = useChatStore.getState().sendMessage({
      chatId: activeChatKey,
      text,
      senderUid,
      senderRole: perspective,
      receiverUid,
      senderName: perspective === 'venue' ? (user?.venueName || user?.name || 'Venue') : rawUserName,
      avatarUrl: displayedAvatar,
    });

    const demoTarget = useDemoStore.getState().target;
    if (isMusicianDemoActive() && demoTarget?.venueUid === receiverUid) {
      const currentStage = currentMusicianDemoStage();
      const nextStage = nextMusicianStageAfterMessage(currentStage, text);
      const venueReply = musicianVenueReplyAfterMessage(currentStage);
      if (nextStage !== currentStage && venueReply) {
        useChatStore.getState().receiveMessage(activeChatKey, {
          id: \`demo-venue-reply-\${currentStage}\`,
          text: venueReply,
          senderUid: receiverUid,
          senderRole: 'venue',
          senderName: displayedName,
          avatarUrl: displayedAvatar,
          createdAt: sentMessage.createdAt + 1,
          timeAgo: 'Just now',
          status: 'delivered',
        });
        useDemoStore.getState().setStage(nextStage as number);
        if (nextStage === MusicianDemoStage.OfferReceived) syncMusicianDemoDeal();
      }
    }`],
 [`  // A cancelled booking CLOSES the conversation. The thread is gone from both`,
`  const demoQuickReplies = isMusicianDemoActive()
    ? musicianQuickReplies(currentMusicianDemoStage())
    : [];

  // A cancelled booking CLOSES the conversation. The thread is gone from both`],
 [`          <View style={[styles.composerContainer, { backgroundColor: theme.colors.surface }]}>

            <View style={styles.composerRow}>`,
`          <View style={[styles.composerContainer, { backgroundColor: theme.colors.surface }]}>
            {demoQuickReplies.length > 0 && (
              <View style={styles.demoQuickReplyWrap}>
                <Text style={[styles.demoQuickReplyLabel, { color: theme.colors.onSurface }]}>Quick replies</Text>
                <Text style={[styles.demoQuickReplyHint, { color: theme.colors.onSurfaceVariant }]}>Tap one to send, or type your own below.</Text>
                <View style={styles.demoQuickReplyRow}>
                  {demoQuickReplies.map((reply) => (
                    <SpringyClickView key={reply} scaleEnd={0.96} onPress={() => void handleSend(reply)}>
                      <View style={[styles.demoQuickReplyChip, { backgroundColor: cardBg, borderColor: theme.colors.primary }]}> 
                        <Text style={[styles.demoQuickReplyText, { color: theme.colors.onSurface }]}>{reply}</Text>
                      </View>
                    </SpringyClickView>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.composerRow}>`],
 [`<SpringyClickView testID={managed ? 'band-chat-send' : undefined} scaleEnd={0.9} onPress={handleSend} disabled={!canSend || sending || !inputMessage.trim()}>`,
`<SpringyClickView testID={managed ? 'band-chat-send' : undefined} scaleEnd={0.9} onPress={() => void handleSend()} disabled={!canSend || sending || !inputMessage.trim()}>`],
 [`  composerContainer: {
    paddingHorizontal: 16,`,
`  demoQuickReplyWrap: {
    paddingBottom: 10,
  },
  demoQuickReplyLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  demoQuickReplyHint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
    marginBottom: 8,
  },
  demoQuickReplyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoQuickReplyChip: {
    minHeight: 44,
    maxWidth: 260,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  demoQuickReplyText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  composerContainer: {
    paddingHorizontal: 16,`]
]);

// Conference venue chat follows two visitor-sent messages before terms.
adaptSource('utils/demoSession.ts',[["import { router } from 'expo-router';","import { router } from 'expo-router';\nimport {resetVenueJourney} from 'clef-conference-musician-flow';"],["  const revision = ++navigationRevision;","  resetVenueJourney();\n  const revision = ++navigationRevision;"]]);
adaptSource('app/chat/[chatId].tsx',[
 ["import { musicianQuickReplies, musicianVenueReplyAfterMessage, nextMusicianStageAfterMessage }", "import { useVenueJourney, venueQuickReplies, venueArtistReply, musicianQuickReplies, musicianVenueReplyAfterMessage, nextMusicianStageAfterMessage }"],
 ["  const handleConfirmBooking = () => {", "  const venueMessages=useVenueJourney(s=>s.messages);\n  const venueDemo=isDemoActive() && musicianUid==='demo-act-copper-hollow';\n  const handleConfirmBooking = () => {\n    if(venueDemo && useVenueJourney.getState().messages<2)return;"],
 ["  const dealBtnInfo = (() => {", "  const dealBtnInfo = (() => {\n    if(venueDemo && venueMessages<2)return null;"],
 ["    const demoTarget = useDemoStore.getState().target;", "    if(isDemoActive() && receiverUid==='demo-act-copper-hollow' && useVenueJourney.getState().messages<2){\n      const count=useVenueJourney.getState().messages;\n      useChatStore.getState().receiveMessage(activeChatKey,{id:`demo-act-reply-${count}`,text:venueArtistReply(count),senderUid:receiverUid,senderRole:'musician',senderName:displayedName,createdAt:sentMessage.createdAt+1,timeAgo:'Just now',status:'delivered'});\n      useVenueJourney.setState({messages:count+1});\n    }\n    const demoTarget = useDemoStore.getState().target;"],
 ["? musicianQuickReplies(currentMusicianDemoStage())\n    : [];", "? musicianQuickReplies(currentMusicianDemoStage())\n    : venueDemo ? venueQuickReplies(venueMessages) : [];"]
]);
adaptSource('components/deal/DealScreen.tsx',[
 ["import { DemoStage, useDemoStore }", "import {useVenueJourney} from 'clef-conference-musician-flow';\nimport { DemoStage, useDemoStore }"],
 ["if (useDemoStore.getState().active && threadId === DEMO_ACT_UID) {", "if (useDemoStore.getState().active && threadId === DEMO_ACT_UID) {\n              if(useVenueJourney.getState().messages<2)return;\n              useVenueJourney.setState({termsSent:true});"]
]);

adaptSource('components/deal/DealScreen.tsx',[["              setTimeout(() => {\n                if (!useDemoStore.getState().active) return;\n                useDealStore.getState().setDeals({\n                  ...useDealStore.getState().deals,\n                  [threadId]: {\n                    ...useDealStore.getState().deals[threadId],\n                    ...builtDeal,\n                    status: 'confirmed',\n                    counterHistory: [],\n                    confirmedAt: new Date().toISOString(),\n                  },\n                });\n                useDemoStore.getState().setStage(DemoStage.Confirmed);\n              }, DEMO_REACTION_DELAY_MS);\n","              // Completion means locally sent terms, not an artist acceptance.\n"]]);

adaptSource('components/deal/DealWizard.tsx',[
 ["import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\nimport {useVenueJourney} from 'clef-conference-musician-flow';\nimport {isDemoActive} from '@/components/demo/demoStore';"],
 ["  const [step, setStep] = useState(1);", "  const [step, setStep] = useState(1);\n  useEffect(()=>{if(!isDemoActive())return;useVenueJourney.setState({wizardStep:step});return()=>{useVenueJourney.setState({wizardStep:0});};},[step]);"]
]);

adaptSource('app/chat/[chatId].tsx',[["if (openDealFlow === 'true') {", "if (openDealFlow === 'true' && (!isDemoActive() || useVenueJourney.getState().messages >= 2)) {"]]);

adaptSource('app/(tabs)/calendar/components/MonthGrid.tsx',[[
 '<View key={wi} style={styles.weekRow}>',
 '<View key={wi} style={[styles.weekRow, demoTargetDayKey && week.some(day=>day?.key===demoTargetDayKey) ? {marginTop:34} : undefined]}>'
]]);

// Give canvas-only sample pins a real accessible target for the Discover cue.
adaptSource('app/chat/[chatId].tsx',[["<View style={styles.demoQuickReplyRow}>","<View testID={isMusicianDemoActive() ? 'demo-performer-replies' : undefined} style={styles.demoQuickReplyRow}>"]]);
adaptSource('app/pipeline.tsx',[
 ["{firstName} is now in your inbox. Keep chatting there to work out the details and lock in the booking.","{item.name} is now in your messages. Open this conversation, send two replies, then set the booking terms."],
 [">Continue</Text>",">Open conversation</Text>"],
 ["                            return;\n                        }\n\n                        const target = acceptTarget;","                            if (acceptTarget) handleChatPress(acceptTarget);\n                            return;\n                        }\n\n                        const target = acceptTarget;"]
]);
adaptSource('app/chat/[chatId].tsx',[
 [">Quick replies</Text>",">Your next reply · not sent</Text>"],
 ["Tap one to send, or type your own below.","Tap a reply to send it, or type below."],
 ["            {demoQuickReplies.length > 0 && (","            {(isMusicianDemoActive() || venueDemo) && <View testID=\"demo-chat-directions\" style={{flexDirection:'row',justifyContent:'space-between',paddingBottom:8}}><Text style={{fontSize:11,color:theme.colors.onSurfaceVariant}}>← Sample replies</Text><Text style={{fontSize:11,color:theme.colors.onSurfaceVariant}}>Your sent messages →</Text></View>}\n            {demoQuickReplies.length > 0 && ("],
 ["<View style={styles.demoQuickReplyWrap}>","<View testID=\"demo-suggested-replies\" style={styles.demoQuickReplyWrap}>"],
 ["<Text style={[styles.demoQuickReplyText, { color: theme.colors.onSurface }]}>{reply}</Text>","<Text style={[styles.demoQuickReplyText, { color: theme.colors.onSurface }]}>{reply}</Text><Text style={{fontSize:11,fontWeight:'700',color:theme.colors.primary,marginTop:4}}>Tap to send ↗</Text>"]
]);
adaptSource('app/profile/OwnerProfile.tsx',[["<View style={styles.socialGrid}>","<View testID=\"demo-profile-socials\" style={styles.socialGrid}>"],["style={[styles.socialCard, { backgroundColor: color }]}","testID=\"demo-profile-social-card\" style={[styles.socialCard, { backgroundColor: color, width:'100%', minHeight:76 }]}"]]);
adaptSource('app/chat/[chatId].tsx',[["style={styles.confirmBookingBtn}\n              >","testID={dealBtnInfo.label === 'View terms' ? 'demo-view-terms-cue' : undefined}\n                style={styles.confirmBookingBtn}\n              >"]]);
adaptSource('app/(tabs)/discoverVenues/components/DiscoverVenueMap.tsx',[["<View style={[styles.cta, { backgroundColor: tokens.accent }]}","<View testID=\"demo-discover-profile-action\" style={[styles.cta, { backgroundColor: tokens.accent }]}"]]);
adaptSource('app/(tabs)/discoverVenues/components/DiscoverVenueMap.tsx',[
 ["markers.filter((marker) => marker.photoUri && !failedPhotoIds.has(marker.id)).map((marker) => (", "markers.map((marker) => ("],
 ["              <View\n                style={[\n                  styles.markerRing,", "              {marker.photoUri && !failedPhotoIds.has(marker.id) ? <View\n                style={[\n                  styles.markerRing,"],
 ["              </View>\n            </Marker>", "              </View> : <View style={{width:48,height:48}} />}\n            </Marker>"]
]);
// Keep conference Discover controls compact and preview bounded to its map.
adaptSource("app/(tabs)/discoverVenues/index.tsx",[["header:{paddingHorizontal:20,paddingTop:10,paddingBottom:2}", "header:{paddingHorizontal:20,paddingTop:4,paddingBottom:0}"], ["title:{fontSize:32", "title:{fontSize:28"], [":view==='map'?<View style={{flex:1}}>", ":view==='map'?<View testID=\"demo-discover-map-region\" style={{flex:1,minHeight:0,overflow:'hidden'}}>"]]);
adaptSource("app/(tabs)/discoverVenues/components/VenueDiscoveryControls.tsx",[["  const [draft, setDraft] = useState(radiusMiles);", "  const [draft, setDraft] = useState(radiusMiles);\n  const [filtersOpen,setFiltersOpen]=useState(false);"], ["<View style={styles.rangeHeading}>", "<Pressable style={[styles.rangeHeading,{minHeight:44}]} accessibilityRole=\"button\" accessibilityLabel=\"Distance filters\" accessibilityState={{expanded:filtersOpen}} onPress={()=>setFiltersOpen(value=>!value)}>"], ["Within {draft} miles of {city}", "Within {draft} miles of {city}"], ["            {draft} mi\n", "Distance {filtersOpen ? '\u2212' : '+'}"], ["      </View>\n      <ScrollView", "      </Pressable>\n      {filtersOpen && <View>\n      <ScrollView"], ["      </View>\n    </View>\n  );", "      </View>\n      </View>}\n    </View>\n  );"], ["marginTop: 12,", "marginTop: 4,"]]);
adaptSource("app/(tabs)/discoverVenues/components/DiscoverVenueMap.tsx",[["  const [selectedId, setSelectedId]", "  const [mapHeight,setMapHeight]=useState(0);\n  const [selectedId, setSelectedId]"], ["<View style={styles.mapWrap}>", "<View testID=\"demo-map-bounds\" style={styles.mapWrap} onLayout={event=>setMapHeight(event.nativeEvent.layout.height)}>"], ["<View style={[styles.detail, embedded && styles.embeddedDetail, { backgroundColor:", "<View testID=\"demo-venue-preview\" style={[styles.detail, {maxHeight:Math.max(0,mapHeight-(embedded?24:100))}, embedded && styles.embeddedDetail, { backgroundColor:"], ["            <Pressable\n              onPress={openSelectedProfile}", "            <ScrollView style={{minHeight:0}} contentContainerStyle={{padding:15}} keyboardShouldPersistTaps=\"handled\">\n            <Pressable\n              onPress={openSelectedProfile}"], ["            </Pressable>\n          </View>\n        ) : null}", "            </Pressable>\n            </ScrollView>\n          </View>\n        ) : null}"], ["root: { flex: 1 },", "root: { flex: 1, minHeight:0, overflow:'hidden' },"], ["mapWrap: { flex: 1, overflow: 'hidden' },", "mapWrap: { flex: 1, minHeight:0, overflow: 'hidden' },"], ["borderWidth: 1, padding: 15, shadowColor:", "borderWidth: 1, padding: 0, overflow:'hidden', shadowColor:"], ["bottom: 100, left: 14", "bottom: 88, left: 14"]]);

adaptSource("components/deal/DealWizard.tsx",[["<View style={styles.root}>", "<View testID=\"demo-terms-wizard\" style={styles.root}>"], ["      <View\n        style={[\n          styles.footer,", "      <View testID=\"demo-terms-footer\"\n        style={[\n          styles.footer,"], ["        style={styles.scroll}", "        testID=\"demo-terms-content\" style={styles.scroll}"], ["{calendarContext ? <Text style=", "{calendarContext && step!==7 ? <Text testID=\"demo-terms-context\" style="]]);

adaptSource("components/deal/DealComponents.tsx",[["        style={[shStyles.iconBox,", "        testID=\"demo-terms-step-icon\" style={[shStyles.iconBox,"], ["<Text style={[shStyles.title,", "<Text testID=\"demo-terms-step-title\" style={[shStyles.title,"], ["<View style={shStyles.childWrap}>", "<View testID=\"demo-terms-step-content\" style={shStyles.childWrap}>"]]);

adaptSource("components/deal/DealSummary.tsx",[["    <View\n      style={[\n        styles.card,", "    <View testID=\"demo-terms-summary\"\n      style={[\n        styles.card,"], ["          key={r.label}", "          testID=\"demo-terms-summary-row\" key={r.label}"]]);

adaptSource("components/deal/DealScreen.tsx",[["style={[hStyles.header,", "testID=\"demo-terms-header\" style={[hStyles.header,"]]);
adaptSource("components/deal/DealWizard.tsx",[
 ["useEffect, useState", "useEffect, useRef, useState"],
 ["  const [step, setStep] = useState(1);", "  const [step, setStep] = useState(1);\n  const scrollRef=useRef<ScrollView>(null);\n  useEffect(()=>{scrollRef.current?.scrollTo({y:0,animated:false});},[step]);"],
 ["      <ScrollView\n", "      <ScrollView ref={scrollRef}\n"],
 ["calendarContext && step!==7", "calendarContext && step!==7 && step!==6"],
 ["This set time is already filled in for the proposal.", "Included in your proposal."]
]);
