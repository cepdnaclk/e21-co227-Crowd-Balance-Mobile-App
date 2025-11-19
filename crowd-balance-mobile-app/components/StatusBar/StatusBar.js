import { StatusBar as RNStatusBar, Platform, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';

const AppStatusBar = ({ backgroundColor = "black", barStyle = "light-content" }) => {
  const insets = useSafeAreaInsets();

  // Force status bar update when component mounts and when focused
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Use transparent background for edge-to-edge, or solid color for normal mode
      RNStatusBar.setBackgroundColor('transparent', true);
      RNStatusBar.setBarStyle(barStyle, true);
      RNStatusBar.setTranslucent(true);
    }
  }, [backgroundColor, barStyle]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        // Double-ensure status bar settings on focus
        setTimeout(() => {
          RNStatusBar.setBackgroundColor('transparent', true);
          RNStatusBar.setBarStyle(barStyle, true);
          RNStatusBar.setTranslucent(true);
        }, 50); // Slightly longer delay for edge-to-edge
      }
    }, [backgroundColor, barStyle])
  );

  if (Platform.OS === 'ios') {
    return (
      <>
        <RNStatusBar
          backgroundColor={backgroundColor}
          barStyle={barStyle}
          animated={true}
        />
        <SafeAreaView 
          style={{ 
            backgroundColor,
            flex: 0
          }} 
        />
      </>
    );
  }

  // Android handling - create our own status bar background
  return (
    <>
      <RNStatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={barStyle}
        animated={true}
      />
      <View 
        style={{ 
          height: insets.top || RNStatusBar.currentHeight || 24,
          backgroundColor,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }} 
      />
    </>
  );
};

export default AppStatusBar;