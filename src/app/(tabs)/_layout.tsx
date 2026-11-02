import AppTabs from '@/components/app-tabs';
import { InstallPrompt } from '@/components/install-prompt';

export default function TabLayout() {
  return (
    <>
      <AppTabs />
      {/* Web only: floats above the tab bar until installed or dismissed. */}
      <InstallPrompt />
    </>
  );
}
