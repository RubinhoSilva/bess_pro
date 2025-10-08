import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Zap, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import api from '../../lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', data);
      
      if (response.data.success) {
        setEmailSent(true);
        toast.success('Email enviado com sucesso!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Erro ao enviar email';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Header com Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
            >
              BESS Pro
            </motion.h1>
          </div>

          {/* Card de Sucesso */}
          <Card className="glass border-0 shadow-2xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                >
                  <Mail className="w-8 h-8 text-green-600" />
                </motion.div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Email Enviado!
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.
                  Verifique sua caixa de entrada e spam.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Link to="/login">
                      Voltar ao Login
                    </Link>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailSent(false);
                      form.reset();
                    }}
                    className="w-full"
                  >
                    Enviar Novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            BESS Pro
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-2"
          >
            Plataforma de Energia Solar
          </motion.p>
        </div>

        {/* Card de Esqueci a Senha */}
        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Esqueci a Senha</CardTitle>
            <CardDescription>
              Digite seu email para receber as instruções de redefinição
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Email'
                  )}
                </Button>
              </form>
            </Form>

            {/* Link de volta ao login */}
            <div className="text-center mt-6">
              <Link
                to="/login"
                className="inline-flex items-center text-primary hover:underline text-sm"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar ao Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          © 2024 BESS Pro. Todos os direitos reservados.
        </motion.p>
      </motion.div>
    </div>
  );
}