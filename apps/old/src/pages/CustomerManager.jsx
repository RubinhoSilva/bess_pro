import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Users, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import LeadForm from '@/components/crm/LeadForm';

const CustomerManager = () => {
    const { toast } = useToast();
    const { user, supabase } = useNewAuth();
    const [customers, setCustomers] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [deletingCustomer, setDeletingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchCustomers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            setCustomers(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar clientes', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, toast, supabase]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);
    
    useEffect(() => {
        if (!isDialogOpen) {
            fetchCustomers();
        }
    }, [isDialogOpen, fetchCustomers]);

    const confirmDelete = async () => {
        if (!deletingCustomer) return;
        try {
            const { error } = await supabase.from('customers').delete().match({ id: deletingCustomer.id });
            if (error) throw error;
            toast({ title: 'Cliente excluído com sucesso!' });
            fetchCustomers();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir cliente', description: error.message });
        } finally {
            setDeletingCustomer(null);
            setIsDeleteAlertOpen(false);
        }
    };

    const openCustomerForm = (customer = null) => {
        setCurrentCustomer(customer);
        setIsDialogOpen(true);
    };
    
    const openDeleteDialog = (customer) => {
        setDeletingCustomer(customer);
        setIsDeleteAlertOpen(true);
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen w-full bg-slate-900">
            <Header />
            <main className="pt-20">
                <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
                    >
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3"><Users /> Gestão de Clientes</h1>
                            <p className="text-slate-300 mt-2">Gerencie sua base de clientes e agende manutenções.</p>
                        </div>
                        <Button onClick={() => openCustomerForm(null)} size="lg" className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white">
                            <UserPlus className="w-5 h-5 mr-2" /> Adicionar Cliente
                        </Button>
                    </motion.div>

                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-800 border-slate-700"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                                <motion.div
                                    key={customer.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="bg-slate-800/50 border-slate-700">
                                        <CardContent className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-lg text-purple-300">{customer.name}</p>
                                                <p className="text-sm text-slate-300">{customer.email}</p>
                                                <p className="text-sm text-slate-400">{customer.phone}</p>
                                                <p className="text-xs text-slate-500 mt-1">{customer.address}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openCustomerForm(customer)}><Edit className="w-4 h-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDeleteDialog(customer)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )) : (
                                <p className="text-center p-8 text-slate-400">Nenhum cliente encontrado.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{currentCustomer ? 'Editar' : 'Adicionar'} Cliente</DialogTitle>
                    </DialogHeader>
                    <LeadForm
                        lead={currentCustomer}
                        isCustomerForm={true}
                        onClose={() => {
                            setIsDialogOpen(false);
                            setCurrentCustomer(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente "{deletingCustomer?.name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CustomerManager;