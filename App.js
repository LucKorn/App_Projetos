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
      name: 'monday-projects-full-v8',
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

      {/* MODAL MONDAY COMPLETO DE CRIAÇÃO */}
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
              <Text style={styles.notesTitle}>Anotações Gerais / Links:</Text>
              <Text style={styles.notesBody}>{project.notes}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Alteração de Status */}
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

      {/* Form de Tarefa */}
      <Text style={styles.sectionMainTitle}>Adicionar Subtarefa</Text>
      <View style={styles.cardForm}>
        <TextInput
          style={styles.input}
          placeholder="Descrição da subtarefa *"
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
          placeholder="Observações da subtarefa"
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAddTask}>
          <Text style={styles.btnPrimaryText}>Adicionar Subtarefa</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Subtarefas */}
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

      <TouchableOpacity
        style={styles.btnOutlineDanger}
        onPress={() => {
          removeProject(project.id);
          navigation.goBack();
        }}
      >
        <Text style={styles.btnOutlineDangerText}>Remover Projeto</Text>
      </TouchableOpacity>

      {/* Modal Editar Subtarefa */}
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

// --- NAVEGAÇÃO CENTRAL ---
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
            headerTitleStyle: { fontWeight: '600', fontSize: 17 },
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

// --- ESTILOS VISUAIS TEMA CLARO MINIMALISTA ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollPadding: { padding: 16 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginVertical: 20 },

  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricsCardHistory: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  metricsTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 10 },
  metricsTitleHistory: { fontSize: 15, fontWeight: '600', color: '#065F46', marginBottom: 10 },
  progressBarBackground: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6' },
  progressText: { fontSize: 12, color: '#6B7280', marginTop: 6, textAlign: 'right' },
  metricsGrid: { flexDirection: 'row', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  metricValueHistory: { fontSize: 20, fontWeight: '700', color: '#059669' },
  metricLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionMainTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginVertical: 8 },
  historyLinkText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  cardOwnerText: { fontSize: 13, color: '#4B5563', marginTop: 4, fontWeight: '500' },
  cardDescription: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cardFooterText: { fontSize: 12, color: '#9CA3AF' },

  badgePriority: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePriorityText: { fontSize: 12, fontWeight: 'bold' },

  softBadgeConcluded: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  softBadgeTextConcluded: { fontSize: 12, color: '#065F46', fontWeight: '500' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#374151',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 26, fontWeight: '300' },

  labelTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 4, marginTop: 4 },
  prioritySelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priorityBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, alignItems: 'center' },
  priorityBtnText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  btnEditToggle: { backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnEditToggleText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },

  viewCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  editCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#3B82F6', marginBottom: 16 },

  statusSegmented: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 3, marginVertical: 12 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentText: { fontSize: 13, color: '#6B7280' },

  cardForm: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827', marginBottom: 8 },
  textArea: { height: 60, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 8 },

  btnPrimary: { backgroundColor: '#374151', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  btnSecondary: { padding: 12 },
  btnSecondaryText: { color: '#6B7280', fontWeight: '500' },

  taskCardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkIcon: { fontSize: 12, color: '#374151', fontWeight: 'bold' },
  taskTitle: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  taskCompleted: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskSubtext: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  taskNotesText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  deleteIconText: { fontSize: 16, color: '#9CA3AF', paddingHorizontal: 8 },

  notesContainer: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 8 },
  notesTitle: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
  notesBody: { fontSize: 13, color: '#6B7280' },

  btnOutlineDanger: { marginTop: 24, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnOutlineDangerText: { color: '#EF4444', fontSize: 14, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 20 },
  modalScrollContent: { justifyContent: 'center', flexGrow: 1 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },

  projectTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  projectDescription: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  projectDueDate: { fontSize: 13, color: '#4B5563', fontWeight: '500', marginTop: 6 },
});
