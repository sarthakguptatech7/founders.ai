'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

// ===== FILE TREE COMPONENT =====
function FileTree({ files, selectedFile, onSelect }: {
    files: { path: string; purpose: string }[];
    selectedFile: string | null;
    onSelect: (path: string) => void;
}) {
    const getIcon = (path: string) => {
        if (path.endsWith('.html')) return '🌐';
        if (path.endsWith('.css')) return '🎨';
        if (path.endsWith('.js')) return '⚡';
        if (path.endsWith('.json')) return '📋';
        return '📄';
    };

    return (
        <div style={{ padding: 12 }}>
            <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, padding: '0 8px',
            }}>
                PROJECT FILES
            </div>
            {files.map(file => (
                <button
                    key={file.path}
                    onClick={() => onSelect(file.path)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '8px 12px', border: 'none', borderRadius: 6,
                        background: selectedFile === file.path ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: selectedFile === file.path ? 'var(--accent-purple-light)' : 'var(--text-secondary)',
                        cursor: 'pointer', textAlign: 'left', fontSize: 12,
                        fontFamily: 'var(--font-mono)', transition: 'all 0.15s',
                    }}
                >
                    <span>{getIcon(file.path)}</span>
                    <span style={{ flex: 1 }}>{file.path}</span>
                </button>
            ))}
        </div>
    );
}

// ===== CODE VIEWER COMPONENT =====
function CodeViewer({ code, filePath }: { code: string; filePath: string }) {
    const lines = code.split('\n');

    return (
        <div style={{
            background: '#0d0d0d', borderRadius: 8, overflow: 'auto', height: '100%',
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
        }}>
            {/* File header */}
            <div style={{
                padding: '8px 16px', borderBottom: '1px solid var(--border-primary)',
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(124,58,237,0.08)', position: 'sticky', top: 0,
            }}>
                <span style={{ fontSize: 12 }}>
                    {filePath.endsWith('.html') ? '🌐' : filePath.endsWith('.css') ? '🎨' : '⚡'}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{filePath}</span>
            </div>
            {/* Code lines */}
            <div style={{ padding: '8px 0' }}>
                {lines.map((line, i) => (
                    <div key={i} style={{ display: 'flex', minHeight: 20 }}>
                        <span style={{
                            width: 48, textAlign: 'right', paddingRight: 16,
                            color: 'var(--text-muted)', userSelect: 'none', flexShrink: 0,
                        }}>
                            {i + 1}
                        </span>
                        <pre style={{
                            margin: 0, paddingRight: 16, color: 'var(--text-secondary)',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                        }}>
                            {line || ' '}
                        </pre>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ===== BUILD PROGRESS COMPONENT =====
function BuildProgress({ status, message }: { status: string; message: string }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', textAlign: 'center', padding: 40,
        }}>
            <div className="glass-card" style={{ padding: 24, marginBottom: 24, borderTop: '2px solid #FFFFFF' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Architecture Overview
                </h3>
                <div className="spinner" style={{ width: 24, height: 24 }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                {status === 'building' ? 'Building Infrastructure...' : 'Applying Infrastructure Edits...'}
            </h3>
            <p style={{
                fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400,
                fontFamily: 'var(--font-mono)', lineHeight: 1.6,
            }}>
                {message}
            </p>
        </div>
    );
}

// ===== MAIN TECH BUILD TAB =====
export default function TechBuildTab() {
    const {
        businessProfile, techProject, techFiles, techBuildStatus, techBuildMessage,
        techSelectedFile, techFileContent, techEditHistory,
        setTechProject, setTechFiles, setTechBuildStatus, setTechBuildMessage,
        setTechSelectedFile, setTechFileContent, addTechEdit,
    } = useAppStore();

    const [editInput, setEditInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployUrl, setDeployUrl] = useState<string | null>(null);

    // ===== BUILD PROJECT =====
    const handleBuild = useCallback(async () => {
        if (!businessProfile) return;

        setTechBuildStatus('building');
        setTechBuildMessage('Starting build...');

        try {
            const res = await fetch('/api/tech/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: businessProfile }),
            });

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            const collectedFiles: { path: string; purpose: string; content: string }[] = [];

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const event = JSON.parse(line.slice(6));
                                if (event.type === 'planning' || event.type === 'generating_file') {
                                    setTechBuildMessage(event.message);
                                } else if (event.type === 'file_ready') {
                                    // Collect each file as it arrives
                                    collectedFiles.push({
                                        path: event.path,
                                        purpose: event.purpose,
                                        content: event.content,
                                    });
                                    setTechBuildMessage(`Generated ${event.path}`);
                                } else if (event.type === 'complete' && event.project) {
                                    setTechProject({
                                        id: event.project.id,
                                        name: event.project.name,
                                        scope: event.project.scope,
                                        status: event.project.status,
                                        currentVersion: event.project.currentVersion,
                                        previewReady: event.project.previewReady,
                                    });
                                    // Use collected files
                                    setTechFiles(collectedFiles);
                                    setTechBuildStatus('ready');
                                    setTechBuildMessage('Website generated!');
                                } else if (event.type === 'error') {
                                    setTechBuildStatus('error');
                                    setTechBuildMessage(event.message);
                                }
                            } catch {
                                // SSE parse error — skip
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setTechBuildStatus('error');
            setTechBuildMessage((err as Error).message);
        }
    }, [businessProfile, setTechProject, setTechFiles, setTechBuildStatus, setTechBuildMessage]);

    // ===== SELECT FILE =====
    const handleSelectFile = useCallback((path: string) => {
        setTechSelectedFile(path);
        setViewMode('code');
        const file = techFiles.find(f => f.path === path);
        setTechFileContent(file?.content || '// File content not available');
    }, [techFiles, setTechSelectedFile, setTechFileContent]);

    // ===== EDIT PROJECT =====
    const handleEdit = useCallback(async () => {
        if (!techProject || !editInput.trim() || isEditing) return;

        setIsEditing(true);
        setTechBuildStatus('editing');
        setTechBuildMessage('Applying edit...');
        addTechEdit(editInput);
        const cmd = editInput;
        setEditInput('');

        try {
            const res = await fetch('/api/tech/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: techProject.id, editCommand: cmd }),
            });

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const event = JSON.parse(line.slice(6));
                                if (event.type === 'progress') {
                                    setTechBuildMessage(event.message);
                                } else if (event.type === 'complete') {
                                    setTechBuildStatus('ready');
                                    setTechBuildMessage('Edit applied!');
                                    // Refresh iframe
                                    if (iframeRef.current) {
                                        iframeRef.current.src = iframeRef.current.src;
                                    }
                                    // Refresh file if selected
                                    if (techSelectedFile) {
                                        handleSelectFile(techSelectedFile);
                                    }
                                }
                            } catch {
                                // skip
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setTechBuildStatus('ready');
            setTechBuildMessage(`Edit failed: ${(err as Error).message}`);
        } finally {
            setIsEditing(false);
        }
    }, [techProject, editInput, isEditing, techSelectedFile, addTechEdit, setTechBuildStatus, setTechBuildMessage, handleSelectFile]);

    // ===== AUTO-BUILD on first render if no project =====
    useEffect(() => {
        if (businessProfile && techBuildStatus === 'idle' && !techProject) {
            handleBuild();
        }
    }, [businessProfile, techBuildStatus, techProject, handleBuild]);

    // Build a self-contained HTML preview from client-side file content
    const previewHtml = (() => {
        const indexFile = techFiles.find(f => f.path === 'index.html');
        if (!indexFile?.content) return '';

        let html = indexFile.content;

        // Inline CSS: replace <link href="styles.css"> with <style>...</style>
        const cssFile = techFiles.find(f => f.path === 'styles.css');
        if (cssFile?.content) {
            html = html.replace(
                /<link[^>]*href=["']styles\.css["'][^>]*\/?>/gi,
                `<style>${cssFile.content}</style>`
            );
        }

        // Inline JS: replace <script src="script.js"></script> with <script>...</script>
        const jsFile = techFiles.find(f => f.path === 'script.js');
        if (jsFile?.content) {
            html = html.replace(
                /<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi,
                `<script>${jsFile.content}<\/script>`
            );
        }

        return html;
    })();

    // ===== DEPLOY TO VERCEL =====
    const handleDeploy = useCallback(async () => {
        if (!techProject || isDeploying || techFiles.length === 0) return;
        setIsDeploying(true);
        setDeployUrl(null);
        try {
            const res = await fetch('/api/tech/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName: techProject.name,
                    files: techFiles.filter(f => f.content).map(f => ({ path: f.path, content: f.content })),
                }),
            });
            const data = await res.json();
            if (data.success && data.url) {
                setDeployUrl(data.url);
                window.open(data.url, '_blank');
            } else {
                alert(data.error || 'Deploy failed');
            }
        } catch (err) {
            alert('Deploy failed: ' + (err as Error).message);
        } finally {
            setIsDeploying(false);
        }
    }, [techProject, isDeploying, techFiles]);

    // ===== BUILDING STATE =====
    if (techBuildStatus === 'building' || techBuildStatus === 'editing') {
        return <BuildProgress status={techBuildStatus} message={techBuildMessage} />;
    }

    // ===== ERROR STATE =====
    if (techBuildStatus === 'error') {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100%', textAlign: 'center', padding: 40,
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#EF4444' }}>Build Failed</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 500 }}>
                    {techBuildMessage}
                </p>
                <button className="btn-primary" onClick={handleBuild}>Retry Build</button>
            </div>
        );
    }

    // ===== IDLE / NOT STARTED STATE =====
    if (!techProject || techBuildStatus === 'idle') {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100%', textAlign: 'center', padding: 40,
            }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Core Tech Stack</h4>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Tech Agent — Website Builder</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 500, lineHeight: 1.7 }}>
                    The Tech Agent will analyze your business profile and generate a complete, production-ready website with live preview.
                </p>
                <motion.button
                    className="btn-primary"
                    onClick={handleBuild}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ padding: '14px 36px', fontSize: 15 }}
                >
                    🚀 Build Website
                </motion.button>
            </div>
        );
    }

    // ===== READY STATE — Split Pane Layout =====
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px', borderBottom: '1px solid var(--border-primary)',
                background: 'rgba(3,3,3,0.5)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent-purple-light)' }}>
                        {techProject.name}
                    </span>
                    <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4,
                        background: 'rgba(16,185,129,0.15)', color: '#10B981',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        v{techProject.currentVersion}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button
                        onClick={() => setViewMode('preview')}
                        style={{
                            padding: '4px 12px', fontSize: 11, fontFamily: 'var(--font-mono)',
                            background: viewMode === 'preview' ? 'rgba(124,58,237,0.2)' : 'transparent',
                            border: `1px solid ${viewMode === 'preview' ? 'var(--accent-purple)' : 'var(--border-primary)'}`,
                            borderRadius: 4, cursor: 'pointer',
                            color: viewMode === 'preview' ? 'var(--accent-purple-light)' : 'var(--text-tertiary)',
                        }}
                    >
                        👁 Preview
                    </button>
                    <button
                        onClick={() => setViewMode('code')}
                        style={{
                            padding: '4px 12px', fontSize: 11, fontFamily: 'var(--font-mono)',
                            background: viewMode === 'code' ? 'rgba(124,58,237,0.2)' : 'transparent',
                            border: `1px solid ${viewMode === 'code' ? 'var(--accent-purple)' : 'var(--border-primary)'}`,
                            borderRadius: 4, cursor: 'pointer',
                            color: viewMode === 'code' ? 'var(--accent-purple-light)' : 'var(--text-tertiary)',
                        }}
                    >
                        {'</>'} Code
                    </button>
                    <button
                        onClick={() => {
                            if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
                        }}
                        style={{
                            padding: '4px 12px', fontSize: 11, fontFamily: 'var(--font-mono)',
                            background: 'transparent', border: '1px solid var(--border-primary)',
                            borderRadius: 4, cursor: 'pointer', color: 'var(--text-tertiary)',
                        }}
                    >
                        ↻ Refresh
                    </button>
                    <button
                        onClick={() => {
                            setTechBuildStatus('idle');
                            setTechProject(null as any);
                            setTechFiles([]);
                            setTechFileContent('');
                            setTechSelectedFile(null);
                            setTimeout(() => handleBuild(), 100);
                        }}
                        style={{
                            padding: '4px 12px', fontSize: 11, fontFamily: 'var(--font-mono)',
                            background: 'transparent', border: '1px solid var(--border-primary)',
                            borderRadius: 4, cursor: 'pointer', color: 'var(--text-tertiary)',
                        }}
                    >
                        🔄 Rebuild
                    </button>
                    <motion.button
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            padding: '4px 16px', fontSize: 11, fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: isDeploying ? 'var(--bg-card)' : '#FFFFFF',
                            border: '1px solid ' + (isDeploying ? 'var(--border-primary)' : '#FFFFFF'),
                            borderRadius: 4, cursor: isDeploying ? 'wait' : 'pointer',
                            color: isDeploying ? 'var(--text-tertiary)' : '#000000',
                        }}
                    >
                        {isDeploying ? 'Deploying...' : deployUrl ? 'Deployed' : 'Deploy to Vercel'}
                    </motion.button>
                    {deployUrl && (
                        <a href={deployUrl} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: 10, color: '#06B6D4', fontFamily: 'var(--font-mono)',
                            textDecoration: 'underline', padding: '4px 8px',
                        }}>
                            {deployUrl.replace('https://', '')}
                        </a>
                    )}
                </div>
            </div>

            {/* Content area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* File tree sidebar */}
                <div style={{
                    width: 200, borderRight: '1px solid var(--border-primary)',
                    overflow: 'auto', background: 'rgba(3,3,3,0.3)',
                    flexShrink: 0,
                }}>
                    <FileTree
                        files={techFiles}
                        selectedFile={techSelectedFile}
                        onSelect={handleSelectFile}
                    />
                    {/* Edit history */}
                    {techEditHistory.length > 0 && (
                        <div style={{ padding: 12, borderTop: '1px solid var(--border-primary)' }}>
                            <div style={{
                                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                                letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
                            }}>
                                EDIT HISTORY
                            </div>
                            {techEditHistory.slice(-5).map((edit, i) => (
                                <div key={i} style={{
                                    fontSize: 11, color: 'var(--text-tertiary)', padding: '4px 0',
                                    borderBottom: '1px solid var(--border-primary)',
                                }}>
                                    <span style={{ color: 'var(--text-primary)' }}>▸</span> {edit.substring(0, 40)}{edit.length > 40 ? '...' : ''}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main content: Preview or Code */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <AnimatePresence mode="wait">
                        {viewMode === 'preview' ? (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <iframe
                                    ref={iframeRef}
                                    srcDoc={previewHtml || '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f9fafb;color:#6b7280;font-family:sans-serif"><p>No preview available — click Rebuild</p></body></html>'}
                                    style={{
                                        width: '100%', height: '100%',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: 8,
                                        background: '#ffffff',
                                    }}
                                    title="Website Preview"
                                    sandbox="allow-scripts"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="code"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ width: '100%', height: '100%', overflow: 'auto' }}
                            >
                                {techSelectedFile && techFileContent ? (
                                    <CodeViewer code={techFileContent} filePath={techSelectedFile} />
                                ) : (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                                        fontSize: 13,
                                    }}>
                                        Select a file to view its code
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom edit bar */}
            <div style={{
                padding: '10px 16px', borderTop: '1px solid var(--border-primary)',
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(3,3,3,0.5)',
            }}>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>EDIT</span>
                <input
                    type="text"
                    value={editInput}
                    onChange={(e) => setEditInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(); }}
                    placeholder="Type an edit: 'make the header bigger', 'change theme to dark', 'add testimonials section'..."
                    disabled={isEditing}
                    style={{
                        flex: 1, padding: '10px 16px', border: '1px solid var(--border-primary)',
                        borderRadius: 8, background: 'var(--bg-glass)', color: 'var(--text-primary)',
                        fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
                    }}
                />
                <motion.button
                    onClick={handleEdit}
                    disabled={!editInput.trim() || isEditing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        padding: '10px 20px', borderRadius: 8, border: '1px solid #FFFFFF',
                        background: '#FFFFFF',
                        color: '#000000', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        opacity: !editInput.trim() || isEditing ? 0.5 : 1,
                    }}
                >
                    Apply Edit
                </motion.button>
            </div>
        </div>
    );
}
