import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import TermsModal from '../ui/TermsModal';
import PasswordInput from '../ui/PasswordInput';
import Input from '../ui/Input';

const LoginPage: React.FC = () => {
    const { login, resetPassword } = useAuth();
    const { data } = useData();
    const { showToast } = useToast();
    
    const [password, setPassword] = useState('');
    const [isForgotModalOpen, setForgotModalOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const success = await login(password);
            if (!success) {
                showToast('Incorrect password.', 'error');
            }
        } catch (error) {
            showToast('An error occurred during login.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!securityAnswer || !newPassword) {
            showToast('Please fill in all fields.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters.', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showToast('New passwords do not match.', 'error');
            return;
        }
        
        const success = await resetPassword(securityAnswer, newPassword);
        if (success) {
            showToast('Password reset successfully! You can now log in.', 'success');
            setForgotModalOpen(false);
            setSecurityAnswer('');
            setNewPassword('');
            setConfirmNewPassword('');
        } else {
            showToast('Security answer is incorrect.', 'error');
        }
    };

    return (
        <>
            <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
            <Modal isOpen={isForgotModalOpen} onClose={() => setForgotModalOpen(false)} title="Reset Password">
                <div className="space-y-4">
                    <div>
                        <p className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Your Security Question:</p>
                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                            {data.auth?.securityQuestion}
                        </p>
                    </div>
                    <Input
                        label="Your Answer"
                        id="reset-answer"
                        value={securityAnswer}
                        onChange={e => setSecurityAnswer(e.target.value)}
                    />
                     <PasswordInput
                        label="New Password (min. 6 characters)"
                        id="reset-new-password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                     <PasswordInput
                        label="Confirm New Password"
                        id="reset-confirm-password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setForgotModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleResetPassword}>Reset Password</Button>
                    </div>
                </div>
            </Modal>

            <div className="min-h-screen text-slate-800 dark:text-slate-200 font-sans flex items-center justify-center p-4">
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden">
                    <div className="animated-blob blob-1 bg-sky-300 dark:bg-sky-900"></div>
                    <div className="animated-blob blob-2 bg-teal-300 dark:bg-teal-900"></div>
                </div>
                <div className="w-full max-w-sm z-10">
                     <div className="text-center mb-4">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome, {data.auth?.username}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-300">PM Poshan Pro</p>
                    </div>
                    <Card>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <PasswordInput
                                label="Password"
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setForgotModalOpen(true)}
                                className="block w-full text-center text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 text-xs pt-1"
                            >
                                Forgot Password?
                            </button>
                        </form>
                    </Card>
                     <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => setIsTermsModalOpen(true)}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
                        >
                            View Terms and Conditions
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;