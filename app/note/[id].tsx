import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { useNotesStore } from '@/stores/useNotesStore';
import { supabase } from '@/lib/supabaseClient';
import type { NoteColor } from '@/types/note';
import { NOTE_COLORS } from '@/types/note';

export default function NoteDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const note = useNotesStore((s) => s.notes.find((n) => n.id === id));
    const updateNoteInStore = useNotesStore((s) => s.updateNote);
    const removeNote = useNotesStore((s) => s.removeNote);

    const [content, setContent] = useState(note?.content ?? '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const webviewRef = useRef<WebView>(null);
    const isExternalUpdate = useRef(false);

    useEffect(() => {
        if (note && note.content !== content) {
            isExternalUpdate.current = true;
            setContent(note.content);
            // Update WebView content
            webviewRef.current?.injectJavaScript(`
                if (document.getElementById('editor').innerHTML !== ${JSON.stringify(note.content)}) {
                    document.getElementById('editor').innerHTML = ${JSON.stringify(note.content)};
                }
                true;
            `);
            isExternalUpdate.current = false;
        }
    }, [note?.content]);

    const saveContent = useCallback(
        (text: string) => {
            if (!id) return;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(async () => {
                const { error } = await supabase
                    .from('notes')
                    .update({ content: text })
                    .eq('id', id);
                if (!error && id) updateNoteInStore(id, { content: text });
            }, 500);
        },
        [id, updateNoteInStore]
    );

    const handleMessage = (event: { nativeEvent: { data: string } }) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'content' && !isExternalUpdate.current) {
                setContent(data.html);
                saveContent(data.html);
            }
        } catch {
            // ignore
        }
    };

    const handleColorChange = async (color: NoteColor) => {
        if (!id) return;
        const { error } = await supabase.from('notes').update({ color }).eq('id', id);
        if (!error) updateNoteInStore(id, { color });
    };

    const handleDelete = () => {
        Alert.alert('Delete Note', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (!id) return;
                    await supabase.from('notes').delete().eq('id', id);
                    removeNote(id);
                    router.back();
                },
            },
        ]);
    };

    const editorHTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #1e1e2e;
    color: #cdd6f4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    padding: 16px;
    min-height: 100vh;
  }
  #editor {
    outline: none;
    min-height: calc(100vh - 32px);
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  #editor:empty::before {
    content: 'Type your note...';
    color: rgba(255,255,255,0.3);
    pointer-events: none;
  }
  h1 { font-size: 22px; font-weight: 700; margin: 6px 0; }
  h2 { font-size: 19px; font-weight: 600; margin: 4px 0; }
  h3 { font-size: 16px; font-weight: 600; margin: 4px 0; }
  ol, ul { padding-left: 20px; margin: 4px 0; }
  b, strong { font-weight: 700; }
  i, em { font-style: italic; }
  u { text-decoration: underline; }
  s, strike { text-decoration: line-through; }
  input[type="checkbox"] { margin-right: 6px; }
</style>
</head>
<body>
<div id="editor" contenteditable="true">${content.replace(/`/g, '\\`').replace(/<\/script/g, '<\\/script')}</div>
<script>
  const editor = document.getElementById('editor');
  let debounce = null;
  editor.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'content',
        html: editor.innerHTML
      }));
    }, 300);
  });
  editor.focus();
</script>
</body>
</html>`;

    if (!note) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorMsg}>Note not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>← Back</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
                    <Text style={[styles.headerBtnText, { color: '#dc2626' }]}>Delete</Text>
                </TouchableOpacity>
            </View>

            {/* Color Picker */}
            <View style={styles.colorBar}>
                {(Object.keys(NOTE_COLORS) as NoteColor[]).map((color) => (
                    <TouchableOpacity
                        key={color}
                        style={[
                            styles.colorDot,
                            { backgroundColor: NOTE_COLORS[color].bg },
                            note.color === color && styles.colorDotActive,
                        ]}
                        onPress={() => handleColorChange(color)}
                    />
                ))}
            </View>

            {/* Rich Text Editor via WebView */}
            <WebView
                ref={webviewRef}
                source={{ html: editorHTML }}
                style={styles.editorWrap}
                originWhitelist={['*']}
                onMessage={handleMessage}
                keyboardDisplayRequiresUserAction={false}
                scrollEnabled={true}
                javaScriptEnabled={true}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#1e1e2e',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    headerBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#cdd6f4',
    },
    colorBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 12,
        backgroundColor: '#1e1e2e',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    colorDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorDotActive: {
        borderColor: '#cdd6f4',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    editorWrap: {
        flex: 1,
        backgroundColor: '#1e1e2e',
    },
    errorMsg: {
        color: '#fca5a5',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 100,
    },
    backBtn: {
        alignSelf: 'center',
        marginTop: 20,
        padding: 12,
    },
    backText: {
        color: '#6366f1',
        fontSize: 14,
        fontWeight: '600',
    },
});
