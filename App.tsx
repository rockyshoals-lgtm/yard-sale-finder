import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={ps.container}>
      <Text style={ps.text}>{title}</Text>
    </View>
  );
}
const ps = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  text: { fontSize: 24, fontWeight: 'bold', color: '#0D9488' },
});

function MapPlaceholder() { return <PlaceholderScreen title="Explore" />; }
function ListPlaceholder() { return <PlaceholderScreen title="List" />; }
function SavedPlaceholder() { return <PlaceholderScreen title="Saved" />; }
function ProfilePlaceholder() { return <PlaceholderScreen title="Profile" />; }

function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Map" component={MapPlaceholder} options={{ tabBarLabel: 'Explore' }} />
      <Tab.Screen name="List" component={ListPlaceholder} options={{ tabBarLabel: 'List' }} />
      <Tab.Screen name="Saved" component={SavedPlaceholder} options={{ tabBarLabel: 'Saved' }} />
      <Tab.Screen name="Profile" component={ProfilePlaceholder} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
