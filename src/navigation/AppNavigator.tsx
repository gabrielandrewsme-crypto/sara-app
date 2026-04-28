import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { DataProviders } from '../hooks/DataProviders';
import { useAuth } from '../hooks/useAuth';
import { AccountScreen } from '../screens/AccountScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { EventFormScreen } from '../screens/EventFormScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { FinanceFormScreen } from '../screens/FinanceFormScreen';
import { FinancesScreen } from '../screens/FinancesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { IdeaFormScreen } from '../screens/IdeaFormScreen';
import { IdeasScreen } from '../screens/IdeasScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NoteFormScreen } from '../screens/NoteFormScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { RoutineFormScreen } from '../screens/RoutineFormScreen';
import { RoutinesScreen } from '../screens/RoutinesScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { TaskFormScreen } from '../screens/TaskFormScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { theme } from '../styles/theme';
import { AppStackParamList, AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.background,
    primary: theme.colors.primary,
    text: theme.colors.text,
    border: theme.colors.border,
  },
};

const screenContent = { backgroundColor: theme.colors.background };

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false, contentStyle: screenContent }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigatorInner() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        contentStyle: screenContent,
      }}
    >
      <AppStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat Sara' }}
      />
      <AppStack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Minha conta' }}
      />

      <AppStack.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{ title: 'Rotinas' }}
      />
      <AppStack.Screen
        name="RoutineForm"
        component={RoutineFormScreen}
        options={{ title: 'Rotina' }}
      />

      <AppStack.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: 'Tarefas' }}
      />
      <AppStack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={{ title: 'Tarefa' }}
      />

      <AppStack.Screen
        name="Events"
        component={EventsScreen}
        options={{ title: 'Agenda' }}
      />
      <AppStack.Screen
        name="EventForm"
        component={EventFormScreen}
        options={{ title: 'Evento' }}
      />

      <AppStack.Screen
        name="Notes"
        component={NotesScreen}
        options={{ title: 'Notas' }}
      />
      <AppStack.Screen
        name="NoteForm"
        component={NoteFormScreen}
        options={{ title: 'Nota' }}
      />

      <AppStack.Screen
        name="Ideas"
        component={IdeasScreen}
        options={{ title: 'Ideias' }}
      />
      <AppStack.Screen
        name="IdeaForm"
        component={IdeaFormScreen}
        options={{ title: 'Ideia' }}
      />

      <AppStack.Screen
        name="Finances"
        component={FinancesScreen}
        options={{ title: 'Finanças' }}
      />
      <AppStack.Screen
        name="FinanceForm"
        component={FinanceFormScreen}
        options={{ title: 'Lançamento' }}
      />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return <SplashScreen />;
  }

  if (!session) {
    return (
      <NavigationContainer theme={navTheme}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <DataProviders>
        <AppNavigatorInner />
      </DataProviders>
    </NavigationContainer>
  );
}
