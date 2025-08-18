import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, CheckCircle, XCircle, BarChart, FileText, Banknote, Power } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar } from 'recharts';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { startOfMonth, subMonths, endOfMonth, startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28'];

const CustomTooltip = ({ active, payload, label, isCurrency = false }) => {
    if (active && payload && payload.length) {
        const value = isCurrency
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)
            : payload[0].value;

        return (
            <div className="bg-slate-800/80 backdrop-blur-sm p-2 border border-slate-700 rounded-lg text-white">
                <p className="label font-semibold">{`${label}`}</p>
                <p className="intro text-sm text-purple-300">{`${payload[0].name} : ${value}`}</p>
            </div>
        );
    }
    return null;
};

const CRMAnalyticsDashboard = () => {
    const { user, supabase } = useNewAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('this_month');

    useEffect(() => {
        const fetchLeads = async () => {
            if (!user || !supabase) return;
            setLoading(true);
            try {
                const { data, error } = await supabase.from('leads').select('*').eq('user_id', user.id);
                if (error) throw error;
                setLeads(data || []);
            } catch (error) {
                console.error('Error fetching leads:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, [user, supabase]);

    const filteredLeads = useMemo(() => {
        const now = new Date();
        let startDate, endDate = now;

        switch (dateRange) {
            case 'last_week':
                startDate = startOfWeek(subWeeks(now, 1));
                endDate = endOfWeek(subWeeks(now, 1));
                break;
            case 'last_month':
                startDate = startOfMonth(subMonths(now, 1));
                endDate = endOfMonth(subMonths(now, 1));
                break;
            case 'this_month':
            default:
                startDate = startOfMonth(now);
                break;
        }

        return leads.filter(lead => {
            const leadDate = new Date(lead.created_at);
            return leadDate >= startDate && leadDate <= endDate;
        });
    }, [leads, dateRange]);

    const analyticsData = useMemo(() => {
        const totalLeads = filteredLeads.length;
        const inNegotiation = filteredLeads.filter(l => ['pre-qualificacao', 'proposta-enviada', 'documentacao-recebida'].includes(l.stage));
        const closedWon = filteredLeads.filter(l => ['projeto-aprovado', 'instalacao-agendada', 'sistema-entregue'].includes(l.stage));
        const closedLost = filteredLeads.filter(l => l.stage === 'perdido');

        const conversionRate = totalLeads > 0 ? (closedWon.length / totalLeads) * 100 : 0;
        
        const openDealsValue = inNegotiation.reduce((sum, lead) => sum + (lead.value || 0), 0);

        const totalDealsData = [
            { name: 'Ganhos', value: closedWon.reduce((sum, l) => sum + (l.value || 0), 0) },
            { name: 'Perdidos', value: closedLost.reduce((sum, l) => sum + (l.value || 0), 0) },
        ];
        
        const salesByPowerData = filteredLeads.reduce((acc, lead) => {
            const power = lead.power_kwp || 0;
            const value = lead.value || 0;
            if (power > 0 && value > 0) {
                if (power <= 18) acc['0-18'] += value;
                else if (power <= 36) acc['18-36'] += value;
                else if (power <= 54) acc['36-54'] += value;
                else if (power <= 72) acc['54-72'] += value;
                else acc['72-90'] += value;
            }
            return acc;
        }, { '0-18': 0, '18-36': 0, '36-54': 0, '54-72': 0, '72-90': 0 });

        return {
            stats: {
                totalLeads,
                inNegotiation: inNegotiation.length,
                closedWon: closedWon.length,
                closedLost: closedLost.length
            },
            conversionRate: [{ name: 'Convertido', value: conversionRate }, { name: 'Não Convertido', value: 100 - conversionRate }],
            openDeals: {
                count: inNegotiation.length,
                value: openDealsValue,
                potentialProfit: openDealsValue * 0.2 // assuming 20% profit margin
            },
            totalDeals: totalDealsData,
            salesByPower: Object.entries(salesByPowerData).map(([name, value]) => ({ name, 'Valor (R$)': value }))
        };
    }, [filteredLeads]);
    
    const incomingLeadsData = useMemo(() => {
        const data = {};
        filteredLeads.forEach(lead => {
            const date = format(new Date(lead.created_at), 'dd/MM');
            data[date] = (data[date] || 0) + 1;
        });
        return Object.entries(data).map(([name, value]) => ({ name, 'Novos Leads': value })).sort((a,b) => a.name.localeCompare(b.name));
    }, [filteredLeads]);

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-slate-900">
                <Header />
                <div className="flex justify-center items-center h-full pt-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-900">
            <Header />
            <main className="pt-20">
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-white">CRM Dashboard</h1>
                                <p className="text-slate-400">Última sincronização: agora mesmo</p>
                            </div>
                            <Button onClick={() => navigate('/crm/kanban')} className="bg-purple-600 hover:bg-purple-700">
                                Ver Funil (Kanban)
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Novos Leads (Mês)" value={analyticsData.stats.totalLeads} icon={<Users className="text-blue-400" />} />
                            <StatCard title="Em Negociação" value={analyticsData.stats.inNegotiation} icon={<TrendingUp className="text-yellow-400" />} />
                            <StatCard title="Fechados (Mês)" value={analyticsData.stats.closedWon} icon={<CheckCircle className="text-green-400" />} />
                            <StatCard title="Perdidos (Mês)" value={analyticsData.stats.closedLost} icon={<XCircle className="text-red-400" />} />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <OpenDealsCard data={analyticsData.openDeals} />
                            <ConversionRateCard data={analyticsData.conversionRate} />
                            <TotalDealsCard data={analyticsData.totalDeals} />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SalesByPowerCard data={analyticsData.salesByPower} />
                             <Card className="bg-slate-800/50 border-slate-700 text-white">
                                <CardHeader className="flex flex-row justify-between items-center">
                                    <CardTitle>Leads Recebidos</CardTitle>
                                    <Select value={dateRange} onValueChange={setDateRange}>
                                        <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
                                            <SelectValue placeholder="Selecione o período" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                            <SelectItem value="this_month">Este Mês</SelectItem>
                                            <SelectItem value="last_week">Semana Passada</SelectItem>
                                            <SelectItem value="last_month">Mês Passado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardHeader>
                                <CardContent className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={incomingLeadsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                            <XAxis dataKey="name" stroke="#9ca3af" />
                                            <YAxis stroke="#9ca3af" tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Line type="monotone" dataKey="Novos Leads" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                    </motion.div>
                </div>
            </main>
        </div>
    );
};

const StatCard = ({ title, value, icon, change }) => {
    return (
        <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 flex justify-between items-center">
                    {title}
                    {icon}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">{value}</p>
                {change && <p className={cn("text-xs", change.startsWith('+') ? 'text-green-400' : 'text-red-400')}>{change}</p>}
            </CardContent>
        </Card>
    );
};

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const OpenDealsCard = ({ data }) => (
    <Card className="bg-slate-800/50 border-slate-700 text-white flex flex-col justify-center">
        <CardHeader>
            <CardTitle className="text-lg">Negócios em Aberto</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
            <img  alt="Funil de Vendas" class="w-24 h-24" src="https://images.unsplash.com/photo-1684901050159-2b85f5667ee1" />
            <div>
                <p className="text-2xl font-bold">{data.count} <span className="text-base font-normal text-slate-400">Negócios</span></p>
                <p className="text-lg font-semibold text-cyan-400">{formatCurrency(data.value)}</p>
                <p className="text-sm text-slate-400">Valor em Aberto</p>
                <p className="text-lg font-semibold text-green-400 mt-2">{formatCurrency(data.potentialProfit)}</p>
                <p className="text-sm text-slate-400">Lucro Potencial</p>
            </div>
        </CardContent>
    </Card>
);

const ConversionRateCard = ({ data }) => (
    <Card className="bg-slate-800/50 border-slate-700 text-white flex flex-col justify-center items-center">
        <CardHeader>
            <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="w-full h-48 relative flex justify-center items-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} startAngle={90} endAngle={450}>
                         <Cell fill="#14b8a6" />
                         <Cell fill="#3f3f46" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
                <p className="text-3xl font-bold text-teal-400">{data[0].value.toFixed(2)}%</p>
                <p className="text-sm text-slate-400">de Conversão</p>
            </div>
        </CardContent>
    </Card>
);

const TotalDealsCard = ({ data }) => (
    <Card className="bg-slate-800/50 border-slate-700 text-white flex flex-col justify-center">
        <CardHeader>
            <CardTitle className="text-lg">Totais de Negócios (R$)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                            <Cell fill="#14b8a6" />
                            <Cell fill="#f43f5e" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div>
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${item.name === 'Ganhos' ? 'bg-teal-500' : 'bg-red-500'}`}></div>
                        <div>
                            <p className="text-sm text-slate-300">{item.name}</p>
                            <p className="font-bold text-lg">{formatCurrency(item.value)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

const SalesByPowerCard = ({data}) => (
    <Card className="bg-slate-800/50 border-slate-700 text-white">
        <CardHeader>
            <CardTitle>Vendas (R$) por Faixas de Potência (kWp)</CardTitle>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" horizontal={false}/>
                    <XAxis type="number" stroke="#9ca3af" tickFormatter={(value) => `${value/1000}k`}/>
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" width={50}/>
                    <Tooltip content={<CustomTooltip isCurrency={true} />} cursor={{fill: 'rgba(148, 163, 184, 0.1)'}}/>
                    <Bar dataKey="Valor (R$)" fill="#2dd4bf" barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
);

export default CRMAnalyticsDashboard;