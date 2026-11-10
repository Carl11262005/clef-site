const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const frontend = path.resolve(__dirname,'.source/frontend');
const modules = require('fs').realpathSync(path.join(frontend,'node_modules'));
const config = getDefaultConfig(__dirname);
config.watchFolders = [frontend,modules];
config.resolver.nodeModulesPaths = [path.join(frontend,'node_modules'), path.join(__dirname,'web-deps/node_modules')];
const aliases = {
 'axios': 'transport.ts',
 '@expo/ui/datetimepicker': 'timePicker.tsx',
 'firebase/auth': 'firebase.ts',
 'firebase/firestore': 'firebase.ts',
 'firebase/storage': 'firebase.ts',
 '@maplibre/maplibre-react-native': 'map.tsx',
 '@stripe/stripe-react-native': 'unavailable.tsx',
 '@stripe/stripe-identity-react-native': 'unavailable.tsx',
 '@react-native-google-signin/google-signin': 'unavailable.tsx',
};
config.resolver.resolveRequest = (context, moduleName, platform) => {
 if (platform !== 'web') throw new Error('The conference build is web-only.');
 if(moduleName==='@radix-ui/react-tabs')return context.resolveRequest(context,path.join(frontend,'node_modules/expo-router/node_modules/@radix-ui/react-tabs'),platform);
 if(moduleName==='react-dom')return context.resolveRequest(context,path.join(frontend,'node_modules/react-dom'),platform);
 if(moduleName==='react'||moduleName.startsWith('react/'))return context.resolveRequest(context,path.join(frontend,'node_modules',moduleName),platform);
 if(moduleName==='clef-conference-musician-flow')return {type:'sourceFile',filePath:path.join(__dirname,'guidance/musicianFlow.ts')};
 if (aliases[moduleName]) return {type:'sourceFile',filePath:path.join(__dirname,'adapters',aliases[moduleName])};
 const resolved = context.resolveRequest(context,moduleName.startsWith('@/') ? path.join(frontend,moduleName.slice(2)) : moduleName,platform);
 const overrides = {
  [path.join(modules,'expo-router/build/native-tabs/NativeTabsView.web.js')]: 'tabs.tsx',
  [path.join(modules,'expo-font/build/FontUtils.js')]: 'fontImage.ts',
  [path.join(frontend,'firebaseConfig.ts')]: 'firebase.ts',
  [path.join(frontend,'utils/crashReporting.ts')]: 'reporting.ts',
  [path.join(frontend,'components/tutorial/WalkthroughLauncher.tsx')]: 'unavailable.tsx',
  [path.join(frontend,'hooks/useForegroundMapLocation.ts')]: 'location.ts',
 };
 if(resolved.type==='sourceFile' && overrides[resolved.filePath]) return {type:'sourceFile',filePath:path.join(__dirname,'adapters',overrides[resolved.filePath])};
 return resolved;
};
module.exports = config;
