
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useProjectStore = create(
  persist(
    (set) => ({
      projects: [
        {
          id: '1',
          title: 'Dashboard Filiais',
          owner: 'Luciano Korn',
          priority: 'Alta',
          dueDate: '15/10/2026',
          description: 'Estrutura gerencial do painel de filiais.',
          notes: 'Verificar conexão com o banco de dados e APIs.',
          status: 'Em Andamento',
          tasks: [
            {
              id: '101',
              text: 'Ajustar telas e componentes',
              assignee: 'Luciano',
              dueDate: '06/10/2026',
              dueTime: '10:00',
              notes: 'Usar estilo minimalista claro',
              completed: false,
            },
          ],
        },
      ],

      addProject: (newProject) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id: Date.now().toString(),
              status: 'Pendente',
              tasks: [],
              title: newProject.title,
              owner: newProject.owner || 'Não atribuído',
              priority: newProject.priority || 'Média',
              dueDate: newProject.dueDate || 'Sem prazo',
              description: newProject.description || '',
              notes: newProject.notes || '',
            },
          ],
        })),

      updateProject: (id, updatedFields) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)),
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      updateProjectStatus: (id, status) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, status } : p)),
        })),

      addTask: (projectId, taskText, assignee, dueDate, dueTime, notes) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: [
                  ...p.tasks,
                  {
                    id: Date.now().toString(),
                    text: taskText,
                    assignee: assignee || 'Geral',
                    dueDate: dueDate || '',
                    dueTime: dueTime || '09:00',
                    notes: notes || '',
                    completed: false,
                  },
                ],
              };
            }
            return p;
          }),
        })),

      updateTask: (projectId, taskId, updatedData) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...updatedData } : t)),
              };
            }
            return p;
          }),
        })),

      toggleTask: (projectId, taskId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
              };
            }
            return p;
          }),
        })),

      removeTask: (projectId, taskId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: p.tasks.filter((t) => t.id !== taskId),
              };
            }
            return p;
          }),
        })),
    }),
    {
      name: 'monday-projects-full-v4',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
