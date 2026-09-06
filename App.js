import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// --- CONFIGURAÇÃO DE NOTIFICAÇÕES ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

// --- STORE ZUSTAND MONDAY COMPLETO ---
const useProjectStore = create(
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
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updatedFields } : p
          ),
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
      name: 'monday-projects-full-v6',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

const Stack = createNativeStackNavigator();

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Alta': return '#EF4444';
    case 'Média': return '#F59E0B';
    default: return '#10B981';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Concluído': return '#10B981';
    case 'Em Andamento': return '#3B82F6';
    default: return '#F59E0B';
  }
};

// --- TELA PRINCIPAL (APENAS PROJETOS ATIVOS) ---
function HomeScreen({ navigation }) {
  const { projects, addProject } = useProjectStore();
  const [modalVisible, setModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [priority, setPriority] = useState('Média');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const activeProjects = projects.filter((p) => p.status !== 'Concluído');
  const allActiveTasks = activeProjects.flatMap((p) => p.tasks);
  const completedActiveTasks = allActiveTasks.filter((t) => t.completed).length;
  const totalActiveTasks = allActiveTasks.length;
  const activeProgress = totalActiveTasks > 0 ? Math.round((completedActiveTasks / totalActiveTasks) * 100) : 0;

  const handleCreate = () => {
    if (title.trim()) {
      addProject({
        title: title.trim(),
        owner: owner.trim(),
        priority,
        dueDate: dueDate.trim(),
        description: description.trim(),
        notes: notes.trim(),
      });
      setTitle('');
      setOwner('');
      setPriority('Média');
      setDueDate('');
      setDescription('');
      setNotes('');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Progresso dos Projetos Ativos</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${activeProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {activeProgress}% concluído ({completedActiveTasks}/{totalActiveTasks} subtarefas)
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{activeProjects.length}</Text>
              <Text style={styles.metricLabel}>Em Andamento</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{totalActiveTasks}</Text>
              <Text style={styles.metricLabel}>Subtarefas</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionMainTitle}>Projetos Ativos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.historyLinkText}>Ver Histórico Encerrados ›</Text>
          </TouchableOpacity>
        </View>

        {activeProjects.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum projeto em andamento no momento.</Text>
        ) : (
          activeProjects.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={[styles.badgePriority, { backgroundColor: getPriorityColor(item.priority) + '18' }]}>
                  <Text style={[styles.badgePriorityText, { color: getPriorityColor(item.priority) }]}>
                    {item.priority}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardOwnerText}>👤 Responsável: {item.owner}</Text>
              {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>🗓 Prazo: {item.dueDate}</Text>
                <Text style={styles.cardFooterText}>{item.tasks.length} subtarefas</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Novo Item / Projeto</Text>

              <TextInput
                style={styles.input}
                placeholder="Nome do Projeto *"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={styles.input}
                placeholder="Responsável (ex: Luciano Korn)"
                placeholderTextColor="#9CA3AF"
                value={owner}
                onChangeText={setOwner}
              />

              <Text style={styles.labelTitle}>Prioridade:</Text>
              <View style={styles.prioritySelectorRow}>
                {['Baixa', 'Média', 'Alta'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityBtn,
                      priority === p && { backgroundColor: getPriorityColor(p), borderColor: getPriorityColor(p) },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.priorityBtnText, priority === p && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Prazo (ex: 20/10/2026)"
                placeholderTextColor="#9CA3AF"
                value={dueDate}
                onChangeText={setDueDate}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descrição resumida"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                value={description}
                onChangeText={setDescription}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Anotações Gerais / Links / Observações"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate}>
                  <Text style={styles.btnPrimaryText}>Criar Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// --- TELA DE HISTÓRICO COM MÉTRICAS ---
function HistoryScreen({ navigation }) {
  const { projects } = useProjectStore();
  const completedProjects = projects.filter((p) => p.status === 'Concluído');
  const allCompletedTasks = completedProjects.flatMap((p) => p.tasks);
  const totalFinishedTasks = allCompletedTasks.filter((t) => t.completed).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.metricsCardHistory}>
        <Text style={styles.metricsTitleHistory}>📊 Métricas de Execução & Histórico</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValueHistory}>{completedProjects.length}</Text>
            <Text style={styles.metricLabel}>Projetos Entregues</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValueHistory}>{totalFinishedTasks}</Text>
            <Text style={styles.metricLabel}>Subtarefas Finalizadas</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionMainTitle}>Projetos Encerrados</Text>

      {completedProjects.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum projeto finalizado no histórico.</Text>
      ) : (
        completedProjects.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.softBadgeConcluded}>
                <Text style={styles.softBadgeTextConcluded}>Concluído</Text>
              </View>
            </View>
            <Text style={styles.cardOwnerText}>👤 Responsável: {item.owner}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Prazo: {item.dueDate}</Text>
              <Text style={styles.cardFooterText}>{item.tasks.length} subtarefas</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// --- TELA DE DETALHES, EDIÇÃO DE PROJETO E EDIÇÃO DE SUBTAREFAS ---
function ProjectDetailsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const project = useProjectStore((state) => state.projects.find((p) => p.id === projectId));
  const { updateProject, removeProject, updateProjectStatus, addTask, toggleTask, removeTask, updateTask } = useProjectStore();

  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projOwner, setProjOwner] = useState('');
  const [projPriority, setProjPriority] = useState('Média');
  const [projDueDate, setProjDueDate] = useState('');
  const [projDescription, setProjDescription] = useState('');
  const [projNotes, setProjNotes] = useState('');

  const [taskText, setTaskText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('');
  const [notes, setNotes] = useState('');

  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (project) {
      setProjTitle(project.title);
      setProjOwner(project.owner || '');
      setProjPriority(project.priority || 'Média');
      setProjDueDate(project.dueDate || '');
      setProjDescription(project.description || '');
      setProjNotes(project.notes || '');
    }
  }, [project]);

  if (!project) return null;

  const handleSaveProjectEdits = () => {
    if (projTitle.trim()) {
      updateProject(project.id, {
        title: projTitle.trim(),
        owner: projOwner.trim(),
        priority: projPriority,
        dueDate: projDueDate.trim(),
        description: projDescription.trim(),
        notes: projNotes.trim(),
      });
      setIsEditingProject(false);
    }
  };

  const handleAddTask = () => {
    if (taskText.trim()) {
      addTask(project.id, taskText.trim(), assignee.trim(), taskDueDate.trim(), taskDueTime.trim(), notes.trim());
      setTaskText('');
      setAssignee('');
      setTaskDueDate('');
      setTaskDueTime('');
      setNotes('');
    }
  };

  const handleSaveEditedTask = () => {
    if (editingTask) {
      updateTask(project.id, editingTask.id, editingTask);
      setEditingTask(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeaderTitle}>Painel do Item</Text>
        <TouchableOpacity
          style={styles.btnEditToggle}
          onPress={() => {
            if (isEditingProject) handleSaveProjectEdits();
            else setIsEditingProject(true);
          }}
        >
          <Text style={styles.btnEditToggleText}>
            {isEditingProject ? 'Salvar Projeto' : 'Editar Projeto'}
          </Text>
        </TouchableOpacity>
      </View>

      {isEditingProject ? (
        <View style={styles.editCard}>
          <Text style={styles.fieldLabel}>Título:</Text>
          <TextInput style={styles.input} value={projTitle} onChangeText={setProjTitle} />

          <Text style={styles.fieldLabel}>Responsável:</Text>
          <TextInput style={styles.input} value={projOwner} onChangeText={setProjOwner} />

          <Text style={styles.fieldLabel}>Prioridade:</Text>
          <View style={styles.prioritySelectorRow}>
            {['Baixa', 'Média', 'Alta'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.priorityBtn, projPriority === p && { backgroundColor: getPriorityColor(p), borderColor: getPriorityColor(p) }]}
                onPress={() => setProjPriority(p)}
              >
                <Text style={[styles.priorityBtnText, projPriority === p && { color: '#FFF', fontWeight: 'bold' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Prazo Geral:</Text>
          <TextInput style={styles.input} value={projDueDate} onChangeText={setProjDueDate} />

          <Text style={styles.fieldLabel}>Descrição:</Text>
          <TextInput style={[styles.input, styles.textArea]} value={projDescription} onChangeText={setProjDescription} multiline numberOfLines={2} />

          <Text style={styles.fieldLabel}>Anotações Gerais / Links:</Text>
          <TextInput style={[styles.input, styles.textArea]} value={projNotes} onChangeText={setProjNotes} multiline numberOfLines={3} />
        </View>
      ) : (
        <View style={styles.viewCard}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.cardOwnerText}>👤 Responsável: {project.owner}</Text>
          <Text style={styles.projectDueDate}>🗓 Prazo Geral: {project.dueDate}</Text>
          {project.description ? <Text style={styles.projectDescription}>{project.description}</Text> : null}

          {project.notes ? (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>A    
