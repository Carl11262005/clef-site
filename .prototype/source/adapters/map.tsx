// Browser implementation of the native MapLibre surface used by CLEF.
// The real DiscoverVenueMap owns the style, feature data and interactions.
import React, { createContext, useContext, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { createPortal } from 'react-dom';
import type { Map as WebMap, MapMouseEvent, GeoJSONSource as WebSource, StyleSpecification, LayerSpecification, LngLatLike, EaseToOptions, AnimationOptions, FitBoundsOptions } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import { maplibregl } from './mapRuntime';
import '../web-deps/node_modules/maplibre-gl/dist/maplibre-gl.css';
const MapContext = createContext<WebMap | null>(null);
const SourceContext = createContext('');
type CameraProps = { initialViewState?: { center: LngLatLike; zoom: number }; minZoom?: number; maxZoom?: number; maxBounds?: [number, number, number, number] };
type MapProps = React.PropsWithChildren<{
 style?: StyleProp<ViewStyle>; mapStyle: StyleSpecification; dragPan?: boolean;
 onWillStartLoadingMap?: () => void; onDidFinishLoadingMap?: () => void;
 onDidFailLoadingMap?: () => void; onPress?: () => void;
 onRegionDidChange?: (event: {nativeEvent: {zoom: number}}) => void;
}>;
export function Map(props: MapProps) {
 const container = useRef<HTMLDivElement>(null);
 const [map, setMap] = useState<WebMap | null>(null);
 const callbacks = useRef(props); callbacks.current = props;
 useEffect(() => {
  if (!container.current) return;
  callbacks.current.onWillStartLoadingMap?.();
  const camera = React.Children.toArray(props.children).find(child => React.isValidElement<CameraProps>(child) && child.type === Camera);
  const initial = React.isValidElement<CameraProps>(camera) ? camera.props.initialViewState : undefined;
  let instance: WebMap;
  try {
   instance = new maplibregl.Map({container:container.current,style:props.mapStyle,center:initial?.center ?? [-79.9959,40.4406],zoom:initial?.zoom ?? 11.5,dragPan:props.dragPan !== false,dragRotate:false,attributionControl:{compact:true},touchPitch:false});
  } catch { callbacks.current.onDidFailLoadingMap?.(); return; }
  const timeout = setTimeout(() => callbacks.current.onDidFailLoadingMap?.(), 12000);
  const resize = new ResizeObserver(() => instance.resize()); resize.observe(container.current);
  instance.on('load', () => {clearTimeout(timeout);setMap(instance);callbacks.current.onDidFinishLoadingMap?.();});
  instance.on('error', () => callbacks.current.onDidFailLoadingMap?.());
  instance.on('moveend', () => callbacks.current.onRegionDidChange?.({nativeEvent:{zoom:instance.getZoom()}}));
  instance.on('click', event => {if (!event.originalEvent?.cancelBubble) callbacks.current.onPress?.();});
  return () => {clearTimeout(timeout);resize.disconnect();instance.remove();};
  // A native map retains its initial camera/style for this mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);
 return <View style={[props.style,{overflow:'hidden'}]}><div ref={container} style={{position:'absolute',inset:0}}/><MapContext.Provider value={map}>{props.children}</MapContext.Provider></View>;
}
export const Camera = forwardRef(function Camera(props: CameraProps, ref: React.ForwardedRef<{easeTo: (options: EaseToOptions) => void; zoomTo: (zoom:number, options?:AnimationOptions) => void; fitBounds:(bounds:[number,number,number,number],options?:FitBoundsOptions)=>void}>) {
 const map = useContext(MapContext);
 useImperativeHandle(ref, () => ({fitBounds:([w,s,e,n],options)=>{map?.fitBounds([[w,s],[e,n]],options);},easeTo:options=>{map?.easeTo(options);},zoomTo:(zoom,options)=>{map?.zoomTo(zoom,options);}}), [map]);
 const {minZoom,maxZoom,maxBounds}=props;
 useEffect(() => {
  if (!map) return;
  if (minZoom != null) map.setMinZoom(minZoom);
  if (maxZoom != null) map.setMaxZoom(maxZoom);
  if (maxBounds) {const [w,s,e,n]=maxBounds;map.setMaxBounds([[w,s],[e,n]]);}
 }, [map,minZoom,maxZoom,maxBounds]);
 return null;
});
type SourceProps = React.PropsWithChildren<{id:string;data:FeatureCollection;onPress?:(event:{stopPropagation:()=>void;nativeEvent:{features:ReturnType<WebMap['queryRenderedFeatures']>}})=>void}>;
export function GeoJSONSource(props: SourceProps) {
 const map=useContext(MapContext); const [ready,setReady]=useState(false); const latest=useRef(props); latest.current=props;
 const id=props.id;
 useEffect(() => {
  if (!map) return;
  if (!map.getSource(id)) map.addSource(id,{type:'geojson',data:latest.current.data});
  setReady(true);
  const handle=(event:MapMouseEvent)=>{
   const layers=map.getStyle().layers.filter(layer=>'source' in layer&&layer.source===id).map(layer=>layer.id);
   const features=map.queryRenderedFeatures([[event.point.x-24,event.point.y-24],[event.point.x+24,event.point.y+24]],{layers});
   if (features.length) {event.originalEvent.stopPropagation();latest.current.onPress?.({stopPropagation:()=>{},nativeEvent:{features}});}
  };
  map.on('click',handle);
  return ()=>{map.off('click',handle);};
 },[map,id]);
 useEffect(()=>{if(ready)map?.getSource<WebSource>(id)?.setData(props.data);},[map,ready,id,props.data]);
 return ready?<SourceContext.Provider value={id}>{props.children}</SourceContext.Provider>:null;
}
export function Layer(props: LayerSpecification) {
 const map=useContext(MapContext); const source=useContext(SourceContext); const latest=useRef(props);latest.current=props;
 const id=props.id;
 useEffect(()=>{
  if(!map||!source)return;
  map.addLayer({...latest.current,source} as LayerSpecification);
  return()=>{if(map.style&&map.getLayer(id))map.removeLayer(id);};
 },[map,source,id]);
 return null;
}
export function Marker(props: React.PropsWithChildren<{lngLat:LngLatLike;accessibilityRole?:React.AriaRole;accessibilityLabel?:string;onPress?:()=>void}>) {
 const map=useContext(MapContext); const [element]=useState(()=>document.createElement('div')); const {lngLat}=props;
 useEffect(()=>{if(!map)return;const marker=new maplibregl.Marker({element}).setLngLat(lngLat).addTo(map);return()=>{marker.remove();};},[map,element,lngLat]);
 return createPortal(<div role={props.accessibilityRole} aria-label={props.accessibilityLabel} tabIndex={props.onPress?0:undefined} onKeyDown={event=>{if(props.onPress&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.currentTarget.click();}}} onClick={props.onPress}>{props.children}</div>,element);
}
