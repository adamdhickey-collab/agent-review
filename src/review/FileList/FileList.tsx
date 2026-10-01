import { Badge } from '../../components';
import type { FileChange } from '../../data/types';
import './FileList.css';

/* The files the change touched. A shared file (anything under
   src/components) is marked, because that is the one kind of edit whose
   effect is not where the agent was looking. */

export function FileList({ files }: { files: FileChange[] }) {
  return (
    <ul className="files">
      {files.map((f) => (
        <li key={f.path} className="files__item" data-status={f.status}>
          <span className="files__status" aria-label={f.status}>
            {f.status === 'added' ? 'A' : f.status === 'deleted' ? 'D' : 'M'}
          </span>
          <code className="files__path">{f.path}</code>
          {f.shared ? <Badge tone="warning">Shared</Badge> : null}
          <span className="files__counts">
            <span className="files__add">+{f.additions}</span> <span className="files__del">−{f.deletions}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
