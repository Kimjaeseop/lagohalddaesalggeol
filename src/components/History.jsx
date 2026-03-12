import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../api';

const PIE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#FEA47F'];
const PIE_KEYS = ['국내주식', '해외주식', '국내채권', '해외채권', '대체자산'];

// today string
const todayStr = () => new Date().toISOString().split('T')[0];
const nYearsAgo = (n) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - n);
    return d.toISOString().split('T')[0];
};

const History = ({ onNavigate, initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'MINE');

    // ── MINE ──────────────────────────────────────────────────────────────────
    const [history, setHistory] = useState([]);
    const [loadingMine, setLoadingMine] = useState(true);
    const [errorMine, setErrorMine] = useState(null);

    // ── NPS ───────────────────────────────────────────────────────────────────
    const [amountSlider, setAmountSlider] = useState(1000); // 만원 단위 (UI only)
    const [committedAmount, setCommittedAmount] = useState(1000);

    // Date range
    const [startDate, setStartDate] = useState(nYearsAgo(1));
    const [endDate, setEndDate] = useState(todayStr());
    const [activePreset, setActivePreset] = useState(1); // 1 | 3 | 5 | null

    // Available range from server
    const [availableFrom, setAvailableFrom] = useState('2019-01-01');
    const [availableTo, setAvailableTo] = useState(todayStr());

    const [simData, setSimData] = useState(null);
    const [loadingSim, setLoadingSim] = useState(false);
    const [errorSim, setErrorSim] = useState(null);

    // Debounce timer
    const debounceTimer = useRef(null);

    // ── Fetch Mine ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (activeTab === 'MINE' && history.length === 0) {
            setLoadingMine(true);
            api.get('/api/analysis/history')
                .then(res => setHistory(res.data.data || []))
                .catch(() => setErrorMine('기록을 불러오지 못했습니다'))
                .finally(() => setLoadingMine(false));
        }
    }, [activeTab]);

    // ── Fetch NPS summary (available range) ───────────────────────────────────
    useEffect(() => {
        api.get('/api/benchmark/nps')
            .then(res => {
                if (res.data.availableFrom) setAvailableFrom(res.data.availableFrom);
                if (res.data.availableTo) setAvailableTo(res.data.availableTo);
            })
            .catch(() => { });
    }, []);

    // ── Fetch simulation (debounced) ──────────────────────────────────────────
    const fetchSim = useCallback((start, end, amt) => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setLoadingSim(true);
            setErrorSim(null);
            api.get('/api/benchmark/nps/simulate', {
                params: { amount: amt * 10000, startDate: start, endDate: end }
            })
                .then(res => setSimData(res.data))
                .catch(() => setErrorSim('시뮬레이션 데이터를 불러오지 못했습니다. 잠시 후 재시도해주세요.'))
                .finally(() => setLoadingSim(false));
        }, 600);
    }, []);

    useEffect(() => {
        if (activeTab === 'NPS') {
            fetchSim(startDate, endDate, committedAmount);
        }
    }, [activeTab, startDate, endDate, committedAmount, fetchSim]);

    // ── Preset handler ────────────────────────────────────────────────────────
    const applyPreset = (years) => {
        setActivePreset(years);
        const end = availableTo;
        const start = nYearsAgo(years) < availableFrom ? availableFrom : nYearsAgo(years);
        setStartDate(start);
        setEndDate(end);
    };

    // ── Formatters ────────────────────────────────────────────────────────────
    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    const formatCurrency = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val));

    const formatAmountLabel = (m) => m < 10000 ? `${formatCurrency(m)}만 원` : `${formatCurrency(m / 10000)}억 원`;

    const grouped = useMemo(() => {
        return history.reduce((acc, item) => {
            const key = formatDate(item.createdAt);
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    }, [history]);

    // ── Pie chart data: from simulation response (dynamic) ────────────────────
    const pieData = useMemo(() => {
        if (simData?.currentWeights) {
            return PIE_KEYS.map((k, i) => ({
                name: k,
                value: parseFloat(simData.currentWeights[k]),
                fill: PIE_COLORS[i],
            }));
        }
        // fallback static (2024)
        return [
            { name: '국내주식', value: 15.1, fill: PIE_COLORS[0] },
            { name: '해외주식', value: 32.8, fill: PIE_COLORS[1] },
            { name: '국내채권', value: 27.5, fill: PIE_COLORS[2] },
            { name: '해외채권', value: 9.0, fill: PIE_COLORS[3] },
            { name: '대체자산', value: 15.4, fill: PIE_COLORS[4] },
        ];
    }, [simData]);

    // ── Return color ──────────────────────────────────────────────────────────
    const returnColor = simData?.summary ? (Number(simData.summary.totalReturn) >= 0 ? '#ff6b6b' : '#4d79ff') : '#fff';

    return (
        <div style={{ padding: '20px', paddingBottom: '90px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '20px' }}>
                ⏱️ 벤치마크 및 기록
            </h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
                {[['MINE', '내 분석 기록'], ['NPS', '국민연금 시뮬레이션']].map(([tab, label]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem',
                            background: activeTab === tab ? '#fff' : 'transparent',
                            color: activeTab === tab ? '#000' : '#888',
                            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── MINE TAB ── */}
            {activeTab === 'MINE' && (
                <>
                    {loadingMine && <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>로딩 중...</div>}
                    {errorMine && (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>😵</div>
                            <p style={{ color: '#888' }}>{errorMine}</p>
                        </div>
                    )}
                    {!loadingMine && !errorMine && history.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                            <h3 style={{ color: '#fff', marginBottom: '8px' }}>분석 기록이 없습니다</h3>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>홈에서 뉴스 기사나 X 포스트를 분석해보세요!</p>
                        </div>
                    )}
                    {Object.entries(grouped).map(([date, items]) => (
                        <div key={date} style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#555', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.05em' }}>📅 {date}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {items.map(item => {
                                    const result = item.result || {};
                                    const meta = result.meta || {};
                                    const aiAnalysis = result.aiAnalysis || {};
                                    const primary = (aiAnalysis.direct || [])[0] || (aiAnalysis.industry || [])[0];
                                    return (
                                        <div key={item.id} className="glass-card" style={{ padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.title || meta.title || '제목 없음'}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: '#666' }}>{primary ? `${primary.ticker} · ${primary.name}` : '종목 정보 없음'}</div>
                                                </div>
                                                <ArrowRight size={16} style={{ color: '#444', flexShrink: 0, marginTop: '2px' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </>
            )}

            {/* ── NPS TAB ── */}
            {activeTab === 'NPS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Allocation Pie (dynamic) */}
                    <div className="glass-card" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--accent-color)', fontWeight: '800' }}>국민연금처럼 투자한다면?</h2>
                        <p style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: '1.5', marginBottom: '16px' }}>
                            실제 NPS 공시 자산배분 비중을 연도별로 반영합니다. 매년 1월 리밸런싱 가정.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" innerRadius={35} outerRadius={55} stroke="none">
                                            {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ flex: 1, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {pieData.map((d, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.fill }} />
                                            <span style={{ color: '#ccc' }}>{d.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 'bold' }}>{d.value}%</span>
                                    </div>
                                ))}
                                {simData?.summary?.endDate && (
                                    <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '4px' }}>
                                        📋 {new Date(simData.summary.endDate).getFullYear()}년 말 공시 기준
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Amount slider */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#888' }}>투자 금액 (거치식)</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                    {formatAmountLabel(amountSlider)}
                                </span>
                            </div>
                            <input
                                type="range" min="100" max="10000" step="100"
                                value={amountSlider}
                                onChange={(e) => setAmountSlider(Number(e.target.value))}
                                onMouseUp={() => setCommittedAmount(amountSlider)}
                                onTouchEnd={() => setCommittedAmount(amountSlider)}
                                style={{ width: '100%', accentColor: 'var(--accent-color)' }}
                            />
                        </div>

                        {/* Period presets */}
                        <div>
                            <span style={{ fontSize: '0.9rem', color: '#888', display: 'block', marginBottom: '8px' }}>빠른 기간 선택</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[1, 3, 5].map(y => (
                                    <button
                                        key={y}
                                        onClick={() => applyPreset(y)}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem',
                                            border: activePreset === y ? '1px solid var(--accent-color)' : '1px solid #333',
                                            background: activePreset === y ? 'rgba(57, 255, 20, 0.1)' : 'transparent',
                                            color: activePreset === y ? 'var(--accent-color)' : '#888',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {y}년
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom date range */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                <Calendar size={14} color="#888" />
                                <span style={{ fontSize: '0.9rem', color: '#888' }}>직접 기간 설정</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.7rem', color: '#555', display: 'block', marginBottom: '4px' }}>시작일</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        min={availableFrom}
                                        max={endDate}
                                        onChange={e => {
                                            setStartDate(e.target.value);
                                            setActivePreset(null);
                                        }}
                                        style={{
                                            width: '100%', padding: '10px 12px',
                                            background: '#111', border: '1px solid #333',
                                            borderRadius: '10px', color: '#fff', fontSize: '0.85rem',
                                            outline: 'none', colorScheme: 'dark', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ color: '#444', paddingTop: '18px' }}>→</div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.7rem', color: '#555', display: 'block', marginBottom: '4px' }}>종료일</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        min={startDate}
                                        max={availableTo}
                                        onChange={e => {
                                            setEndDate(e.target.value);
                                            setActivePreset(null);
                                        }}
                                        style={{
                                            width: '100%', padding: '10px 12px',
                                            background: '#111', border: '1px solid #333',
                                            borderRadius: '10px', color: '#fff', fontSize: '0.85rem',
                                            outline: 'none', colorScheme: 'dark', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '6px' }}>
                                데이터 가용 범위: {availableFrom} ~ {availableTo}
                            </div>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="glass-card" style={{ padding: '20px' }}>
                        {loadingSim ? (
                            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⚙️</div>
                                    데이터를 불러오고 있습니다... (최초 로딩 시 수 초 소요)
                                </div>
                            </div>
                        ) : errorSim ? (
                            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4444' }}>
                                ⚠️ {errorSim}
                            </div>
                        ) : simData?.summary ? (
                            <>
                                <h3 style={{ fontSize: '1rem', color: '#ccc', marginBottom: '4px' }}>
                                    <span style={{ color: '#aaa' }}>{formatDate(simData.summary.startDate)}</span>
                                    {' ~ '}
                                    <span style={{ color: '#aaa' }}>{formatDate(simData.summary.endDate)}</span>
                                    {' 에 '}
                                    <span style={{ color: '#fff' }}>{formatAmountLabel(amountSlider)}</span>을 맡겼다면?
                                </h3>
                                <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '20px', color: returnColor }}>
                                    {formatCurrency(simData.summary.finalAmount)}원
                                </div>

                                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    {[
                                        ['누적 수익률', `${simData.summary.totalReturn}%`],
                                        ['연평균(CAGR)', `${simData.summary.cagr}%`],
                                        ['최대낙폭(MDD)', `-${simData.summary.mdd}%`],
                                    ].map(([label, val]) => (
                                        <div key={label}>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{label}</div>
                                            <div style={{ fontWeight: 'bold', color: '#fff' }}>{val}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ height: '200px', margin: '0 -10px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={simData.history}>
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(tick) => tick.slice(2, 7)}
                                                stroke="#444"
                                                fontSize={10}
                                                tickMargin={8}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                stroke="#444"
                                                fontSize={10}
                                                tickFormatter={(val) => `${Math.round(val / 10000)}만`}
                                                width={45}
                                            />
                                            <Tooltip
                                                contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '0.8rem' }}
                                                itemStyle={{ color: 'var(--accent-color)' }}
                                                formatter={(value) => [`${formatCurrency(value)}원`, '평가액']}
                                                labelFormatter={(label) => `📅 ${label}`}
                                            />
                                            <ReferenceLine y={simData.summary.initialAmount} stroke="#ff4444" strokeDasharray="3 3" opacity={0.5} />
                                            <Line type="monotone" dataKey="value" stroke="var(--accent-color)" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#fff' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
