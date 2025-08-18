import React, { useState } from 'react';
import { Palette, Type, Layout, FileImage, Settings } from 'lucide-react';
import { TemplateStyle, AdvancedProposalTemplate } from '../../types/advanced-templates';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TemplateStyleEditorProps {
  style?: TemplateStyle;
  pdfSettings?: AdvancedProposalTemplate['pdfSettings'];
  onUpdateStyle: (style: TemplateStyle) => void;
  onUpdatePdfSettings: (pdfSettings: AdvancedProposalTemplate['pdfSettings']) => void;
}

const DEFAULT_STYLE: TemplateStyle = {
  primaryColor: '#3B82F6',
  secondaryColor: '#6B7280',
  accentColor: '#F59E0B',
  fontFamily: 'Inter',
  fontSize: {
    title: 32,
    heading: 24,
    body: 16,
    small: 14,
  },
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  logo: {
    url: '',
    position: 'left',
    size: 'medium',
  },
  watermark: {
    enabled: false,
    text: '',
    opacity: 0.1,
  },
};

const DEFAULT_PDF_SETTINGS: AdvancedProposalTemplate['pdfSettings'] = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  headerFooter: {
    showHeader: true,
    showFooter: true,
    showPageNumbers: true,
  },
};

const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Ubuntu',
  'Nunito',
  'Raleway',
];

const COLOR_PRESETS = [
  { name: 'Azul Corporativo', primary: '#3B82F6', secondary: '#6B7280', accent: '#F59E0B' },
  { name: 'Verde Sustentável', primary: '#10B981', secondary: '#6B7280', accent: '#F59E0B' },
  { name: 'Roxo Tecnológico', primary: '#8B5CF6', secondary: '#6B7280', accent: '#F59E0B' },
  { name: 'Laranja Energia', primary: '#F97316', secondary: '#6B7280', accent: '#3B82F6' },
  { name: 'Vermelho Força', primary: '#EF4444', secondary: '#6B7280', accent: '#F59E0B' },
  { name: 'Cinza Elegante', primary: '#374151', secondary: '#9CA3AF', accent: '#F59E0B' },
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <div
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          style={{ backgroundColor: color }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = color;
            input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        />
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
    </div>
  );
}

export function TemplateStyleEditor({
  style = DEFAULT_STYLE,
  pdfSettings = DEFAULT_PDF_SETTINGS,
  onUpdateStyle,
  onUpdatePdfSettings,
}: TemplateStyleEditorProps) {
  const [activePreview, setActivePreview] = useState<'desktop' | 'mobile' | 'pdf'>('desktop');

  const updateStyle = (updates: Partial<TemplateStyle>) => {
    onUpdateStyle({ ...style, ...updates });
  };

  const updatePdfSettings = (updates: Partial<AdvancedProposalTemplate['pdfSettings']>) => {
    onUpdatePdfSettings({ ...pdfSettings, ...updates });
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    updateStyle({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Personalização de Estilo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors">Cores</TabsTrigger>
              <TabsTrigger value="typography">Tipografia</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="pdf">PDF</TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Paleta de Cores</h3>
                
                {/* Color Presets */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Presets de Cores</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {COLOR_PRESETS.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => applyColorPreset(preset)}
                        className="h-auto p-3"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: preset.secondary }}
                            />
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: preset.accent }}
                            />
                          </div>
                          <span className="text-xs">{preset.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ColorPicker
                    color={style.primaryColor}
                    onChange={(color) => updateStyle({ primaryColor: color })}
                    label="Cor Primária"
                  />
                  <ColorPicker
                    color={style.secondaryColor}
                    onChange={(color) => updateStyle({ secondaryColor: color })}
                    label="Cor Secundária"
                  />
                  <ColorPicker
                    color={style.accentColor}
                    onChange={(color) => updateStyle({ accentColor: color })}
                    label="Cor de Destaque"
                  />
                </div>

                {/* Color Preview */}
                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Preview de Cores</h4>
                  <div className="space-y-2">
                    <div 
                      className="p-3 rounded text-white font-medium"
                      style={{ backgroundColor: style.primaryColor }}
                    >
                      Título Principal (Cor Primária)
                    </div>
                    <div 
                      className="p-2 rounded text-white"
                      style={{ backgroundColor: style.secondaryColor }}
                    >
                      Texto Secundário (Cor Secundária)
                    </div>
                    <div 
                      className="p-2 rounded text-white text-sm"
                      style={{ backgroundColor: style.accentColor }}
                    >
                      Destaque (Cor de Destaque)
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Tipografia</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Família da Fonte
                    </label>
                    <Select
                      value={style.fontFamily}
                      onValueChange={(value) => updateStyle({ fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map(font => (
                          <SelectItem key={font} value={font}>
                            <span style={{ fontFamily: font }}>{font}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Tamanhos de Fonte</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Título ({style.fontSize.title}px)
                        </label>
                        <Slider
                          value={[style.fontSize.title]}
                          onValueChange={([value]) => updateStyle({
                            fontSize: { ...style.fontSize, title: value }
                          })}
                          min={24}
                          max={48}
                          step={2}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Subtítulo ({style.fontSize.heading}px)
                        </label>
                        <Slider
                          value={[style.fontSize.heading]}
                          onValueChange={([value]) => updateStyle({
                            fontSize: { ...style.fontSize, heading: value }
                          })}
                          min={18}
                          max={32}
                          step={2}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Corpo ({style.fontSize.body}px)
                        </label>
                        <Slider
                          value={[style.fontSize.body]}
                          onValueChange={([value]) => updateStyle({
                            fontSize: { ...style.fontSize, body: value }
                          })}
                          min={12}
                          max={20}
                          step={1}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Pequeno ({style.fontSize.small}px)
                        </label>
                        <Slider
                          value={[style.fontSize.small]}
                          onValueChange={([value]) => updateStyle({
                            fontSize: { ...style.fontSize, small: value }
                          })}
                          min={10}
                          max={16}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Preview */}
                <div className="mt-6 p-4 border rounded-lg" style={{ fontFamily: style.fontFamily }}>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Preview de Tipografia</h4>
                  <div className="space-y-2">
                    <h1 style={{ fontSize: style.fontSize.title, color: style.primaryColor }}>
                      Título Principal
                    </h1>
                    <h2 style={{ fontSize: style.fontSize.heading, color: style.secondaryColor }}>
                      Subtítulo da Seção
                    </h2>
                    <p style={{ fontSize: style.fontSize.body }}>
                      Este é um exemplo de texto no corpo do documento. 
                      O tamanho da fonte pode ser ajustado conforme necessário.
                    </p>
                    <p style={{ fontSize: style.fontSize.small, color: style.secondaryColor }}>
                      Texto pequeno para observações e detalhes adicionais.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Layout e Margens</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Margem Superior (px)
                    </label>
                    <Input
                      type="number"
                      value={style.margins.top}
                      onChange={(e) => updateStyle({
                        margins: { ...style.margins, top: Number(e.target.value) }
                      })}
                      min={0}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Margem Direita (px)
                    </label>
                    <Input
                      type="number"
                      value={style.margins.right}
                      onChange={(e) => updateStyle({
                        margins: { ...style.margins, right: Number(e.target.value) }
                      })}
                      min={0}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Margem Inferior (px)
                    </label>
                    <Input
                      type="number"
                      value={style.margins.bottom}
                      onChange={(e) => updateStyle({
                        margins: { ...style.margins, bottom: Number(e.target.value) }
                      })}
                      min={0}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Margem Esquerda (px)
                    </label>
                    <Input
                      type="number"
                      value={style.margins.left}
                      onChange={(e) => updateStyle({
                        margins: { ...style.margins, left: Number(e.target.value) }
                      })}
                      min={0}
                    />
                  </div>
                </div>

                {/* Logo Settings */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Configurações do Logo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL do Logo
                      </label>
                      <Input
                        value={style.logo?.url || ''}
                        onChange={(e) => updateStyle({
                          logo: { 
                            url: e.target.value,
                            position: style.logo?.position || 'left',
                            size: style.logo?.size || 'medium'
                          }
                        })}
                        placeholder="https://exemplo.com/logo.png"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Posição
                      </label>
                      <Select
                        value={style.logo?.position || 'left'}
                        onValueChange={(value) => updateStyle({
                          logo: { 
                            url: style.logo?.url || '',
                            position: value as 'left' | 'center' | 'right',
                            size: style.logo?.size || 'medium'
                          }
                        })}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamanho
                      </label>
                      <Select
                        value={style.logo?.size || 'medium'}
                        onValueChange={(value) => updateStyle({
                          logo: { 
                            url: style.logo?.url || '',
                            position: style.logo?.position || 'left',
                            size: value as 'small' | 'medium' | 'large'
                          }
                        })}
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
                </div>

                {/* Watermark Settings */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Marca d'água</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Ativar marca d'água
                      </label>
                      <Switch
                        checked={style.watermark?.enabled || false}
                        onCheckedChange={(checked) => updateStyle({
                          watermark: { 
                            enabled: checked,
                            text: style.watermark?.text || 'CONFIDENCIAL',
                            opacity: style.watermark?.opacity || 0.1
                          }
                        })}
                      />
                    </div>
                    
                    {style.watermark?.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Texto da marca d'água
                          </label>
                          <Input
                            value={style.watermark?.text || ''}
                            onChange={(e) => updateStyle({
                              watermark: { 
                                enabled: style.watermark?.enabled || false,
                                text: e.target.value,
                                opacity: style.watermark?.opacity || 0.1
                              }
                            })}
                            placeholder="Ex: CONFIDENCIAL"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Opacidade ({Math.round((style.watermark?.opacity || 0.1) * 100)}%)
                          </label>
                          <Slider
                            value={[(style.watermark?.opacity || 0.1) * 100]}
                            onValueChange={([value]) => updateStyle({
                              watermark: { 
                                enabled: style.watermark?.enabled || false,
                                text: style.watermark?.text || 'CONFIDENCIAL',
                                opacity: value / 100
                              }
                            })}
                            min={5}
                            max={50}
                            step={5}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* PDF Tab */}
            <TabsContent value="pdf" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Configurações de PDF</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamanho da Página
                    </label>
                    <Select
                      value={pdfSettings.pageSize}
                      onValueChange={(value) => updatePdfSettings({
                        pageSize: value as 'A4' | 'Letter' | 'A3'
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="Letter">Letter (216 × 279 mm)</SelectItem>
                        <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orientação
                    </label>
                    <Select
                      value={pdfSettings.orientation}
                      onValueChange={(value) => updatePdfSettings({
                        orientation: value as 'portrait' | 'landscape'
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Retrato</SelectItem>
                        <SelectItem value="landscape">Paisagem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* PDF Margins */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Margens do PDF (mm)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Superior</label>
                      <Input
                        type="number"
                        value={pdfSettings.margins.top}
                        onChange={(e) => updatePdfSettings({
                          margins: { ...pdfSettings.margins, top: Number(e.target.value) }
                        })}
                        min={0}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Direita</label>
                      <Input
                        type="number"
                        value={pdfSettings.margins.right}
                        onChange={(e) => updatePdfSettings({
                          margins: { ...pdfSettings.margins, right: Number(e.target.value) }
                        })}
                        min={0}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Inferior</label>
                      <Input
                        type="number"
                        value={pdfSettings.margins.bottom}
                        onChange={(e) => updatePdfSettings({
                          margins: { ...pdfSettings.margins, bottom: Number(e.target.value) }
                        })}
                        min={0}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Esquerda</label>
                      <Input
                        type="number"
                        value={pdfSettings.margins.left}
                        onChange={(e) => updatePdfSettings({
                          margins: { ...pdfSettings.margins, left: Number(e.target.value) }
                        })}
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                {/* Header/Footer Settings */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Cabeçalho e Rodapé</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Mostrar cabeçalho</label>
                      <Switch
                        checked={pdfSettings.headerFooter.showHeader}
                        onCheckedChange={(checked) => updatePdfSettings({
                          headerFooter: { ...pdfSettings.headerFooter, showHeader: checked }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Mostrar rodapé</label>
                      <Switch
                        checked={pdfSettings.headerFooter.showFooter}
                        onCheckedChange={(checked) => updatePdfSettings({
                          headerFooter: { ...pdfSettings.headerFooter, showFooter: checked }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Numeração de páginas</label>
                      <Switch
                        checked={pdfSettings.headerFooter.showPageNumbers}
                        onCheckedChange={(checked) => updatePdfSettings({
                          headerFooter: { ...pdfSettings.headerFooter, showPageNumbers: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}