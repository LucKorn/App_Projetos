import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
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
      name: 'monday-projects-v9',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

const Stack = createNativeStackNavigator();

const getPriorityStyle = (priority) => {
  switch (priority) {
    case 'Alta': return { bg: '#FEE2E2', text: '#DC2626' };
    case 'Média': return { bg: '#FEF3C7', text: '#D97706' };
    default: return { bg: '#D1FAE5', text: '#059669' };
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Concluído': return '#10B981';
    case 'Em Andamento': return '#2563EB';
    default: return '#D97706';
  }
};

// --- TELA PRINCIPAL ---
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
          activeProjects.map((item) => {
            const pStyle = getPriorityStyle(item.priority);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.badgePriority, { backgroundColor: pStyle.bg }]}>
                    <Text style={[styles.badgePriorityText, { color: pStyle.text }]}>
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
            );
          })
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
                placeholderTextColor="#6B7280"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={styles.input}
                placeholder="Responsável"
                placeholderTextColor="#6B7280"
                value={owner}
                onChangeText={setOwner}
              />

              <Text style={styles.labelTitle}>Prioridade:</Text>
              <View style={styles.prioritySelectorRow}>
                {['Baixa', 'Média', 'Alta'].map((p) => {
                  const pStyle = getPriorityStyle(p);
                  const isSelected = priority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityBtn,
                        isSelected && { backgroundColor: pStyle.bg, borderColor: pStyle.text },
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityBtnText,
                          isSelected && { color: pStyle.text, fontWeight: 'bold' },
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Prazo (ex: 20/10/2026)"
                placeholderTextColor="#6B7280"
                value={dueDate}
                onChangeText={setDueDate}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descrição resumida"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={2}
                value={description}
                onChangeText={setDescription}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Anotações Gerais / Links / Observações"
                placeholderTextColor="#6B7280"
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

// --- TELA DE DETALHES ---
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

  const confirmDeleteProject = () => {
    Alert.alert(
      'Remover Projeto',
      'Tem certeza que deseja apagar este projeto e todas as suas tarefas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            removeProject(project.id);
            navigation.goBack();
          },
        },
      ]
    );
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
        <View style={styles.headerActionsGroup}>
          {!isEditingProject ? (
            <>
              <TouchableOpacity
                style={styles.btnEditToggle}
                onPress={() => setIsEditingProject(true)}
              >
                <Text style={styles.btnEditToggleText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnTrashIcon} onPress={confirmDeleteProject}>
                <Text style={styles.btnTrashIconText}>🗑️</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>

      {isEditingProject ? (
        <View style={styles.editCard}>
          <Text style={styles.fieldLabel}>Título:</Text>
          <TextInput style={styles.input} value={projTitle} onChangeText={setProjTitle} />

          <Text style={styles.fieldLabel}>Responsável:</Text>
          <TextInput style={styles.input} value={projOwner} onChangeText={setProjOwner} />

          <Text style={styles.fieldLabel}>Prioridade:</Text>
          <View style={styles.prioritySelectorRow}>
            {['Baixa', 'Média', 'Alta'].map((p) => {
              const pStyle = getPriorityStyle(p);
              const isSelected = projPriority === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityBtn,
                    isSelected && { backgroundColor: pStyle.bg, borderColor: pStyle.text },
                  ]}
                  onPress={() => setProjPriority(p)}
                >
                  <Text style={[styles.priorityBtnText, isSelected && { color: pStyle.text, fontWeight: 'bold' }]}>{p}</Text>
                </TouchableOpacity>
              );
                                                     })}
          </View>

          <Text style={styles.fieldLabel}>Prazo Geral:</Text>
          <TextInput style={styles.input} value={projDueDate} onChangeText={setProjDueDate} />

          <Text style={styles.fieldLabel}>Descrição:</Text>
          <TextInput style={[styles.input, styles.textArea]} value={projDescription} onChangeText={setProjDescription} multiline numberOfLines={2} />

          <Text style={styles.fieldLabel}>Anotações Gerais / Links:</Text>
          <TextInput style={[styles.input, styles.textArea]} value={projNotes} onChangeText={setProjNotes} multiline numberOfLines={3} />

          <View style={styles.editActionRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setIsEditingProject(false)}>
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveProjectEdits}>
              <Text style={styles.btnPrimaryText}>Salvar Edição</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.viewCard}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.cardOwnerText}>👤 Responsável: {project.owner}</Text>
          <Text style={styles.projectDueDate}>🗓 Prazo Geral: {project.dueDate}</Text>
          {project.description ? <Text style={styles.projectDescription}>{project.description}</Text> : null}

          {project.notes ? (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>Anotações Gerais / Links:</Text>
              <Text style={styles.notesBody}>{project.notes}</Text>
            </View>
          ) : null}
        </View>
      )}

      <Text style={styles.sectionMainTitle}>Status do Projeto</Text>
      <View style={styles.statusSegmented}>
        {['Pendente', 'Em Andamento', 'Concluído'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.segmentBtn, project.status === st && { backgroundColor: getStatusColor(st) }]}
            onPress={() => updateProjectStatus(project.id, st)}
          >
            <Text style={[styles.segmentText, project.status === st && { color: '#FFFFFF', fontWeight: 'bold' }]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionMainTitle}>Adicionar Subtarefa</Text>
      <View style={styles.cardForm}>
        <TextInput
          style={styles.input}
          placeholder="Descrição da subtarefa *"
          placeholderTextColor="#6B7280"
          value={taskText}
          onChangeText={setTaskText}
        />
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Responsável"
            placeholderTextColor="#6B7280"
            value={assignee}
            onChangeText={setAssignee}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Data (dd/mm/aaaa)"
            placeholderTextColor="#6B7280"
            value={taskDueDate}
            onChangeText={setTaskDueDate}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Hora do Alerta (ex: 09:00)"
          placeholderTextColor="#6B7280"
          value={taskDueTime}
          onChangeText={setTaskDueTime}
        />
        <TextInput
          style={styles.input}
          placeholder="Observações da subtarefa"
          placeholderTextColor="#6B7280"
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAddTask}>
          <Text style={styles.btnPrimaryText}>Adicionar Subtarefa</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionMainTitle}>Subtarefas / Checklist (Toque para editar)</Text>
      {project.tasks.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma subtarefa cadastrada.</Text>
      ) : (
        project.tasks.map((t) => (
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
        ))
      )}

      {editingTask && (
        <Modal visible animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Subtarefa</Text>

              <Text style={styles.fieldLabel}>Descrição:</Text>
              <TextInput
                style={styles.input}
                value={editingTask.text}
                onChangeText={(text) => setEditingTask({ ...editingTask, text })}
              />

              <Text style={styles.fieldLabel}>Responsável:</Text>
              <TextInput
                style={styles.input}
                value={editingTask.assignee}
                onChangeText={(assignee) => setEditingTask({ ...editingTask, assignee })}
              />

              <Text style={styles.fieldLabel}>Prazo:</Text>
              <TextInput
                style={styles.input}
                value={editingTask.dueDate}
                onChangeText={(dueDate) => setEditingTask({ ...editingTask, dueDate })}
              />

              <Text style={styles.fieldLabel}>Observações:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingTask.notes}
                multiline
                numberOfLines={3}
                onChangeText={(notes) => setEditingTask({ ...editingTask, notes })}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setEditingTask(null)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveEditedTask}>
                  <Text style={styles.btnPrimaryText}>Salvar Alterações</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

// --- APP PRINCIPAL ---
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#FAFAFA' },
            headerTintColor: '#1F2937',
            headerTitleStyle: { fontWeight: '700', fontSize: 19 },
            headerTitleAlign: 'center',
            contentStyle: { backgroundColor: '#F3F4F6' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Projetos e Tarefas' }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Histórico de Concluídos' }} />
          <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ title: 'Painel do Item' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// --- ESTILOS COM ELEVAÇÃO E CONTRASTE MELHORADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollPadding: { padding: 16 },
  emptyText: { textAlign: 'center', color: '#4B5563', marginVertical: 20, fontSize: 15 },

  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  metricsCardHistory: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  metricsTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  metricsTitleHistory: { fontSize: 17, fontWeight: '700', color: '#065F46', marginBottom: 12 },
  progressBarBackground: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563EB' },
  progressText: { fontSize: 13, color: '#374151', marginTop: 8, textAlign: 'right', fontWeight: '500' },
  metricsGrid: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  metricValueHistory: { fontSize: 22, fontWeight: '800', color: '#059669' },
  metricLabel: { fontSize: 13, color: '#4B5563', marginTop: 2, fontWeight: '500' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionMainTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginVertical: 10 },
  historyLinkText: { fontSize: 14, color: '#2563EB', fontWeight: '700' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  cardOwnerText: { fontSize: 14, color: '#374151', marginTop: 6, fontWeight: '600' },
  cardDescription: { fontSize: 14, color: '#4B5563', marginTop: 4, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cardFooterText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

  badgePriority: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgePriorityText: { fontSize: 13, fontWeight: '800' },

  softBadgeConcluded: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  softBadgeTextConcluded: { fontSize: 13, color: '#065F46', fontWeight: '700' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#1F2937',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '400' },

  labelTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4, marginTop: 6 },
  prioritySelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priorityBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, alignItems: 'center' },
  priorityBtnText: { color: '#4B5563', fontSize: 14, fontWeight: '600' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#4B5563', textTransform: 'uppercase' },
  headerActionsGroup: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnEditToggle: { backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnEditToggleText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  btnTrashIcon: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  btnTrashIconText: { fontSize: 16 },

  viewCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  editCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2563EB',
    marginBottom: 16,
    elevation: 4,
  },
  editActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },

  statusSegmented: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 10, padding: 4, marginVertical: 12 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },

  cardForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 10,
  },
  textArea: { height: 70, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 8 },

  btnPrimary: { backgroundColor: '#1F2937', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  btnSecondary: { padding: 14, borderRadius: 8, alignItems: 'center' },
  btnSecondaryText: { color: '#4B5563', fontWeight: '700', fontSize: 15 },

  taskCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
  },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#6B7280', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkIcon: { fontSize: 13, color: '#1F2937', fontWeight: 'bold' },
  taskTitle: { fontSize: 15, color: '#111827', fontWeight: '600' },
  taskCompleted: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskSubtext: { fontSize: 13, color: '#374151', marginTop: 3, fontWeight: '500' },
  taskNotesText: { fontSize: 12, color: '#4B5563', marginTop: 3 },
  deleteIconText: { fontSize: 18, color: '#9CA3AF', paddingHorizontal: 8 },

  notesContainer: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 10 },
  notesTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 },
  notesBody: { fontSize: 14, color: '#374151', lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalScrollContent: { justifyContent: 'center', flexGrow: 1 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, elevation: 6 },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#111827', marginBottom: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },

  projectTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  projectDescription: { fontSize: 15, color: '#374151', marginTop: 6, lineHeight: 22 },
  projectDueDate: { fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 8 },
});
        
