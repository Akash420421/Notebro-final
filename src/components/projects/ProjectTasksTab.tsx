import React, { useState } from 'react';
import { ProjectItem, ProjectTask } from '../../types';
import {
  calculateProjectProgress,
  formatDeadlineStatus,
} from '../../services/projectService';
import {
  CheckSquare,
  Plus,
  Circle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Trash2,
  Edit2,
  Pin,
  X,
  Filter,
  Check,
} from 'lucide-react';

interface ProjectTasksTabProps {
  project: ProjectItem;
  onAddTask: (taskData: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  }) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onTogglePinTask?: (taskId: string) => void;
}

export const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({
  project,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onTogglePinTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');

  const tasks = project.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const progress = calculateProjectProgress(tasks);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
    });

    // Reset
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-4">
      {/* Progress & Quick Stats Banner */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tasks Completion
            </h4>
            <div className="text-lg font-black text-slate-800">
              {tasks.length > 0
                ? `${progress}% Finished (${completedCount}/${tasks.length})`
                : '0 Tasks Created'}
            </div>
          </div>

          <button
            onClick={() => setIsAddingTask(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Task</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${tasks.length > 0 ? progress : 0}%`,
              backgroundColor: project.color || '#6366f1',
            }}
          />
        </div>
      </div>

      {/* Inline Add Task Drawer / Modal */}
      {isAddingTask && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white rounded-2xl border border-indigo-200/80 p-4 sm:p-5 shadow-[0_4px_20px_rgba(99,102,241,0.08)] space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Create Task</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Design app mockup, finish Chapter 3, setup API routes..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add key notes, checklist details or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-colors border ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : p === 'medium'
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 px-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
              filter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="py-12 text-center bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-slate-800">
            {filter === 'completed'
              ? 'No completed tasks yet'
              : filter === 'pending'
              ? 'No pending tasks left!'
              : 'No tasks added yet'}
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Track all goals, sprint items, and milestones for this project.
          </p>
          {filter === 'all' && !isAddingTask && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="mt-2 inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const deadline = task.dueDate ? formatDeadlineStatus(task.dueDate) : null;

            return (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  task.completed
                    ? 'bg-slate-50/70 border-slate-200/70 text-slate-400'
                    : 'bg-white border-slate-200/90 hover:border-indigo-300 text-slate-800 shadow-xs'
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 hover:text-indigo-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs sm:text-sm font-bold tracking-tight ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </div>

                    {task.description && (
                      <p
                        className={`text-xs mt-0.5 line-clamp-2 ${
                          task.completed ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px] font-semibold">
                      {task.priority && (
                        <span
                          className={`px-2 py-0.2 rounded-md ${
                            task.priority === 'high'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : task.priority === 'medium'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {task.priority.toUpperCase()} PRIORITY
                        </span>
                      )}

                      {deadline && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md ${
                            deadline.isOverdue
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : deadline.isDueSoon
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          {deadline.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div
                  className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
