import React, { useState } from 'react';
import { TaskItem, TaskPriority } from '../types';
import { getLocalDateString } from '../utils/activityStore';

interface TasksViewProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (newTask: Omit<TaskItem, 'id'>) => void;
  selectedTask: TaskItem | null;
  setSelectedTask: (task: TaskItem | null) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  selectedTask,
  setSelectedTask,
  onDeleteTask,
}) => {
  const todayStr = getLocalDateString(new Date());
  const [filter, setFilter] = useState<'All' | 'Today' | 'Upcoming' | 'Completed'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState(todayStr);
  const [dateError, setDateError] = useState<string | null>(null);
  const [newPriority, setNewPriority] = useState<TaskPriority>('High');
  const [newCategory, setNewCategory] = useState('Household');
  const [newAmount, setNewAmount] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Default select first task if none selected
  const activeTask = selectedTask || tasks[0] || null;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'Today') return (t.dueDate === todayStr || t.dueDate.toLowerCase().includes('today')) && !t.completed;
    if (filter === 'Upcoming') return (t.dueDate !== todayStr && !t.dueDate.toLowerCase().includes('today')) && !t.completed;
    if (filter === 'Completed') return t.completed;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError(null);
    if (!newTitle.trim()) return;

    // Strict validation: tasks can only be scheduled on today or upcoming days
    if (newDueDate < todayStr) {
      setDateError('Tasks can only be scheduled for today or upcoming days. Previous dates are not allowed.');
      return;
    }

    let displayDueDate = newDueDate;
    if (newDueDate === todayStr) {
      displayDueDate = 'Today';
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (newDueDate === getLocalDateString(tomorrow)) {
        displayDueDate = 'Tomorrow';
      }
    }

    onAddTask({
      title: newTitle.trim(),
      subtitle: `${displayDueDate} • ${newCategory}`,
      priority: newPriority,
      category: newCategory,
      dueDate: newDueDate,
      amount: newAmount ? `$${newAmount}` : undefined,
      provider: newProvider || undefined,
      completed: false,
      aiInsight:
        newPriority === 'High'
          ? 'HomeOps suggests addressing this today to prevent schedule conflicts.'
          : undefined,
    });

    setNewTitle('');
    setNewDueDate(todayStr);
    setDateError(null);
    setNewAmount('');
    setNewProvider('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex p-6 md:p-10 gap-6 md:gap-8 max-w-[1440px] mx-auto w-full h-full overflow-hidden animate-in fade-in duration-200">
      {/* Left Column: Task List Section */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight">Tasks</h2>
            <p className="text-xs text-[#0F766E] font-medium flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Persisted in browser storage, cookies & cache
            </p>
          </div>
          <button
            id="btn-add-task-modal-open"
            onClick={() => setShowAddModal(true)}
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-98 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Task
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {(['All', 'Today', 'Upcoming', 'Completed'] as const).map((f) => {
            const isSelected = filter === f;
            const label = f === 'All' ? 'All Tasks' : f;
            return (
              <button
                key={f}
                id={`filter-tasks-${f.toLowerCase()}`}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'bg-[#eceef0] text-gray-600 hover:bg-[#e0e3e5]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Task Cards List */}
        <div className="space-y-3.5 flex-1 pb-12">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[#e2e8f0] text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">
                task_alt
              </span>
              <p className="text-sm font-medium">No tasks in this view</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isSelected = activeTask?.id === task.id;
              return (
                <div
                  key={task.id}
                  id={`task-card-${task.id}`}
                  onClick={() => setSelectedTask(task)}
                  className={`bg-white rounded-xl p-4 flex items-start gap-4 shadow-sm cursor-pointer relative overflow-hidden transition-all duration-200 group ${
                    isSelected
                      ? 'border-2 border-[#0F766E] shadow-md ring-2 ring-[#0F766E]/10'
                      : 'border border-[#e2e8f0] hover:border-gray-400'
                  } ${task.completed ? 'opacity-70 bg-gray-50/70' : ''}`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0F766E]"></div>
                  )}

                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTask(task.id);
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? 'bg-[#0F766E] border-[#0F766E] text-white'
                          : 'border-[#76777d] group-hover:border-[#0F766E]'
                      }`}
                    >
                      {task.completed && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-sm font-semibold text-[#0F172A] ${
                          task.completed ? 'line-through text-gray-400' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          task.priority === 'High'
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : task.priority === 'Medium'
                            ? 'bg-[#99efe5]/60 text-[#006f67]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{task.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.aiRecommended && !task.completed && (
                      <div className="bg-[#CCFBF1]/70 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[13px] text-[#006f67]">
                          smart_toy
                        </span>
                        <span className="text-[10px] font-bold text-[#006f67]">AI Recommended</span>
                      </div>
                    )}
                    <button
                      id={`btn-delete-task-${task.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedTask?.id === task.id) {
                          setSelectedTask(null);
                        }
                        onDeleteTask(task.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-70 hover:opacity-100 group-hover:opacity-100 cursor-pointer"
                      title={`Delete ${task.title}`}
                      aria-label={`Delete ${task.title}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Detail Drawer (Desktop) */}
      {activeTask && (
        <aside
          id="task-detail-drawer"
          className="hidden lg:flex flex-col w-[340px] xl:w-[380px] bg-white rounded-2xl border border-[#e2e8f0] shadow-sm h-full overflow-y-auto shrink-0"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#0F172A]">Task Details</h3>
            <button
              id="btn-close-task-detail"
              onClick={() => setSelectedTask(null)}
              className="text-gray-400 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Drawer Content */}
          <div className="p-6 space-y-6 flex-1">
            <div>
              <h4 className="text-xl font-bold text-[#0F172A] mb-2 leading-snug">
                {activeTask.title}
              </h4>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-1 rounded-sm text-xs font-semibold ${
                    activeTask.priority === 'High'
                      ? 'bg-[#ffdad6] text-[#93000a]'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {activeTask.priority} Priority
                </span>
                <span className="px-2.5 py-1 rounded-sm bg-[#f1f5f9] text-gray-700 text-xs font-medium">
                  {activeTask.category}
                </span>
              </div>
            </div>

            {/* Metadata Rows */}
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-[#e2e8f0]/60">
                <span className="text-gray-500">Due Date</span>
                <span
                  className={`font-semibold ${
                    activeTask.dueDate.toLowerCase().includes('today')
                      ? 'text-[#ba1a1a]'
                      : 'text-[#0F172A]'
                  }`}
                >
                  {activeTask.dueDate}
                </span>
              </div>
              {activeTask.amount && (
                <div className="flex justify-between items-center py-2 border-b border-[#e2e8f0]/60">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-[#0F172A]">{activeTask.amount}</span>
                </div>
              )}
              {activeTask.provider && (
                <div className="flex justify-between items-center py-2 border-b border-[#e2e8f0]/60">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-semibold text-[#0F172A]">{activeTask.provider}</span>
                </div>
              )}
            </div>

            {/* AI Insight Card */}
            {activeTask.aiInsight && (
              <div className="bg-[#F0FDFA] border-l-2 border-[#006a63] rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#006a63] text-[20px]">
                    smart_toy
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#006a63]">
                    AI Insight
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {activeTask.aiInsight}
                </p>
              </div>
            )}
          </div>

          {/* Drawer Actions */}
          <div className="p-6 border-t border-[#e2e8f0] flex gap-2 bg-gray-50/50">
            <button
              id="btn-delete-task-detail"
              type="button"
              onClick={() => {
                const idToDelete = activeTask.id;
                setSelectedTask(null);
                onDeleteTask(idToDelete);
              }}
              className="py-2.5 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              title="Delete this task"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>Delete</span>
            </button>
            <button
              id="btn-edit-task"
              type="button"
              onClick={() => {
                setToastMsg(`Editing for "${activeTask.title}" enabled.`);
                setTimeout(() => setToastMsg(null), 3000);
              }}
              className="flex-1 py-2.5 px-3 rounded-lg border border-[#e2e8f0] bg-white text-[#0F172A] text-sm font-semibold hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
            >
              Edit
            </button>
            <button
              id="btn-mark-done-task"
              type="button"
              onClick={() => onToggleTask(activeTask.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer ${
                activeTask.completed
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-[#006a63] hover:bg-[#00504a]'
              }`}
            >
              {activeTask.completed ? 'Reopen' : 'Mark Done'}
            </button>
          </div>
        </aside>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F172A]">Add New Household Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule chimney inspection"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                />
              </div>

              {dateError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {dateError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">Due Date *</label>
                    <span className="text-[10px] text-teal-700 font-medium">Today / Future</span>
                  </div>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={newDueDate}
                    onChange={(e) => {
                      setNewDueDate(e.target.value);
                      if (e.target.value < todayStr) {
                        setDateError('Cannot select previous dates. Only today or upcoming days are allowed.');
                      } else {
                        setDateError(null);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-[#0F766E] outline-none"
                  />
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setNewDueDate(todayStr);
                        setDateError(null);
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        newDueDate === todayStr
                          ? 'bg-[#0F766E] text-white border-[#0F766E]'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setNewDueDate(getLocalDateString(tomorrow));
                        setDateError(null);
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date();
                        next.setDate(next.getDate() + 3);
                        setNewDueDate(getLocalDateString(next));
                        setDateError(null);
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200"
                    >
                      +3 Days
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-medium text-gray-800"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Bills, Maintenance, etc."
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 120.00"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#115E59]"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[18px] text-teal-400">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
