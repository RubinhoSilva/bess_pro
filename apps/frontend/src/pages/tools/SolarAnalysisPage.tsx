import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SolarAnalysisPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Análise Solar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A análise solar agora está integrada ao dimensionamento PV utilizando apenas o PVGIS.
              Use a ferramenta de dimensionamento PV para realizar análises solares completas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}