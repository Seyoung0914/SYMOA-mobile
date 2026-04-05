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

export default function SignUpScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);
    const { signUp, loading, error, clearError } = useAuthStore();

    const handleSignUp = async () => {
        setLocalError('');
        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match.');
            return;
        }
        const success = await signUp(email, password);
        if (success) {
            const { session } = useAuthStore.getState();
            if (!session) {
                setNeedsVerification(true);
            } else {
                router.replace('/notes');
            }
        }
    };

    const displayError = localError || error;

    if (needsVerification) {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.card, { alignItems: 'center' }]}>
                        <Text style={{ fontSize: 40, marginBottom: 16 }}>✉️</Text>
                        <Text style={[styles.logo, { fontSize: 22, color: '#fff', marginBottom: 12 }]}>
                            Check your email
                        </Text>
                        <Text style={[styles.subtitle, { lineHeight: 20 }]}>
                            We sent a verification link to <Text style={{ color: '#fff', fontWeight: '600' }}>{email}</Text>.
                            {'\n\n'}
                            Please click the link to verify your account, then return here to sign in.
                        </Text>

                        <TouchableOpacity
                            style={[styles.button, { width: '100%' }]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.buttonText}>Go to Login</Text>
                        </TouchableOpacity>

                        <Text style={[styles.switchText, { marginTop: 24, fontSize: 12 }]}>
                            Didn't receive an email? Check your spam folder.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

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
                    <Text style={styles.subtitle}>Create your account</Text>

                    {displayError ? (
                        <TouchableOpacity onPress={() => { clearError(); setLocalError(''); }} style={styles.errorBox}>
                            <Text style={styles.errorText}>{displayError}</Text>
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
                        placeholder="Min. 8 characters"
                        placeholderTextColor="#6c7086"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Text style={styles.label}>CONFIRM PASSWORD</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Repeat password"
                        placeholderTextColor="#6c7086"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.switchText}>
                            Already have an account? <Text style={styles.linkText}>Sign in</Text>
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
