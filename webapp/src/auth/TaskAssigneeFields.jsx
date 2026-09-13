import { useEffect, useRef, useState } from 'react';

export function candidateName(candidate) {
  return candidate?.display_name
    || candidate?.displayName
    || candidate?.username_normalized
    || candidate?.username
    || candidate?.id
    || '—';
}

export function toggleAssignee(value, userId, checked) {
  const currentIds = Array.isArray(value?.assigneeUserIds) ? value.assigneeUserIds : [];
  const nextIds = checked
    ? [...new Set([...currentIds, userId])]
    : currentIds.filter((id) => id !== userId);

  let primaryAssigneeUserId = value?.primaryAssigneeUserId || '';
  if (checked && !primaryAssigneeUserId) primaryAssigneeUserId = userId;
  if (!checked && primaryAssigneeUserId === userId) primaryAssigneeUserId = nextIds[0] || '';

  return { ...value, assigneeUserIds: nextIds, primaryAssigneeUserId };
}

export function AssigneeDropdown({ candidates, value, onChange, disabled = false }) {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const selected = new Set(value?.assigneeUserIds || []);
  const selectedNames = candidates.filter((candidate) => selected.has(candidate.id)).map(candidateName);
  const label = selectedNames.length ? selectedNames.join(', ') : 'Ընտրել կատարողներ';

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  return <label className="task-field">
    <span>Կատարողներ *</span>
    <details
      ref={rootRef}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className={disabled ? 'assignee-dropdown disabled' : 'assignee-dropdown'}
    >
      <summary onClick={(event) => { if (disabled) event.preventDefault(); }}>
        <span>{label}</span><b>⌄</b>
      </summary>
      <div className="assignee-dropdown-menu">
        {candidates.length === 0 && <div className="dropdown-empty">Հասանելի կատարողներ չկան։</div>}
        {candidates.map((candidate) => {
          const checked = selected.has(candidate.id);
          return <label className="assignee-dropdown-option" key={candidate.id}>
            <input
              type="checkbox"
              disabled={disabled}
              checked={checked}
              onChange={(event) => onChange(toggleAssignee(value, candidate.id, event.target.checked))}
            />
            <span>
              <b>{candidateName(candidate)}</b>
              <small>{candidate.username_normalized || candidate.username || ''}</small>
            </span>
          </label>;
        })}
      </div>
    </details>
  </label>;
}

export function PrimaryAssigneeSelect({ candidates, value, onChange, disabled = false }) {
  const selectedIds = new Set(value?.assigneeUserIds || []);
  const selected = candidates.filter((candidate) => selectedIds.has(candidate.id));

  return <label className="task-field">
    <span>Առաջնային կատարող *</span>
    <select
      required
      disabled={disabled || selected.length === 0}
      value={value?.primaryAssigneeUserId || ''}
      onChange={(event) => onChange({ ...value, primaryAssigneeUserId: event.target.value })}
    >
      <option value="">Ընտրել առաջնային կատարող</option>
      {selected.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidateName(candidate)}</option>)}
    </select>
  </label>;
}

export function TaskAssigneeFields(props) {
  return <div className="performer-grid">
    <AssigneeDropdown {...props} />
    <PrimaryAssigneeSelect {...props} />
  </div>;
}

export function assigneeText(task) {
  const list = Array.isArray(task?.assignees) ? task.assignees : [];
  if (!list.length) return 'Կատարող չի նշանակվել';
  return list.map((item) => item.displayName || item.username || item.id).join(', ');
}

export function primaryAssigneeText(task) {
  const primary = (task?.assignees || []).find((item) => item.isPrimary);
  return primary?.displayName
    || primary?.username
    || task?.primary_assignee_name
    || task?.primary_assignee_username
    || '—';
}
