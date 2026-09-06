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
import * as Notifications from 'expo-notifications';
import { useProjectStore } from '../store/useProjectStore';

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Alta': return '#EF4444';
    case 'Média': return '#F59E0B';
    default: return '#10B981';
  }
};

export default function HomeScreen({ navigation }) {
  const { projects, addProject } = useProjectStore();
  const [modalVisible, setModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [priority, setPriority] = useState('Média');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Notifications.requestPermissionsAsync();
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
              <Text style={styles.cardFooterText}>{item.tasks.length} subtarefas</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Novo Item / Projeto</Text>

              <TextInput style={styles.input} placeholder="Nome do Projeto *" value={title} onChangeText={setTitle} />
              <TextInput style={styles.input} placeholder="Responsável" value={owner} onChangeText={setOwner} />

              <Text style={styles.labelTitle}>Prioridade:</Text>
              <View style={styles.prioritySelectorRow}>
                {['Baixa', 'Média', 'Alta'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityBtn, priority === p && { backgroundColor: getPriorityColor(p), borderColor: getPriorityColor(p) }]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.priorityBtnText, priority === p && { color: '#FFFFFF', fontWeight: 'bold' }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={styles.input} placeholder="Prazo" value={dueDate} onChangeText={setDueDate} />
              <TextInput style={[styles.input, styles.textArea]} placeholder="Descrição resumida" multiline value={description} onChangeText={setDescription} />
              <TextInput style={[styles.input, styles.textArea]} placeholder="Anotações Gerais / Links" multiline value={notes} onChangeText={setNotes} />

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollPadding: { padding: 16 },
  metricsCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  metricsTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 10 },
  progressBarBackground: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6' },
  progressText: { fontSize: 12, color: '#6B7280', marginTop: 6, textAlign: 'right' },
  metricsGrid: { flexDirection: 'row', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  metricLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionMainTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  historyLinkText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  cardOwnerText: { fontSize: 13, color: '#4B5563', marginTop: 4 },
  cardDescription: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cardFooterText: { fontSize: 12, color: '#9CA3AF' },
  badgePriority: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePriorityText: { fontSize: 12, fontWeight: 'bold' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#374151', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#FFFFFF', fontSize: 26 },
  labelTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  prioritySelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priorityBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, alignItems: 'center' },
  priorityBtnText: { color: '#6B7280', fontSize: 13 },
  cardForm: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 8 },
  textArea: { height: 60, textAlignVertical: 'top' },
  btnPrimary: { backgroundColor: '#374151', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '600' },
  btnSecondary: { padding: 12 },
  btnSecondaryText: { color: '#6B7280' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 20 },
  modalScrollContent: { justifyContent: 'center', flexGrow: 1 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
