import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Goal, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/login", { password }),
    onSuccess: () => {
      setError("");
      queryClient.setQueryData(["/api/auth/me"], { authenticated: true });
    },
    onError: () => {
      setError("Senha incorreta");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4" data-testid="page-login">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Goal className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">SportsCRM</CardTitle>
          <CardDescription>Digite a senha para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
              {error && (
                <p className="text-sm text-destructive" data-testid="text-login-error">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-login">
              {loginMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
