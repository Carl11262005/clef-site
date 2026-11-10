import React,{type PropsWithChildren} from 'react';
import {View,type StyleProp,type ViewStyle} from 'react-native';
import SpringyClickView from '@/components/springy-click-view';
// Preserve the released spring interaction, adding browser keyboard semantics.
export default function WelcomeButton({children,onPress,style,testID,scaleEnd,disabled,label='Explore CLEF'}:{children?:PropsWithChildren['children'];onPress?:()=>void;disabled?:boolean;label?:string;style?:StyleProp<ViewStyle>;testID?:string;scaleEnd?:number}){
 return <div className="welcome-button" role="button" aria-label={label} aria-disabled={disabled} tabIndex={disabled?-1:0} onKeyDown={event=>{if(!disabled&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onPress?.();}}}><SpringyClickView disabled={disabled} onPress={onPress} scaleEnd={scaleEnd} testID={testID}><View style={style}>{children}</View></SpringyClickView></div>;
}
