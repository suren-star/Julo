import { useEffect, useState } from 'react';
import { backendApi } from '../lib/api-client.js';
import { TASK_EXECUTION_OPTIONS, TASK_PRIORITY_OPTIONS } from '../lib/task-types.js';
import { TaskAssigneeFields } from './TaskAssigneeFields.jsx';

const emptyNoteForm = () => ({
  title: '',
  description: '',
  reminderDate: new Date().toISOString().slice(0, 10),
  label: '',
});

function conversionDraft(note) {
  return {
    projectId: '',
    executionType: 'execute',
    dueDate: String(note?.reminder_date || note?.reminderDate || new Date().toISOString().slice(0, 10)).slice(0, 10),
    priority: 'normal',
    assigneeUserIds: [],
    primaryAssigneeUserId: '',
  };
}

export default function NotesDrawer({ workspace, open, onClose }) {
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState(emptyNoteForm);
  const [converting, setConverting] = useState(null);
  const [convertForm, setConvertForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canWrite = ['owner', 'admin', 'member'].includes(workspace?.role);

  const load = async () => {
    if (!workspace?.id) return;
    try {
      const [noteResult, projectResult] = await Promise.all([
        backendApi.notes(workspace.id),
        backendApi.projects(workspace.id),
      ]);
      setNotes(noteResult.notes || []);
      setProjects(projectResult.projects || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Չհաջողվեց բեռնել հիշեցումները։');
    }
  };

  const loadCandidates = async (projectId = '') => {
    if (!workspace?.id) return;
    try {
      const result = await backendApi.taskAssignees(workspace.id, projectId);
      setCandidates(result.assignees || []);
    } catch (requestError) {
      setCandidates([]);
      setError(requestError.message);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open, workspace?.id]);

  const create = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await backendApi.createNote(workspace.id, form);
      setForm(emptyNoteForm());
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const edit = async (note) => {
    const title = window.prompt('Հիշեցման վերնագիր', note.title);
    if (!title?.trim()) return;
    const description = window.prompt('Նկարագիր', note.description || '');
    if (description === null) return;
    const label = window.prompt('Պիտակ', note.label || '');
    if (label === null) return;
    const reminderDate = window.prompt(
      'Ամսաթիվ (YYYY-MM-DD)',
      String(note.reminder_date || note.reminderDate || '').slice(0, 10),
    );
    if (!reminderDate) return;

    try {
      await backendApi.updateNote(workspace.id, note.id, {
        expectedVersion: Number(note.version),
        title: title.trim(),
        description,
        reminderDate,
        label,
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const remove = async (note) => {
    if (!window.confirm(`Ջնջե՞լ «${note.title}» հիշեցումը։`)) return;
    try {
      await backendApi.deleteNote(workspace.id, note.id);
      if (converting?.id === note.id) {
        setConverting(null);
        setConvertForm(null);
      }
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const beginConversion = async (note) => {
    setConverting(note);
    setConvertForm(conversionDraft(note));
    setError('');
    await loadCandidates('');
  };

  const chooseConversionProject = async (projectId) => {
    setConvertForm((current) => ({
      ...current,
      projectId,
      assigneeUserIds: [],
      primaryAssigneeUserId: '',
    }));
    await loadCandidates(projectId);
  };

  const convert = async () => {
    if (!converting || !convertForm) return;
    if (!convertForm.assigneeUserIds.length) {
      setError('Ընտրեք առնվազն մեկ կատարող։');
      return;
    }
    if (!convertForm.primaryAssigneeUserId) {
      setError('Ընտրեք առաջնային կատարողին։');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await backendApi.convertNote(workspace.id, converting.id, {
        expectedVersion: Number(converting.version),
        ...convertForm,
      });
      setConverting(null);
      setConvertForm(null);
      setCandidates([]);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return <div className="backend-drawer">
    <div className="drawer-header">
      <div><strong>Հիշեցումներ</strong><span>Կարճ գրառում կամ ապագա առաջադրանք</span></div>
      <button type="button" onClick={onClose}>×</button>
    </div>

    {error && <div className="auth-error">{error}</div>}

    {canWrite && <form className="note-form" onSubmit={create}>
      <input placeholder="Վերնագիր" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      <textarea placeholder="Նկարագիր" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <div className="note-form-row">
        <input type="date" value={form.reminderDate} onChange={(event) => setForm({ ...form, reminderDate: event.target.value })} required />
        <input placeholder="Պիտակ" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} />
      </div>
      <button className="primary" disabled={busy}>＋ Ավելացնել հիշեցում</button>
    </form>}

    <div className="note-list">
      {notes.length === 0 && <div className="drawer-empty">Հիշեցումներ չկան։</div>}
      {notes.map((note) => <article className={note.status === 'converted' ? 'note-item converted' : 'note-item'} key={note.id}>
        <div className="note-meta">
          <time>{String(note.reminder_date || note.reminderDate || '').slice(0, 10)}</time>
          {note.label && <span>{note.label}</span>}
        </div>
        <h4>{note.title}</h4>
        {note.description && <p>{note.description}</p>}

        {note.status === 'converted'
          ? <small>Վերափոխված է առաջադրանքի</small>
          : canWrite && <div className="note-actions">
              <button type="button" onClick={() => edit(note)}>Խմբագրել</button>
              <button type="button" onClick={() => beginConversion(note)}>Դարձնել առաջադրանք</button>
              <button type="button" className="danger-text" onClick={() => remove(note)}>Ջնջել</button>
            </div>}

        {converting?.id === note.id && convertForm && <div className="assignment-editor note-conversion-editor">
          <strong>Առաջադրանքի պարամետրեր</strong>
          <div className="note-form-row">
            <label className="task-field">
              <span>Նախագիծ</span>
              <select value={convertForm.projectId} disabled={busy} onChange={(event) => chooseConversionProject(event.target.value)}>
                <option value="">Առանց նախագծի</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="task-field">
              <span>Կատարման ժամկետ *</span>
              <input type="date" required value={convertForm.dueDate} onChange={(event) => setConvertForm({ ...convertForm, dueDate: event.target.value })} />
            </label>
          </div>
          <div className="note-form-row">
            <label className="task-field">
              <span>Կատարման տեսակ</span>
              <select value={convertForm.executionType} onChange={(event) => setConvertForm({ ...convertForm, executionType: event.target.value })}>
                {TASK_EXECUTION_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <label className="task-field">
              <span>Առաջնահերթություն</span>
              <select value={convertForm.priority} onChange={(event) => setConvertForm({ ...convertForm, priority: event.target.value })}>
                {TASK_PRIORITY_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
          </div>
          <TaskAssigneeFields candidates={candidates} value={convertForm} onChange={setConvertForm} disabled={busy} />
          <p className="task-required-note">* Կատարողը և առաջնային կատարողը պարտադիր են նաև հիշեցումը առաջադրանքի վերափոխելիս։</p>
          <div>
            <button type="button" onClick={() => { setConverting(null); setConvertForm(null); setCandidates([]); }}>Չեղարկել</button>
            <button type="button" className="primary" onClick={convert} disabled={busy || !convertForm.assigneeUserIds.length || !convertForm.primaryAssigneeUserId}>Դարձնել առաջադրանք</button>
          </div>
        </div>}
      </article>)}
    </div>
  </div>;
}
