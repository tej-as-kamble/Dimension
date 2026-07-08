import './globals.css';

export const metadata = {
  title: 'Dimension — Personal Productivity & Sprint Management',
  description:
    'Organize your workload into sprints, track tasks with a Kanban board, and maintain a chronological activity log. Built for focused personal productivity.',
  keywords: ['productivity', 'sprint', 'task management', 'kanban', 'project management'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
