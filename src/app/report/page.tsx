import UserReportView from '@/components/UserReportView';

export const metadata = {
  title: 'My Report | CyberShield Daily Quiz',
  description: 'Personal cybersecurity quiz accuracy, speed, and attempt history report',
};

export default function ReportPage() {
  return <UserReportView />;
}
