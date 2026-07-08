import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './MarkdownRenderer.module.css';

export default function MarkdownRenderer({ content }) {
  if (!content || content.trim() === '') {
    return <p className={styles.empty}>No description provided.</p>;
  }

  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
