import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Badge,
    Button,
    Input,
    Modal,
    Skeleton,
    Tabs,
    Text,
    Textarea,
    Tooltip,
    EmptyState,
    useToast,
    useConfirm,
} from '@agnostos/components';
import { Box, Flex } from '@agnostos/layout';
import {
    Plus,
    Trash2,
    RefreshCw,
    Inbox,
    AlertTriangle,
    Send,
    Activity,
    Pause,
    Play,
    Zap,
    Server,
    Link2,
    Radio,
    Eraser,
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

const RABBIT_BASE = import.meta.env.VITE_RABBIT_SERVICE_URL || 'http://localhost:9090';

interface ConsumedMessage {
    id: string;
    queue: string;
    listenerId: string;
    content: string;
    timestamp: string;
    status: string;
}

interface QueueInfo {
    name: string;
    messageCount: number;
    consumerCount: number;
}

// ---------------------------------------------------------------------------
// API helpers (sin autenticación – el rabbit-service no usa Azure AD)
// ---------------------------------------------------------------------------

async function rabbitFetch<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${RABBIT_BASE}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers || {}),
            },
            ...options,
        });
    } catch {
        throw new Error('No se pudo conectar con el servicio RabbitMQ. Verifica que esté activo en el puerto 9090.');
    }

    if (!res.ok) {
        let message = `Error ${res.status}`;
        try {
            const text = await res.text();
            message = text || message;
        } catch { /* empty */ }
        throw new Error(message);
    }

    if (res.status === 204) return undefined as T;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
}

const RabbitApi = {
    // Queues
    createQueue: (queueName: string) =>
        rabbitFetch<string>(`/api/rabbitmq/queues?queueName=${encodeURIComponent(queueName)}`, { method: 'POST' }),
    getQueueInfo: (queueName: string) =>
        rabbitFetch<QueueInfo>(`/api/rabbitmq/queues/${encodeURIComponent(queueName)}`),
    deleteQueue: (queueName: string) =>
        rabbitFetch<string>(`/api/rabbitmq/queues/${encodeURIComponent(queueName)}`, { method: 'DELETE' }),
    purgeQueue: (queueName: string) =>
        rabbitFetch<string>(`/api/rabbitmq/queues/${encodeURIComponent(queueName)}/purge`, { method: 'POST' }),

    // Exchanges
    createExchange: (exchangeName: string) =>
        rabbitFetch<string>(`/api/rabbitmq/exchanges?exchangeName=${encodeURIComponent(exchangeName)}`, { method: 'POST' }),
    deleteExchange: (exchangeName: string) =>
        rabbitFetch<string>(`/api/rabbitmq/exchanges/${encodeURIComponent(exchangeName)}`, { method: 'DELETE' }),

    // Bindings
    createBinding: (queueName: string, exchangeName: string, routingKey: string) =>
        rabbitFetch<string>(
            `/api/rabbitmq/bindings?queueName=${encodeURIComponent(queueName)}&exchangeName=${encodeURIComponent(exchangeName)}&routingKey=${encodeURIComponent(routingKey)}`,
            { method: 'POST' },
        ),

    // Messages
    sendMessage: (data: { exchange?: string; routingKey?: string; queueName?: string; message: string }) =>
        rabbitFetch<string>('/api/messages/send', { method: 'POST', body: JSON.stringify(data) }),

    // Listeners
    listListeners: () => rabbitFetch<string[]>('/api/listeners'),
    pauseListener: (id: string) => rabbitFetch<string>(`/api/listeners/${encodeURIComponent(id)}/pause`, { method: 'POST' }),
    resumeListener: (id: string) => rabbitFetch<string>(`/api/listeners/${encodeURIComponent(id)}/resume`, { method: 'POST' }),

    // Health
    health: () => rabbitFetch<{ status: string; host?: string; port?: number; virtualHost?: string }>('/api/rabbitmq/health'),
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
    title,
    subtitle,
    icon: Icon,
    actionLabel,
    onAction,
    onRefresh,
    refreshing,
}: {
    title: string;
    subtitle?: string;
    icon: React.ComponentType<any>;
    actionLabel?: string;
    onAction?: () => void;
    onRefresh?: () => void;
    refreshing?: boolean;
}) {
    return (
        <Flex direction={{ xs: 'column', md: 'row' }} justify="between" align={{ md: 'center' }} gap="sm">
            <Flex align="center" gap="sm">
                <Box
                    style={{
                        padding: 8,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon size={18} style={{ color: 'var(--aui-color-primary, #8b5cf6)' }} />
                </Box>
                <Box>
                    <Text variant="h4" weight="semibold">{title}</Text>
                    {subtitle && <Text variant="small" color="muted">{subtitle}</Text>}
                </Box>
            </Flex>
            <Flex gap="sm">
                {onRefresh && (
                    <Tooltip content="Recargar">
                        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={onRefresh} disabled={refreshing} aria-label="Recargar" />
                    </Tooltip>
                )}
                {actionLabel && onAction && (
                    <Button variant="primary" size="sm" icon={Plus} onClick={onAction}>
                        {actionLabel}
                    </Button>
                )}
            </Flex>
        </Flex>
    );
}

function StatusBadge({ status }: { status: string }) {
    const variant = status === 'UP' ? 'success' : status === 'COMPLETED' ? 'success' : status === 'PROCESSING' ? 'warning' : 'danger';
    return <Badge variant={variant} dot>{status}</Badge>;
}

function ListSkeleton() {
    return (
        <Flex direction="column" gap="sm">
            {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="rect" width="100%" height={48} />
            ))}
        </Flex>
    );
}

// ---------------------------------------------------------------------------
// Queue Management Panel
// ---------------------------------------------------------------------------

function QueuePanel() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [showModal, setShowModal] = useState(false);
    const [queueName, setQueueName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [queues, setQueues] = useState<QueueInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [queryQueue, setQueryQueue] = useState('');
    const [queryResult, setQueryResult] = useState<QueueInfo | null>(null);
    const [queryError, setQueryError] = useState<string | null>(null);

    const knownQueues = useRef<string[]>(['orders.queue']);

    const loadKnownQueues = useCallback(async () => {
        setLoading(true);
        const results: QueueInfo[] = [];
        for (const name of knownQueues.current) {
            try {
                const info = await RabbitApi.getQueueInfo(name);
                if (info) results.push(info);
            } catch { /* queue might not exist */ }
        }
        setQueues(results);
        setLoading(false);
    }, []);

    useEffect(() => { loadKnownQueues(); }, [loadKnownQueues]);

    const handleCreate = async () => {
        if (!queueName.trim()) return;
        setSubmitting(true);
        try {
            await RabbitApi.createQueue(queueName.trim());
            if (!knownQueues.current.includes(queueName.trim())) {
                knownQueues.current.push(queueName.trim());
            }
            toast.push({ title: `Cola "${queueName}" creada`, variant: 'success' });
            setShowModal(false);
            setQueueName('');
            await loadKnownQueues();
        } catch (e: any) {
            toast.push({ title: 'Error al crear cola', description: e.message, variant: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (name: string) => {
        const ok = await confirm({
            title: `¿Eliminar cola "${name}"?`,
            description: 'Se perderán todos los mensajes en la cola.',
            variant: 'danger',
            confirmLabel: 'Eliminar',
        });
        if (!ok) return;
        try {
            await RabbitApi.deleteQueue(name);
            knownQueues.current = knownQueues.current.filter((q) => q !== name);
            toast.push({ title: `Cola "${name}" eliminada`, variant: 'success' });
            await loadKnownQueues();
        } catch (e: any) {
            toast.push({ title: 'Error al eliminar cola', description: e.message, variant: 'danger' });
        }
    };

    const handlePurge = async (name: string) => {
        const ok = await confirm({
            title: `¿Purgar cola "${name}"?`,
            description: 'Se eliminarán todos los mensajes pendientes.',
            variant: 'danger',
            confirmLabel: 'Purgar',
        });
        if (!ok) return;
        try {
            await RabbitApi.purgeQueue(name);
            toast.push({ title: `Cola "${name}" purgada`, variant: 'success' });
            await loadKnownQueues();
        } catch (e: any) {
            toast.push({ title: 'Error al purgar cola', description: e.message, variant: 'danger' });
        }
    };

    const handleQuery = async () => {
        if (!queryQueue.trim()) return;
        setQueryError(null);
        setQueryResult(null);
        try {
            const info = await RabbitApi.getQueueInfo(queryQueue.trim());
            if (info) {
                setQueryResult(info);
                if (!knownQueues.current.includes(queryQueue.trim())) {
                    knownQueues.current.push(queryQueue.trim());
                    await loadKnownQueues();
                }
            } else {
                setQueryError('Cola no encontrada');
            }
        } catch (e: any) {
            setQueryError(e.message);
        }
    };

    return (
        <Flex direction="column" gap="md">
            <SectionHeader
                title="Colas"
                subtitle={`${queues.length} colas conocidas`}
                icon={Inbox}
                actionLabel="Nueva cola"
                onAction={() => setShowModal(true)}
                onRefresh={loadKnownQueues}
                refreshing={loading}
            />

            {/* Query a queue */}
            <Box variant="default" shadow="xs" style={{ padding: 16, borderRadius: 12 }}>
                <Text variant="small" weight="semibold" color="muted" style={{ marginBottom: 8 }}>Consultar cola</Text>
                <Flex gap="sm" align="end">
                    <Box style={{ flex: 1 }}>
                        <Input
                            placeholder="Nombre de la cola..."
                            value={queryQueue}
                            onChange={(e) => setQueryQueue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                        />
                    </Box>
                    <Button variant="secondary" size="sm" onClick={handleQuery}>Consultar</Button>
                </Flex>
                {queryResult && (
                    <Box style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(139, 92, 246, 0.08)' }}>
                        <Flex gap="lg">
                            <Box>
                                <Text variant="small" color="muted">Cola</Text>
                                <Text variant="body" weight="semibold">{queryResult.name}</Text>
                            </Box>
                            <Box>
                                <Text variant="small" color="muted">Mensajes</Text>
                                <Text variant="body" weight="semibold">{queryResult.messageCount}</Text>
                            </Box>
                            <Box>
                                <Text variant="small" color="muted">Consumidores</Text>
                                <Text variant="body" weight="semibold">{queryResult.consumerCount}</Text>
                            </Box>
                        </Flex>
                    </Box>
                )}
                {queryError && (
                    <Box style={{ marginTop: 8 }}>
                        <Text variant="small" color="danger">{queryError}</Text>
                    </Box>
                )}
            </Box>

            {/* Queue list */}
            {loading ? (
                <ListSkeleton />
            ) : queues.length === 0 ? (
                <EmptyState icon={Inbox} title="Sin colas" description="No hay colas conocidas registradas." />
            ) : (
                <Flex direction="column" gap="sm">
                    {queues.map((q) => (
                        <Box key={q.name} variant="default" shadow="xs" style={{ padding: 16, borderRadius: 12 }}>
                            <Flex justify="between" align="center">
                                <Flex gap="lg" align="center">
                                    <Box>
                                        <Text variant="body" weight="semibold">{q.name}</Text>
                                    </Box>
                                    <Badge variant="info">{q.messageCount} msgs</Badge>
                                    <Badge variant="default">{q.consumerCount} consumers</Badge>
                                </Flex>
                                <Flex gap="xs">
                                    <Tooltip content="Purgar mensajes">
                                        <Button variant="ghost" size="sm" icon={Eraser} onClick={() => handlePurge(q.name)} aria-label="Purgar" />
                                    </Tooltip>
                                    <Tooltip content="Eliminar cola">
                                        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(q.name)} aria-label="Eliminar" />
                                    </Tooltip>
                                </Flex>
                            </Flex>
                        </Box>
                    ))}
                </Flex>
            )}

            <Modal open={showModal} onClose={() => setShowModal(false)} ariaLabel="Crear cola">
                <Flex direction="column" gap="md">
                    <Text variant="h3">Nueva cola</Text>
                    <Box>
                        <Text variant="small" color="muted">Nombre</Text>
                        <Input
                            value={queueName}
                            onChange={(e) => setQueueName(e.target.value)}
                            placeholder="Ej. orders.queue"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </Box>
                    <Flex justify="between" gap="sm">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreate} disabled={submitting || !queueName.trim()}>
                            {submitting ? 'Creando…' : 'Crear cola'}
                        </Button>
                    </Flex>
                </Flex>
            </Modal>
        </Flex>
    );
}

// ---------------------------------------------------------------------------
// Exchange Management Panel
// ---------------------------------------------------------------------------

function ExchangePanel() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [showModal, setShowModal] = useState(false);
    const [exchangeName, setExchangeName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [exchanges, setExchanges] = useState<string[]>([]);

    const handleCreate = async () => {
        if (!exchangeName.trim()) return;
        setSubmitting(true);
        try {
            await RabbitApi.createExchange(exchangeName.trim());
            setExchanges((prev) => [...new Set([...prev, exchangeName.trim()])]);
            toast.push({ title: `Exchange "${exchangeName}" creado`, variant: 'success' });
            setShowModal(false);
            setExchangeName('');
        } catch (e: any) {
            toast.push({ title: 'Error al crear exchange', description: e.message, variant: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (name: string) => {
        const ok = await confirm({
            title: `¿Eliminar exchange "${name}"?`,
            description: 'Se eliminarán todos los bindings asociados.',
            variant: 'danger',
            confirmLabel: 'Eliminar',
        });
        if (!ok) return;
        try {
            await RabbitApi.deleteExchange(name);
            setExchanges((prev) => prev.filter((e) => e !== name));
            toast.push({ title: `Exchange "${name}" eliminado`, variant: 'success' });
        } catch (e: any) {
            toast.push({ title: 'Error al eliminar exchange', description: e.message, variant: 'danger' });
        }
    };

    return (
        <Flex direction="column" gap="md">
            <SectionHeader
                title="Exchanges"
                subtitle={`${exchanges.length} exchanges`}
                icon={Zap}
                actionLabel="Nuevo exchange"
                onAction={() => setShowModal(true)}
            />

            {exchanges.length === 0 ? (
                <EmptyState icon={Zap} title="Sin exchanges" description="Crea un exchange para enrutar mensajes entre colas." />
            ) : (
                <Flex direction="column" gap="sm">
                    {exchanges.map((name) => (
                        <Box key={name} variant="default" shadow="xs" style={{ padding: 16, borderRadius: 12 }}>
                            <Flex justify="between" align="center">
                                <Flex align="center" gap="sm">
                                    <Zap size={16} style={{ color: 'var(--aui-color-primary, #8b5cf6)' }} />
                                    <Text variant="body" weight="semibold">{name}</Text>
                                    <Badge variant="info">direct</Badge>
                                </Flex>
                                <Tooltip content="Eliminar exchange">
                                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(name)} aria-label="Eliminar" />
                                </Tooltip>
                            </Flex>
                        </Box>
                    ))}
                </Flex>
            )}

            <Modal open={showModal} onClose={() => setShowModal(false)} ariaLabel="Crear exchange">
                <Flex direction="column" gap="md">
                    <Text variant="h3">Nuevo exchange</Text>
                    <Box>
                        <Text variant="small" color="muted">Nombre</Text>
                        <Input
                            value={exchangeName}
                            onChange={(e) => setExchangeName(e.target.value)}
                            placeholder="Ej. orders.exchange"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </Box>
                    <Flex justify="between" gap="sm">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreate} disabled={submitting || !exchangeName.trim()}>
                            {submitting ? 'Creando…' : 'Crear exchange'}
                        </Button>
                    </Flex>
                </Flex>
            </Modal>
        </Flex>
    );
}

// ---------------------------------------------------------------------------
// Binding Management Panel
// ---------------------------------------------------------------------------

function BindingPanel() {
    const toast = useToast();
    const [showModal, setShowModal] = useState(false);
    const [queueName, setQueueName] = useState('');
    const [exchangeName, setExchangeName] = useState('');
    const [routingKey, setRoutingKey] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [bindings, setBindings] = useState<{ queue: string; exchange: string; routingKey: string }[]>([]);

    const handleCreate = async () => {
        if (!queueName.trim() || !exchangeName.trim() || !routingKey.trim()) return;
        setSubmitting(true);
        try {
            await RabbitApi.createBinding(queueName.trim(), exchangeName.trim(), routingKey.trim());
            setBindings((prev) => [...prev, { queue: queueName.trim(), exchange: exchangeName.trim(), routingKey: routingKey.trim() }]);
            toast.push({ title: 'Binding creado exitosamente', variant: 'success' });
            setShowModal(false);
            setQueueName('');
            setExchangeName('');
            setRoutingKey('');
        } catch (e: any) {
            toast.push({ title: 'Error al crear binding', description: e.message, variant: 'danger' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Flex direction="column" gap="md">
            <SectionHeader
                title="Bindings"
                subtitle={`${bindings.length} bindings`}
                icon={Link2}
                actionLabel="Nuevo binding"
                onAction={() => setShowModal(true)}
            />

            {bindings.length === 0 ? (
                <EmptyState icon={Link2} title="Sin bindings" description="Crea un binding para conectar un exchange con una cola." />
            ) : (
                <Flex direction="column" gap="sm">
                    {bindings.map((b, idx) => (
                        <Box key={idx} variant="default" shadow="xs" style={{ padding: 16, borderRadius: 12 }}>
                            <Flex align="center" gap="sm" wrap={true}>
                                <Badge variant="info">{b.exchange}</Badge>
                                <Text variant="small" color="muted">→</Text>
                                <Badge variant="success">{b.queue}</Badge>
                                <Text variant="small" color="muted">key:</Text>
                                <Badge variant="default">{b.routingKey}</Badge>
                            </Flex>
                        </Box>
                    ))}
                </Flex>
            )}

            <Modal open={showModal} onClose={() => setShowModal(false)} ariaLabel="Crear binding">
                <Flex direction="column" gap="md">
                    <Text variant="h3">Nuevo binding</Text>
                    <Box>
                        <Text variant="small" color="muted">Nombre de la cola</Text>
                        <Input value={queueName} onChange={(e) => setQueueName(e.target.value)} placeholder="Ej. orders.queue" />
                    </Box>
                    <Box>
                        <Text variant="small" color="muted">Nombre del exchange</Text>
                        <Input value={exchangeName} onChange={(e) => setExchangeName(e.target.value)} placeholder="Ej. orders.exchange" />
                    </Box>
                    <Box>
                        <Text variant="small" color="muted">Routing key</Text>
                        <Input value={routingKey} onChange={(e) => setRoutingKey(e.target.value)} placeholder="Ej. order.new" />
                    </Box>
                    <Flex justify="between" gap="sm">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            disabled={submitting || !queueName.trim() || !exchangeName.trim() || !routingKey.trim()}
                        >
                            {submitting ? 'Creando…' : 'Crear binding'}
                        </Button>
                    </Flex>
                </Flex>
            </Modal>
        </Flex>
    );
}

// ---------------------------------------------------------------------------
// Message Sender Panel
// ---------------------------------------------------------------------------

function MessagePanel() {
    const toast = useToast();
    const [mode, setMode] = useState<'queue' | 'exchange'>('queue');
    const [queueName, setQueueName] = useState('orders.queue');
    const [exchangeName, setExchangeName] = useState('');
    const [routingKey, setRoutingKey] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) return;
        setSending(true);
        try {
            if (mode === 'queue') {
                await RabbitApi.sendMessage({ queueName: queueName.trim(), message: message.trim() });
            } else {
                await RabbitApi.sendMessage({
                    exchange: exchangeName.trim(),
                    routingKey: routingKey.trim(),
                    message: message.trim(),
                });
            }
            toast.push({ title: 'Mensaje enviado', variant: 'success' });
            setMessage('');
        } catch (e: any) {
            toast.push({ title: 'Error al enviar mensaje', description: e.message, variant: 'danger' });
        } finally {
            setSending(false);
        }
    };

    return (
        <Flex direction="column" gap="md">
            <SectionHeader title="Enviar mensaje" icon={Send} />

            <Box variant="default" shadow="xs" style={{ padding: 20, borderRadius: 12 }}>
                <Flex direction="column" gap="md">
                    <Flex gap="sm">
                        <Button
                            variant={mode === 'queue' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setMode('queue')}
                        >
                            Directo a cola
                        </Button>
                        <Button
                            variant={mode === 'exchange' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setMode('exchange')}
                        >
                            Vía exchange
                        </Button>
                    </Flex>

                    {mode === 'queue' ? (
                        <Box>
                            <Text variant="small" color="muted">Cola destino</Text>
                            <Input value={queueName} onChange={(e) => setQueueName(e.target.value)} placeholder="Ej. orders.queue" />
                        </Box>
                    ) : (
                        <Flex gap="md">
                            <Box style={{ flex: 1 }}>
                                <Text variant="small" color="muted">Exchange</Text>
                                <Input value={exchangeName} onChange={(e) => setExchangeName(e.target.value)} placeholder="Ej. orders.exchange" />
                            </Box>
                            <Box style={{ flex: 1 }}>
                                <Text variant="small" color="muted">Routing key</Text>
                                <Input value={routingKey} onChange={(e) => setRoutingKey(e.target.value)} placeholder="Ej. order.new" />
                            </Box>
                        </Flex>
                    )}

                    <Box>
                        <Textarea
                            label="Mensaje"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Contenido del mensaje..."
                            autoResize
                        />
                    </Box>

                    <Flex justify="end">
                        <Button
                            variant="primary"
                            icon={Send}
                            onClick={handleSend}
                            disabled={sending || !message.trim()}
                        >
                            {sending ? 'Enviando…' : 'Enviar mensaje'}
                        </Button>
                    </Flex>
                </Flex>
            </Box>
        </Flex>
    );
}

// ---------------------------------------------------------------------------
// Listeners Management Panel
// ---------------------------------------------------------------------------

function ListenerPanel() {
    const toast = useToast();
    const [listeners, setListeners] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [pausedSet, setPausedSet] = useState<Set<string>>(new Set());

    const loadListeners = useCallback(async () => {
        setLoading(true);
        try {
            const ids = await RabbitApi.listListeners();
            setListeners(ids);
        } catch (e: any) {
            toast.push({ title: 'Error al cargar listeners', description: e.message, variant: 'danger' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadListeners(); }, [loadListeners]);

    const handlePause = async (id: string) => {
        try {
            await RabbitApi.pauseListener(id);
            setPausedSet((prev) => new Set(prev).add(id));
            toast.push({ title: `Listener "${id}" pausado`, variant: 'success' });
        } catch (e: any) {
            toast.push({ title: 'Error al pausar listener', description: e.message, variant: 'danger' });
        }
    };

    const handleResume = async (id: string) => {
        try {
            await RabbitApi.resumeListener(id);
            setPausedSet((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            toast.push({ title: `Listener "${id}" reanudado`, variant: 'success' });
        } catch (e: any) {
            toast.push({ title: 'Error al reanudar listener', description: e.message, variant: 'danger' });
        }
    };

    return (
        <Flex direction="column" gap="md">
            <SectionHeader
                title="Listeners"
                subtitle={`${listeners.length} registrados`}
                icon={Radio}
                onRefresh={loadListeners}
                refreshing={loading}
            />

            {loading ? (
                <ListSkeleton />
            ) : listeners.length === 0 ? (
                <EmptyState icon={Radio} title="Sin listeners" description="No hay listeners registrados." />
            ) : (
                <Flex direction="column" gap="sm">
                    {listeners.map((id) => {
                        const isPaused = pausedSet.has(id);
                        return (
                            <Box key={id} variant="default" shadow="xs" style={{ padding: 16, borderRadius: 12 }}>
                                <Flex justify="between" align="center">
                                    <Flex align="center" gap="sm">
                                        <Radio size={16} style={{ color: isPaused ? 'var(--aui-color-muted, #888)' : 'var(--aui-color-success, #22c55e)' }} />
                                        <Text variant="body" weight="semibold">{id}</Text>
                                        <Badge variant={isPaused ? 'default' : 'success'} dot>
                                            {isPaused ? 'Pausado' : 'Activo'}
                                        </Badge>
                                    </Flex>
                                    <Flex gap="xs">
                                        {isPaused ? (
                                            <Tooltip content="Reanudar listener">
                                                <Button variant="ghost" size="sm" icon={Play} onClick={() => handleResume(id)} aria-label="Reanudar" />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip content="Pausar listener">
                                                <Button variant="ghost" size="sm" icon={Pause} onClick={() => handlePause(id)} aria-label="Pausar" />
                                            </Tooltip>
                                        )}
                                    </Flex>
                                </Flex>
                            </Box>
                        );
                    })}
                </Flex>
            )}
        </Flex>
    );
}

// ---------------------------------------------------------------------------
// Real-time Message Monitor (WebSocket/STOMP)
// ---------------------------------------------------------------------------

function MessageMonitor() {
    const [messages, setMessages] = useState<ConsumedMessage[]>([]);
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS(`${RABBIT_BASE}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                setConnected(true);
                client.subscribe('/topic/messages', (frame) => {
                    try {
                        const msg: ConsumedMessage = JSON.parse(frame.body);
                        setMessages((prev) => {
                            // Update existing message by id or add new one
                            const exists = prev.findIndex((m) => m.id === msg.id);
                            if (exists >= 0) {
                                const updated = [...prev];
                                updated[exists] = msg;
                                return updated;
                            }
                            return [msg, ...prev].slice(0, 100); // Keep max 100
                        });
                    } catch { /* ignore bad messages */ }
                });
            },
            onDisconnect: () => setConnected(false),
            onStompError: () => setConnected(false),
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, []);

    return (
        <Flex direction="column" gap="md">
            <Flex justify="between" align="center">
                <SectionHeader
                    title="Monitor en tiempo real"
                    subtitle="Mensajes consumidos por los listeners"
                    icon={Activity}
                />
                <Badge variant={connected ? 'success' : 'danger'} dot>
                    {connected ? 'Conectado' : 'Desconectado'}
                </Badge>
            </Flex>

            {messages.length === 0 ? (
                <Box
                    variant="default"
                    shadow="xs"
                    style={{
                        padding: 40,
                        borderRadius: 12,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04), rgba(59, 130, 246, 0.04))',
                    }}
                >
                    <Activity size={40} style={{ color: 'var(--aui-color-muted, #888)', marginBottom: 12 }} />
                    <Text variant="body" color="muted">Esperando mensajes...</Text>
                    <Text variant="small" color="muted">
                        Los mensajes consumidos por los listeners aparecerán aquí en tiempo real.
                    </Text>
                </Box>
            ) : (
                <Flex direction="column" gap="xs">
                    {messages.map((msg) => (
                        <Box
                            key={`${msg.id}-${msg.status}`}
                            variant="default"
                            shadow="xs"
                            style={{
                                padding: 14,
                                borderRadius: 10,
                                borderLeft: `3px solid ${
                                    msg.status === 'COMPLETED'
                                        ? 'var(--aui-color-success, #22c55e)'
                                        : msg.status === 'PROCESSING'
                                        ? 'var(--aui-color-warning, #f59e0b)'
                                        : 'var(--aui-color-danger, #ef4444)'
                                }`,
                            }}
                        >
                            <Flex justify="between" align="center" gap="sm">
                                <Flex direction="column" gap="xs">
                                    <Flex align="center" gap="sm">
                                        <Text variant="body" weight="semibold">{msg.content}</Text>
                                        <StatusBadge status={msg.status} />
                                    </Flex>
                                    <Flex gap="md">
                                        <Text variant="small" color="muted">Cola: {msg.queue}</Text>
                                        <Text variant="small" color="muted">Listener: {msg.listenerId}</Text>
                                        <Text variant="small" color="muted">{msg.timestamp}</Text>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Box>
                    ))}
                </Flex>
            )}
        </Flex>
    );
}

// ---------------------------------------------------------------------------
// Connection Status
// ---------------------------------------------------------------------------

function ConnectionStatus() {
    const [health, setHealth] = useState<{ status: string; host?: string; port?: number; virtualHost?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const h = await RabbitApi.health();
            setHealth(h);
        } catch (e: any) {
            setError(e.message);
            setHealth(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { checkHealth(); }, [checkHealth]);

    if (loading) return <Skeleton variant="rect" width="100%" height={80} />;

    if (error) {
        return (
            <Box
                variant="default"
                shadow="xs"
                style={{
                    padding: 20,
                    borderRadius: 12,
                    borderLeft: '4px solid var(--aui-color-danger, #ef4444)',
                    background: 'rgba(239, 68, 68, 0.06)',
                }}
            >
                <Flex align="center" gap="sm">
                    <AlertTriangle size={20} style={{ color: 'var(--aui-color-danger, #ef4444)' }} />
                    <Box>
                        <Text variant="body" weight="semibold" color="danger">RabbitMQ no disponible</Text>
                        <Text variant="small" color="muted">{error}</Text>
                    </Box>
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={checkHealth} style={{ marginLeft: 'auto' }}>
                        Reintentar
                    </Button>
                </Flex>
            </Box>
        );
    }

    return (
        <Box
            variant="default"
            shadow="sm"
            style={{
                padding: 20,
                borderRadius: 12,
                borderLeft: `4px solid ${health?.status === 'UP' ? 'var(--aui-color-success, #22c55e)' : 'var(--aui-color-danger, #ef4444)'}`,
                background: health?.status === 'UP' ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
            }}
        >
            <Flex align="center" gap="md" wrap={true}>
                <Flex align="center" gap="sm">
                    <Server size={20} style={{ color: health?.status === 'UP' ? 'var(--aui-color-success, #22c55e)' : 'var(--aui-color-danger, #ef4444)' }} />
                    <Box>
                        <Text variant="body" weight="semibold">Conexión RabbitMQ</Text>
                        <StatusBadge status={health?.status || 'UNKNOWN'} />
                    </Box>
                </Flex>
                {health?.host && (
                    <Flex gap="lg">
                        <Box>
                            <Text variant="small" color="muted">Host</Text>
                            <Text variant="small" weight="semibold">{health.host}</Text>
                        </Box>
                        <Box>
                            <Text variant="small" color="muted">Puerto</Text>
                            <Text variant="small" weight="semibold">{health.port}</Text>
                        </Box>
                        <Box>
                            <Text variant="small" color="muted">Virtual Host</Text>
                            <Text variant="small" weight="semibold">{health.virtualHost}</Text>
                        </Box>
                    </Flex>
                )}
                <Button variant="ghost" size="sm" icon={RefreshCw} onClick={checkHealth} style={{ marginLeft: 'auto' }}>
                    Verificar
                </Button>
            </Flex>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Main RabbitMQ Panel (exported)
// ---------------------------------------------------------------------------

export default function RabbitMQPanel() {
    return (
        <Flex direction="column" gap="lg">
            <ConnectionStatus />

            <Tabs
                items={[
                    {
                        id: 'messages',
                        label: '📨 Mensajes',
                        content: (
                            <Flex direction="column" gap="lg">
                                <MessagePanel />
                                <MessageMonitor />
                            </Flex>
                        ),
                    },
                    {
                        id: 'queues',
                        label: '📥 Colas',
                        content: <QueuePanel />,
                    },
                    {
                        id: 'exchanges',
                        label: '⚡ Exchanges',
                        content: <ExchangePanel />,
                    },
                    {
                        id: 'bindings',
                        label: '🔗 Bindings',
                        content: <BindingPanel />,
                    },
                    {
                        id: 'listeners',
                        label: '📡 Listeners',
                        content: <ListenerPanel />,
                    },
                ]}
            />
        </Flex>
    );
}
