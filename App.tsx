import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import ResponsiveContainer from './src/components/ResponsiveContainer';

function Root() {
  const { mode } = useTheme();
  return (
    <>
      <ResponsiveContainer>
        <AppNavigator />
      </ResponsiveContainer>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
