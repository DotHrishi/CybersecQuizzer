import LeaderboardTable from '@/components/LeaderboardTable';

export const metadata = {
  title: 'Leaderboard | CyberShield Daily Quiz',
  description: 'Daily, Weekly, and Monthly cybersecurity quiz rankings',
};

export default function LeaderboardPage() {
  return <LeaderboardTable />;
}
