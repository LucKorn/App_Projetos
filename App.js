import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
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
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
}

// --- STORE ZUSTAND ---
const useProjectStore = create(
  persist(
    (set) => ({
      projects: [
        {
          id: '1',
          title: 'Dashboard Filiais',
          owner: 'Luciano Korn',
          priority: 'Alta',
          description: 'Estrutura gerencial do painel',
          dueDate: '15/10/2026',
          notes: 'Verificar conexão com o banco de dados e APIs.',
          status: 'Em Andamento',
          tasks: [
            {
              id: '101',
              text: 'Ajustar telas e componentes',
              assignee: 'Luciano',
              dueDate: '06/10/2026',
              dueTime: '10:00',
              notes: 'Usar estilo minimalista suave',
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
      name: 'projects-complete-modal-light-v1',
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

// --- TELA PRINCIPAL ---
function HomeScreen({ navigation }) {
  const { projects, addProject } = useProjectStore();
  const [modalVisible, setModalVisible] = useState(false);

  // Campos do Modal Completo
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

  const allTasks = activeProjects.flatMap((p) => p.tasks);
  const completedTasksCount = allTasks.filter((t) => t.completed).length;
  const totalTasksCount = allTasks.length;
  const progressPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

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
        {/* Painel de Métricas */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Desempenho Geral</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progressPercentage}% das tarefas concluídas ({completedTasksCount}/{totalTasksCount})
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{allTasks.length}</Text>
              <Text style={styles.metricLabel}>Tarefas Ativas</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{activeProjects.length}</Text>
              <Text style={styles.metricLabel}>Projetos</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionMainTitle}>Projetos Ativos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.historyLinkText}>Ver Histórico ›</Text>
          </TouchableOpacity>
        </View>

        {activeProjects.map((item) => (
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
              <Text style={styles.cardFooterText}>{item.tasks.length} tarefas</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* MODAL COMPLETO DE CRIAÇÃO */}
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

// --- TELA DE HISTÓRICO ---
function HistoryScreen({ navigation }) {
  const { projects } = useProjectStore();
  const completedProjects = projects.filter((p) => p.status === 'Concluído');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      {completedProjects.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum projeto encerrado no histórico.</Text>
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
            <Text style={styles.cardDescription}>{item.description}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// --- TELA DE DETALHES ---
function ProjectDetailsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const project = useProjectStore((state) => state.projects.find((p) => p.id === projectId));
  const { removeProject, updateProjectStatus, addTask, toggleTask, removeTask, updateTask } = useProjectStore();

  const [taskText, setTaskText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('');
  const [notes, setNotes] = useState('');

  const [editingTask, setEditingTask] = useState(null);

  if (!project) return null;

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
      <Text style={styles.projectTitle}>{project.title}</Text>
      <Text style={styles.cardOwnerText}>👤 Responsável: {project.owner}</Text>
      {project.description ? <Text style={styles.projectDescription}>{project.description}</Text> : null}
      <Text style={styles.projectDueDate}>🗓 Prazo Geral: {project.dueDate}</Text>

      {project.notes ? (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Anotações Gerais / Links:</Text>
          <Text style={styles.notesBody}>{project.notes}</Text>
        </View>
      ) : null}

      {/* Seletor de Status */}
      <View style={styles.statusSegmented}>
        {['Pendente', 'Em Andamento', 'Concluído'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.segmentBtn, project.status === st && styles.segmentBtnActive]}
            onPress={() => updateProjectStatus(project.id, st)}
          >
            <Text style={[styles.segmentText, project.status === st && styles.segmentTextActive]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form de Tarefa */}
      <Text style={styles.sectionMainTitle}>Adicionar Tarefa</Text>
      <View style={styles.cardForm}>
        <TextInput
          style={styles.input}
          placeholder="Descrição da tarefa"
          placeholderTextColor="#9CA3AF"
          value={taskText}
          onChangeText={setTaskText}
        />
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Responsável"
            placeholderTextColor="#9CA3AF"
            value={assignee}
            onChangeText={setAssignee}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Data (dd/mm/aaaa)"
            placeholderTextColor="#9CA3AF"
            value={taskDueDate}
            onChangeText={setTaskDueDate}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Hora do Alerta (ex: 09:00)"
          placeholderTextColor="#9CA3AF"
          value={taskDueTime}
          onChangeText={setTaskDueTime}
        />
        <TextInput
          style={styles.input}
          placeholder="Observações da tarefa"
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAddTask}>
          <Text style={styles.btnPrimaryText}>Guardar Tarefa</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Tarefas */}
      <Text style={styles.sectionMainTitle}>Lista de Tarefas</Text>
      {project.tasks.map((t) => (
        <View key={t.id} style={styles.taskCardItem}>
          <TouchableOpacity style={styles.checkCircle} onPress={() => toggleTask(project.id, t.id)}>
            <Text style={styles.checkIcon}>{t.completed ? '✓' : ''}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditingTask(t)}>
            <Text style={[styles.taskTitle, t.completed && styles.taskCompleted]}>{t.text}</Text>
            <Text style={styles.taskSubtext}>
              👤 {t.assignee} {t.dueDate ? `| 🗓 ${t.dueDate} às ${t.dueTime || '09:00'}` : ''}
            </Text>
            {t.notes ? <Text style={styles.taskNotesText}>📝 {t.notes}</Text> : null}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => removeTask(project.id, t.id)}>
            <Text style={styles.deleteIconText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.btnOutlineDanger}
        onPress={() => {
          removeProject(project.id);
          navigation.goBack();
        }}
      >
        <Text style={styles.btnOutlineDangerText}>Remover Projeto</Text>
      </TouchableOpacity>

      {/* Modal Editar Tarefa */}
      {editingTask && (
        <Modal visible animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Tarefa</Text>
              <TextInput
                style={styles.input}
                value={editingTask.text}
                onChangeText={(text) => setEditingTask({ ...editingTask, text })}
              />
              <TextInput
                style={styles.input}
                value={editingTask.assignee}
                onChangeText={(assignee) => setEditingTask({ ...editingTask, assignee })}
              />
              <TextInput
                style={styles.input}
                value={editingTask.dueDate}
                onChangeText={(dueDate) => setEditingTask({ ...editingTask, dueDate })}
              />
              <TextInput
                style={styles.input}
                value={editingTask.notes}
                onChangeText={(notes) => setEditingTask({ ...editingTask, notes })}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setEditingTask(null)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveEditedTask}>
                  <Text style={styles.btnPrimaryText}>Guardar Alterações</Text>
 
