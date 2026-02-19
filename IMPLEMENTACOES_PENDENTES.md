// Implementações pendentes para o App.tsx

## RESUMO DAS IMPLEMENTAÇÕES NECESSÁRIAS:

### 1. ✅ Novos Estados Adicionados:
- selectedQueue: string
- selectedClient: string  
- view: incluindo 'agents'

### 2. 📝 PRÓXIMAS IMPLEMENTAÇÕES:

#### A) Listas de Filtros (useMemo):
```typescript
const queuesList = useMemo(() => {
  const q = new Set<string>();
  data.forEach(d => d.fila && q.add(d.fila));
  return Array.from(q).sort();
}, [data]);

const top10Clients = useMemo(() => {
  const clientCount: Record<string, number> = {};
  data.forEach(d => {
    if (d.cliente) {
      clientCount[d.cliente] = (clientCount[d.cliente] || 0) + 1;
    }
  });
  return Object.entries(clientCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);
}, [data]);
```

#### B) Atualizar filteredData para incluir novos filtros:
```typescript
const matchesQueue = selectedQueue === 'ALL' || d.fila === selectedQueue;
const matchesClient = selectedClient === 'ALL' || d.cliente === selectedClient;
```

#### C) Atualizar cálculo de métricas (excluir zeros):
```typescript
const metrics = useMemo(() => {
  if (filteredData.length === 0) return null;
  
  // Filtrar apenas registros com tempos válidos (não zerados)
  const validAHT = filteredData.filter(d => d.ahtSeconds > 0);
  const validFRT = filteredData.filter(d => d.frtSeconds > 0);
  
  const totalAHT = validAHT.reduce((sum, d) => sum + d.ahtSeconds, 0);
  const totalFRT = validFRT.reduce((sum, d) => sum + d.frtSeconds, 0);
  
  // ... resto do código
  
  return {
    total: filteredData.length,
    avgAHT: validAHT.length > 0 ? totalAHT / validAHT.length : 0,
    avgFRT: validFRT.length > 0 ? totalFRT / validFRT.length : 0,
    // ...
  };
}, [filteredData]);
```

#### D) Adicionar métricas por Fila:
```typescript
const queueMetrics = useMemo(() => {
  const queues: Record<string, number> = {};
  filteredData.forEach(d => {
    queues[d.fila] = (queues[d.fila] || 0) + 1;
  });
  return Object.entries(queues)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}, [filteredData]);
```

#### E) Registros Incompletos:
```typescript
const incompleteRecords = useMemo(() => {
  return filteredData.filter(d => 
    !d.fila || !d.categoria || !d.agente || d.ahtSeconds === 0 || d.frtSeconds === 0
  );
}, [filteredData]);
```

#### F) Análise de Agentes (nova view):
```typescript
const agentPerformance = useMemo(() => {
  const agentStats: Record<string, {
    total: number;
    validAHT: number[];
    validFRT: number[];
  }> = {};
  
  filteredData.forEach(d => {
    if (!agentStats[d.agente]) {
      agentStats[d.agente] = { total: 0, validAHT: [], validFRT: [] };
    }
    agentStats[d.agente].total++;
    if (d.ahtSeconds > 0) agentStats[d.agente].validAHT.push(d.ahtSeconds);
    if (d.frtSeconds > 0) agentStats[d.agente].validFRT.push(d.frtSeconds);
  });
  
  return Object.entries(agentStats).map(([name, stats]) => ({
    name,
    total: stats.total,
    avgAHT: stats.validAHT.length > 0 
      ? stats.validAHT.reduce((a, b) => a + b, 0) / stats.validAHT.length 
      : 0,
    avgFRT: stats.validFRT.length > 0
      ? stats.validFRT.reduce((a, b) => a + b, 0) / stats.validFRT.length
      : 0
  })).sort((a, b) => a.avgAHT - b.avgAHT); // Mais rápido primeiro
}, [filteredData]);
```

### 3. 🎨 UI COMPONENTS:

#### Filtros adicionais na barra:
```tsx
<select value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}>
  <option value="ALL">Filas: Todas</option>
  {queuesList.map(q => <option key={q} value={q}>{q}</option>)}
</select>

<select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
  <option value="ALL">Clientes: Todos</option>
  {top10Clients.map(c => <option key={c} value={c}>{c}</option>)}
</select>
```

#### Box Total por Fila no Dashboard:
```tsx
<StatCard 
  title="Filas Ativas" 
  value={queueMetrics.length} 
  icon={<Tag className="text-purple-500" size={18} />} 
  subValue="Total de filas" 
/>
```

#### Tabela com registros incompletos destacados:
```tsx
{paginatedData.map((ticket, i) => {
  const isIncomplete = !ticket.fila || !ticket.categoria || 
                       !ticket.agente || ticket.ahtSeconds === 0 || 
                       ticket.frtSeconds === 0;
  return (
    <tr 
      key={i} 
      className={`hover:bg-slate-50 ${isIncomplete ? 'bg-red-50' : ''}`}
    >
      {/* células da tabela */}
    </tr>
  );
})}
```

#### Nova aba Agentes:
```tsx
<button onClick={() => setView('agents')}>
  <Users size={14} /> Análise de Agentes
</button>

{/* No conteúdo */}
{view === 'agents' && (
  <div className="space-y-6">
    <h2>Análise de Performance por Agente</h2>
    <div className="bg-white p-6 rounded-2xl">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={agentPerformance} layout="vertical">
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={150} />
          <Tooltip />
          <Bar dataKey="avgAHT" name="TMA Médio" fill={BRAND_COLOR} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}
```

### 4. 📊 Contador de Registros Incompletos:
```tsx
<div className="bg-red-50 border border-red-200 p-4 rounded-lg">
  <p className="text-red-800 font-bold">
    ⚠️ {incompleteRecords.length} registros incompletos
  </p>
</div>
```

---

## ORDEM DE IMPLEMENTAÇÃO:
1. Adicionar useMemo para listas (queuesList, top10Clients)
2. Atualizar filteredData
3. Atualizar cálculo de metrics (excluir zeros)
4. Adicionar queueMetrics e incompleteRecords
5. Adicionar agentPerformance
6. Atualizar UI com novos filtros
7. Adicionar StatCard de Filas
8. Atualizar tabela com destaque vermelho
9. Adicionar nova view de Agentes
10. Adicionar contador de incompletos
