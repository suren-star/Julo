import { useEffect, useMemo, useState } from 'react';
import { backendApi } from '../lib/api-client.js';

function displayName(member) {
  return member.display_name || member.displayName || member.username_normalized || member.username || member.id;
}

export default function ProjectTeamDrawer({ workspace, open, onClose }) {
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadBase = async () => {
    if (!workspace?.id) return;
    try {
      const [projectResult, memberResult] = await Promise.all([
        backendApi.projects(workspace.id),
        backendApi.members(workspace.id),
      ]);
      const nextProjects = projectResult.projects || [];
      setProjects(nextProjects);
      setMembers(memberResult.members || []);
      setSelected((current) => {
        if (current && nextProjects.some((project) => project.id === current)) return current;
        return nextProjects[0]?.id || '';
      });
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Չհաջողվեց բեռնել նախագծի թիմը։');
    }
  };

  const loadAssigned = async () => {
    if (!selected) {
      setAssigned([]);
      return;
    }
    try {
      const result = await backendApi.projectMembers(workspace.id, selected);
      setAssigned(result.members || []);
    } catch (requestError) {
      setAssigned([]);
      setError(requestError.message);
    }
  };

  useEffect(() => {
    if (open) loadBase();
  }, [open, workspace?.id]);

  useEffect(() => {
    if (open) loadAssigned();
  }, [open, selected]);

  const createProject = async () => {
    const name = window.prompt('Նոր նախագծի անունը');
    if (!name?.trim()) return;
    setBusy(true);
    setError('');
    try {
      const result = await backendApi.createProject(workspace.id, { name: name.trim() });
      await loadBase();
      if (result.project?.id) setSelected(result.project.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const renameProject = async () => {
    const project = projects.find((item) => item.id === selected);
    if (!project) return;
    const name = window.prompt('Նախագծի նոր անունը', project.name);
    if (!name?.trim()) return;
    setBusy(true);
    setError('');
    try {
      await backendApi.renameProject(workspace.id, project.id, { name: name.trim() });
      await loadBase();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const assign = async (userId, role) => {
    if (!selected || !role) return;
    setBusy(true);
    setError('');
    try {
      await backendApi.setProjectMember(workspace.id, selected, userId, role);
      await loadAssigned();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (userId) => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await backendApi.removeProjectMember(workspace.id, selected, userId);
      await loadAssigned();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const assignedIds = useMemo(() => new Set(assigned.map((member) => member.id)), [assigned]);
  const availableGuests = useMemo(
    () => members.filter((member) => member.role === 'guest' && !assignedIds.has(member.id)),
    [members, assignedIds],
  );

  if (!open) return null;

  return <div className="backend-drawer">
    <div className="drawer-header">
      <div><strong>Նախագծի թիմ</strong><span>Նախագծային դերերը կիրառվում են միայն Guest հասանելիության համար</span></div>
      <button type="button" onClick={onClose}>×</button>
    </div>

    {error && <div className="auth-error">{error}</div>}

    <div className="project-tools">
      <button type="button" className="primary" disabled={busy} onClick={createProject}>＋ Նոր նախագիծ</button>
      <button type="button" disabled={busy || !selected} onClick={renameProject}>Վերանվանել</button>
    </div>

    <select value={selected} disabled={busy} onChange={(event) => setSelected(event.target.value)}>
      <option value="">Ընտրեք նախագիծ</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>

    <h4>Վերագրված Guest-եր</h4>
    <div className="assignment-list">
      {assigned.map((member) => <div key={member.id}>
        <span>
          <b>{displayName(member)}</b>
          <small>{member.username_normalized || member.username || ''} · {member.project_role || member.projectRole}</small>
        </span>
        <button type="button" disabled={busy} onClick={() => remove(member.id)}>Հեռացնել</button>
      </div>)}
      {selected && assigned.length === 0 && <div className="drawer-empty">Այս նախագծին դեռ Guest հասանելիություն չի տրվել։</div>}
    </div>

    <h4>Ավելացնել Guest աշխատանքային տարածքից</h4>
    <div className="assignment-list">
      {availableGuests.map((member) => <div key={member.id}>
        <span>
          <b>{displayName(member)}</b>
          <small>{member.username_normalized || member.username || ''} · Guest</small>
        </span>
        <select value="" disabled={busy || !selected} onChange={(event) => assign(member.id, event.target.value)}>
          <option value="">Վերագրել…</option>
          <option value="manager">Կառավարիչ</option>
          <option value="editor">Խմբագիր</option>
          <option value="viewer">Դիտորդ</option>
        </select>
      </div>)}
      {selected && availableGuests.length === 0 && <div className="drawer-empty">Ավելացնելու հասանելի Guest օգտատեր չկա։</div>}
    </div>
  </div>;
}
