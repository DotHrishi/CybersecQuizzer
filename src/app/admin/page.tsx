import AdminDashboard from '@/components/AdminDashboard';

export const metadata = {
  title: 'Admin Panel | CyberShield Question Bank',
  description: 'Manage question bank, edit questions, import/export, and reset leaderboards',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
