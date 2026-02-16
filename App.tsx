import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

const Tab = createBottomTabNavigator();

function Placeholder({ route }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0D9488' }}>{route.name}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Explore" component={Placeholder} />
          <Tab.Screen name="List" component={Placeholder} />
          <Tab.Screen name="Saved" component={Placeholder} />
          <Tab.Screen name="Profile" component={Placeholder} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
