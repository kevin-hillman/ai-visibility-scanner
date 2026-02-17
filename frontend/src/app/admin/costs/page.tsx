import { Metadata } from 'next';
import CostDashboardClient from './CostDashboardClient';

export const metadata: Metadata = {
  title: 'Kostenübersicht — Admin',
  robots: 'noindex, nofollow',
};

export default function CostDashboardPage() {
  return <CostDashboardClient />;
}
