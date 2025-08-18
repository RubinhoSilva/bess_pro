import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { TemplateStyle } from '../../types/proposal';
import { Palette, Type, Image as ImageIcon } from 'lucide-react';

interface StyleEditorProps {
  styling: TemplateStyle;
  onChange: (styling: TemplateStyle) => void;
}

export const StyleEditor: React.FC<StyleEditorProps> = ({
  styling,
  onChange
}) => {
  // Ensure styling has all required properties with default values
  const safeStyleing = {
    primaryColor: styling.primaryColor || '#2563eb',
    secondaryColor: styling.secondaryColor || '#64748b',
    accentColor: styling.accentColor || '#10b981',
    fontFamily: styling.fontFamily || 'Inter',
    fontSize: styling.fontSize || {
      title: 32,
      heading: 24,
      body: 14,
      small: 12
    },
    margins: styling.margins || {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    logo: {
      url: styling.logo?.url || '',
      position: styling.logo?.position || 'left' as const,
      size: styling.logo?.size || 'medium' as const
    },
    watermark: {
      enabled: styling.watermark?.enabled || false,
      text: styling.watermark?.text || 'CONFIDENCIAL',
      opacity: styling.watermark?.opacity || 0.1
    }
  };

  const handleChange = useCallback((path: string, value: any) => {
    const keys = path.split('.');
    let updated = { ...safeStyleing };
    let current: any = updated;
    
    // Navigate to the nested property
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    // Set the value
    current[keys[keys.length - 1]] = value;
    
    onChange(updated);
  }, [safeStyleing, onChange]);

  const colorPresets = [
    { name: 'Azul Profissional', primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' },
    { name: 'Verde Sustentável', primary: '#059669', secondary: '#047857', accent: '#10b981' },
    { name: 'Laranja Energético', primary: '#ea580c', secondary: '#c2410c', accent: '#f97316' },
    { name: 'Roxo Moderno', primary: '#7c3aed', secondary: '#5b21b6', accent: '#8b5cf6' },
    { name: 'Vermelho Dinâmico', primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444' },
    { name: 'Cinza Elegante', primary: '#374151', secondary: '#1f2937', accent: '#6b7280' }
  ];

  const fontFamilies = [
    'Inter, system-ui, -apple-system, sans-serif',
    'Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
    'Open Sans, -apple-system, BlinkMacSystemFont, sans-serif',
    'Lato, -apple-system, BlinkMacSystemFont, sans-serif',
    'Poppins, -apple-system, BlinkMacSystemFont, sans-serif',
    'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
    'Source Sans Pro, -apple-system, BlinkMacSystemFont, sans-serif',
    'Ubuntu, -apple-system, BlinkMacSystemFont, sans-serif'
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Editor de Estilo</h3>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-5 h-5" />
            Esquema de Cores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Color Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Presets de Cores</Label>
            <div className="grid grid-cols-2 gap-2">
              {colorPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="h-auto p-3 justify-start"
                  onClick={() => {
                    handleChange('primaryColor', preset.primary);
                    handleChange('secondaryColor', preset.secondary);
                    handleChange('accentColor', preset.accent);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Individual Color Pickers */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex gap-2 items-center">
                <input
                  id="primary-color"
                  type="color"
                  value={safeStyleing.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={safeStyleing.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  placeholder="#2563eb"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondary-color">Cor Secundária</Label>
              <div className="flex gap-2 items-center">
                <input
                  id="secondary-color"
                  type="color"
                  value={safeStyleing.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={safeStyleing.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  placeholder="#1e40af"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accent-color">Cor de Destaque</Label>
              <div className="flex gap-2 items-center">
                <input
                  id="accent-color"
                  type="color"
                  value={safeStyleing.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={safeStyleing.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  placeholder="#3b82f6"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="w-5 h-5" />
            Tipografia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="font-family">Família da Fonte</Label>
            <Select 
              value={safeStyleing.fontFamily} 
              onValueChange={(value) => handleChange('fontFamily', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>
                      {font.split(',')[0]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tamanho do Título: {safeStyleing.fontSize.title}px</Label>
              <Slider
                value={[safeStyleing.fontSize.title]}
                onValueChange={([value]) => handleChange('fontSize.title', value)}
                min={20}
                max={48}
                step={2}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Tamanho do Cabeçalho: {safeStyleing.fontSize.heading}px</Label>
              <Slider
                value={[safeStyleing.fontSize.heading]}
                onValueChange={([value]) => handleChange('fontSize.heading', value)}
                min={14}
                max={32}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Tamanho do Corpo: {safeStyleing.fontSize.body}px</Label>
              <Slider
                value={[safeStyleing.fontSize.body]}
                onValueChange={([value]) => handleChange('fontSize.body', value)}
                min={10}
                max={18}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Tamanho Pequeno: {safeStyleing.fontSize.small}px</Label>
              <Slider
                value={[safeStyleing.fontSize.small]}
                onValueChange={([value]) => handleChange('fontSize.small', value)}
                min={8}
                max={14}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="w-5 h-5" />
            Espaçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Margem Superior: {safeStyleing.margins.top}mm</Label>
              <Slider
                value={[safeStyleing.margins.top]}
                onValueChange={([value]) => handleChange('margins.top', value)}
                min={10}
                max={40}
                step={5}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Margem Direita: {safeStyleing.margins.right}mm</Label>
              <Slider
                value={[safeStyleing.margins.right]}
                onValueChange={([value]) => handleChange('margins.right', value)}
                min={10}
                max={40}
                step={5}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Margem Inferior: {safeStyleing.margins.bottom}mm</Label>
              <Slider
                value={[safeStyleing.margins.bottom]}
                onValueChange={([value]) => handleChange('margins.bottom', value)}
                min={10}
                max={40}
                step={5}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Margem Esquerda: {safeStyleing.margins.left}mm</Label>
              <Slider
                value={[safeStyleing.margins.left]}
                onValueChange={([value]) => handleChange('margins.left', value)}
                min={10}
                max={40}
                step={5}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="w-5 h-5" />
            Configuração do Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logo-url">URL do Logo</Label>
            <Input
              id="logo-url"
              value={safeStyleing.logo?.url || ''}
              onChange={(e) => handleChange('logo.url', e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logo-position">Posição do Logo</Label>
              <Select 
                value={safeStyleing.logo?.position || 'left'} 
                onValueChange={(value) => handleChange('logo.position', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="logo-size">Tamanho do Logo</Label>
              <Select 
                value={safeStyleing.logo?.size || 'medium'} 
                onValueChange={(value) => handleChange('logo.size', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watermark */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Marca D'água
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="watermark-enabled"
              checked={safeStyleing.watermark?.enabled || false}
              onCheckedChange={(checked) => handleChange('watermark.enabled', checked)}
            />
            <Label htmlFor="watermark-enabled">Ativar marca d'água</Label>
          </div>

          {safeStyleing.watermark?.enabled && (
            <>
              <div>
                <Label htmlFor="watermark-text">Texto da Marca D'água</Label>
                <Input
                  id="watermark-text"
                  value={safeStyleing.watermark?.text || ''}
                  onChange={(e) => handleChange('watermark.text', e.target.value)}
                  placeholder="CONFIDENCIAL"
                />
              </div>

              <div>
                <Label>Opacidade: {Math.round((safeStyleing.watermark?.opacity || 0.1) * 100)}%</Label>
                <Slider
                  value={[safeStyleing.watermark?.opacity || 0.1]}
                  onValueChange={([value]) => handleChange('watermark.opacity', value)}
                  min={0.05}
                  max={0.5}
                  step={0.05}
                  className="mt-2"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview do Estilo</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 border rounded-lg bg-white"
            style={{
              fontFamily: safeStyleing.fontFamily,
              color: '#000000'
            }}
          >
            <h1 
              style={{ 
                fontSize: `${safeStyleing.fontSize.title}px`,
                color: safeStyleing.primaryColor,
                margin: '0 0 16px 0',
                fontWeight: 'bold'
              }}
            >
              Título Principal
            </h1>
            
            <h2 
              style={{ 
                fontSize: `${safeStyleing.fontSize.heading}px`,
                color: safeStyleing.secondaryColor,
                margin: '0 0 12px 0',
                fontWeight: 'bold'
              }}
            >
              Cabeçalho de Seção
            </h2>
            
            <p 
              style={{ 
                fontSize: `${safeStyleing.fontSize.body}px`,
                margin: '0 0 8px 0',
                lineHeight: '1.4'
              }}
            >
              Este é um exemplo de texto no corpo do documento. 
              Aqui você pode ver como ficará a tipografia escolhida.
            </p>
            
            <p 
              style={{ 
                fontSize: `${safeStyleing.fontSize.small}px`,
                color: '#666666',
                margin: '0'
              }}
            >
              Texto pequeno para observações e detalhes adicionais.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};