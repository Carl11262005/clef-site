// Expo's stock web fallback puts a text-only tab strip at the top. Keep the
// app's bottom navigation, labels and original icon sources in the browser.
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Image } from 'react-native';
import type { NativeTabsViewProps, NativeTabsViewTabItem } from 'expo-router/build/native-tabs/types';
import { useAwaitedScreensIcon } from 'expo-router/build/native-tabs/utils/icon';
function Item({tab,selected}: {tab:NativeTabsViewTabItem;selected:boolean}) {
 const icon=useAwaitedScreensIcon(selected?(tab.options.selectedIcon??tab.options.icon):tab.options.icon);
 const source=icon&&'src' in icon?icon.src:undefined;
 return <TabsTrigger className="conference-tab" value={tab.routeKey}>
  {source&&<Image source={source} style={{width:23,height:23,tintColor:selected?'#FF6F00':'#6c655d'}}/>}
  <span>{tab.options.title??tab.name}</span>
  {tab.options.badgeValue&&<span className="conference-tab-badge">{tab.options.badgeValue}</span>}
 </TabsTrigger>;
}
export function NativeTabsView({tabs,focusedIndex,onTabChange,hidden}:NativeTabsViewProps) {
 return <Tabs className="conference-tabs" value={tabs[focusedIndex].routeKey} onValueChange={onTabChange}>
  {tabs.map(tab=><TabsContent key={tab.routeKey} value={tab.routeKey} className="conference-tab-panel" forceMount>{tab.contentRenderer()}</TabsContent>)}
  {!hidden&&<TabsList className="conference-tabbar" aria-label="Main">{tabs.map((tab,index)=><Item key={tab.routeKey} tab={tab} selected={index===focusedIndex}/>)}</TabsList>}
 </Tabs>;
}
