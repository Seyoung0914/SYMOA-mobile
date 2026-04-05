import { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { supabase } from '@/lib/supabaseClient';
import type { Note } from '@/types/note';
import { NOTE_COLORS } from '@/types/note';

export default function NotesScreen() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { notes, setNotes, addNote, updateNote, removeNote } = useNotesStore();
    const [refreshing, setRefreshing] = React.useState(false);

    const fetchNotes = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('notes')
            .select('*')
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });
        if (data) setNotes(data as Note[]);
    }, [user, setNotes]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    // Realtime subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('mobile-notes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, (p) => addNote(p.new as Note))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, (p) => {
                const updated = p.new as Note;
                if (updated.deleted_at) removeNote(updated.id);
                else updateNote(updated.id, updated);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, (p) => removeNote((p.old as Note).id))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, addNote, updateNote, removeNote]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotes();
        setRefreshing(false);
    };

    const createNote = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('notes')
            .insert({ user_id: user.id, content: '', color: 'yellow', x_position: 100, y_position: 100, width: 250, height: 200, is_pinned: false })
            .select()
            .single();
        if (!error && data) {
            addNote(data as Note);
            router.push(`/note/${(data as Note).id}`);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const getPreview = (content: string) => {
        if (!content) return 'Empty note';
        // Strip HTML tags for a clean preview
        const stripped = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        const firstLine = stripped.split('\n').find((l) => l.trim().length > 0)?.trim() || 'Empty note';
        return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    };

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            style={[styles.noteItem, { borderLeftColor: NOTE_COLORS[item.color].header }]}
            onPress={() => router.push(`/note/${item.id}`)}
            activeOpacity={0.7}
        >
            <View style={[styles.colorDot, { backgroundColor: NOTE_COLORS[item.color].bg }]} />
            <View style={styles.noteContent}>
                <Text style={styles.noteText} numberOfLines={1}>{getPreview(item.content)}</Text>
                <Text style={styles.noteTime}>{formatTime(item.updated_at)}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📌 SyncStick</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Note List */}
            <FlatList
                data={notes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📝</Text>
                        <Text style={styles.emptyTitle}>No notes yet</Text>
                        <Text style={styles.emptyText}>Tap + to create your first note</Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={createNote} activeOpacity={0.85}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

import React from 'react';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#1e1e2e',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#a78bfa',
    },
    logoutBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    logoutText: {
        color: '#a6adc8',
        fontSize: 13,
        fontWeight: '600',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    noteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e1e2e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    noteContent: {
        flex: 1,
    },
    noteText: {
        color: '#cdd6f4',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    noteTime: {
        color: '#6c7086',
        fontSize: 11,
    },
    chevron: {
        color: '#6c7086',
        fontSize: 20,
        marginLeft: 8,
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#a6adc8',
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 13,
        color: '#6c7086',
    },
    fab: {
        position: 'absolute',
        bottom: 36,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '300',
        marginTop: -2,
    },
});
