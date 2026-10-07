import type { Metadata } from 'next';

import { HomeView } from '@/features/home/components/HomeView';

export const metadata: Metadata = {
  title: 'Cinema — афіша та квитки онлайн',
  description: 'Афіша кінотеатру, найближчі сеанси та купівля квитків онлайн.',
};

export default function HomePage() {
  return <HomeView />;
}
