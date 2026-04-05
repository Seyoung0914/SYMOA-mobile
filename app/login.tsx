import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, clearError } = useAuthStore();

    const handleLogin = async () => {
        const success = await login(email, password);
        if (success) {
            router.replace('/notes');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    <Text style={styles.logo}>📌 SyncStick</Text>
                    <Text style={styles.subtitle}>Sign in to sync your notes</Text>

                    {error ? (
                        <TouchableOpacity onPress={clearError} style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </TouchableOpacity>
                    ) : null}

                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor="#6c7086"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                    />

                    <Text style={styles.label}>PASSWORD</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#6c7086"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/signup')}>
                        <Text style={styles.switchText}>
                            Don't have an account? <Text style={styles.linkText}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1a',
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#1e1e2e',
        borderRadius: 20,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    logo: {
        fontSize: 28,
        fontWeight: '700',
        color: '#a78bfa',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#6c7086',
        textAlign: 'center',
        marginBottom: 28,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#a6adc8',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#0f0f1a',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: 14,
        color: '#cdd6f4',
        fontSize: 14,
    },
    button: {
        backgroundColor: '#6366f1',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    switchText: {
        textAlign: 'center',
        color: '#6c7086',
        fontSize: 13,
        marginTop: 20,
    },
    linkText: {
        color: '#6366f1',
        fontWeight: '600',
    },
    errorBox: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    errorText: {
        color: '#fca5a5',
        fontSize: 13,
    },
});
