import SprintDetailPage from '../../page';

/**
 * We re-export the sprint board page component.
 * It will receive the `taskId` in `params`, initializing the task modal
 * automatically over the sprint board, achieving "always show task pop up
 * above the respective sprint" even on direct URL navigation.
 */
export default function TaskPage({ params }) {
  return <SprintDetailPage params={params} />;
}
