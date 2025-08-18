import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, MapPin, AlertTriangle, Sun, Zap, Sigma, AreaChart, Save, Building } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { Wrapper } from "@googlemaps/react-wrapper";

const SolarDataDisplay = ({ data, address, onSave, isSaving }) => {
    const [projectName, setProjectName] = useState(address || `Projeto Solar ${new Date().toLocaleDateString()}`);

    if (!data) return null;

    if (data.error && data.error.code === 404) {
        return (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-300 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <span>Este local ainda não está coberto pela análise solar do Google. Tente outro endereço.</span>
            </div>
        );
    }

    const { solarPotential, roofSegmentStats } = data;
    if (!solarPotential) {
        return (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-300 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <span>Não foram encontrados dados de potencial solar para este local. Pode estar fora da área de cobertura.</span>
            </div>
        );
    }

    const formatNumber = (num, decimals = 2) => num ? num.toLocaleString('pt-BR', { maximumFractionDigits: decimals }) : 'N/A';
    
    const mainConfig = Array.isArray(solarPotential.solarPanelConfigs) && solarPotential.solarPanelConfigs.length > 0 
        ? solarPotential.solarPanelConfigs[0] 
        : null;

    const financial = Array.isArray(data.financialAnalyses) ? data.financialAnalyses.find(f => f.monthlyBill?.units === 'USD') : null;

    const handleSave = () => {
        if (!projectName) {
            alert("Por favor, insira um nome para o projeto.");
            return;
        }
        onSave(projectName);
    }

    return (
        <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Building className="text-blue-400" /> Análise do Edifício</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <InfoCard icon={<AreaChart className="text-blue-400" />} title="Área Máx. Painéis" value={`${formatNumber(solarPotential.maxArrayAreaMeters2)} m²`} />
                <InfoCard icon={<Zap className="text-green-400" />} title="Potência Instalada" value={`${formatNumber(solarPotential.panelCapacityWatts, 0)} W`} />
                {mainConfig && (
                    <>
                        <InfoCard icon={<Sigma className="text-purple-400" />} title="Nº de Painéis" value={formatNumber(mainConfig.panelsCount, 0)} />
                        <InfoCard icon={<Sun className="text-orange-400" />} title="Geração Anual" value={`${formatNumber(mainConfig.yearlyEnergyDcKwh)} kWh`} />
                    </>
                )}
                {Array.isArray(roofSegmentStats) && roofSegmentStats.length > 0 && (
                    <>
                        <InfoCard title="Orientação Média" value={`${formatNumber(roofSegmentStats[0]?.azimuthDegrees)}°`} />
                        <InfoCard title="Inclinação Média" value={`${formatNumber(roofSegmentStats[0]?.pitchDegrees)}°`} />
                    </>
                )}
            </div>

            {financial && financial.financialDetails && (
                 <div>
                    <h4 className="text-lg font-semibold mt-4 mb-2">Análise Financeira (USD)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                         <InfoCard title="Economia em 20 Anos" value={`$${formatNumber(financial.financialDetails.remainingLifetimeSavings, 2)}`} />
                    </div>
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-700 mt-4">
                <div className="flex-grow">
                    <Label htmlFor="projectName" className="text-xs text-slate-400">Nome do Projeto</Label>
                    <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="bg-slate-700 border-slate-600" />
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="self-end sm:self-center">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Projeto
                </Button>
            </div>

        </div>
    );
};

const InfoCard = ({ icon, title, value }) => (
    <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-3">
        {icon && <div className="p-2 bg-slate-700/50 rounded-md">{icon}</div>}
        <div>
            <p className="text-slate-400 text-xs">{title}</p>
            <p className="font-bold text-base text-white">{value}</p>
        </div>
    </div>
);

const MapComponent = ({ onMapLoad, onMapClick }) => {
    const ref = useRef(null);
    const [map, setMap] = useState(null);

    useEffect(() => {
        if (ref.current && !map) {
            const newMap = new window.google.maps.Map(ref.current, {
                center: { lat: -14.235, lng: -51.9253 },
                zoom: 4,
                mapTypeId: 'satellite'
            });
            newMap.addListener('click', (e) => onMapClick(e));
            setMap(newMap);
            onMapLoad(newMap);
        }
    }, [ref, map, onMapLoad, onMapClick]);

    return <div ref={ref} style={{ flexGrow: 1, height: '100%' }} />;
};

const GoogleSolarModal = ({ isOpen, onClose, apiKey, onDataCollected }) => {
    const { toast } = useToast();
    const { user } = useNewAuth();
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [address, setAddress] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [solarData, setSolarData] = useState(null);
    const [analysisPerformed, setAnalysisPerformed] = useState(false);

    const handleMapLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
    }, []);

    const handleMapClick = useCallback((e) => {
        const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setSelectedLocation(latLng);
        setSolarData(null);
        setAnalysisPerformed(false);
        if (marker) {
            marker.setPosition(latLng);
        } else {
            setMarker(new window.google.maps.Marker({ position: latLng, map: map }));
        }
    }, [map, marker]);

    const handleSearch = useCallback(() => {
        if (!map || !address) return;
        setIsSearching(true);
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            setIsSearching(false);
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                map.setCenter(location);
                map.setZoom(19);
                const latLng = { lat: location.lat(), lng: location.lng() };
                setSelectedLocation(latLng);
                setSolarData(null);
                setAnalysisPerformed(false);
                if (marker) {
                    marker.setPosition(latLng);
                } else {
                    setMarker(new window.google.maps.Marker({ position: latLng, map: map }));
                }
            } else {
                toast({ variant: "destructive", title: "Endereço não encontrado", description: `Motivo: ${status}` });
            }
        });
    }, [map, address, marker, toast]);

    const handleAnalyze = async () => {
        if (!selectedLocation || !apiKey) return;
        setIsAnalyzing(true);
        setSolarData(null);

        const { lat, lng } = selectedLocation;
        const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                if(data.error?.code === 404){
                   setSolarData({error: {code: 404}});
                } else {
                    throw new Error(data.error?.message || 'Erro desconhecido na API Solar.');
                }
            } else {
                setSolarData(data);
                if (!address && data.postalAddress?.addressLines?.length > 0) {
                  setAddress(data.postalAddress.addressLines.join(', '));
                }
            }
            onDataCollected(data);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Falha na Análise Solar",
                description: error.message,
            });
        } finally {
            setIsAnalyzing(false);
            setAnalysisPerformed(true);
        }
    };

    const handleSaveProject = async (projectName) => {
        if (!solarData || !user) return;
        setIsSaving(true);

        const { data, error } = await supabase
            .from('solar_projects')
            .insert([{
                user_id: user.id,
                project_name: projectName,
                address: address,
                coordinates: selectedLocation,
                solar_api_data: solarData,
            }]);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar Projeto',
                description: error.message,
            });
        } else {
            toast({
                title: 'Projeto Salvo!',
                description: `${projectName} foi salvo com sucesso.`,
                className: "bg-green-500 text-white"
            });
            onClose();
        }
        setIsSaving(false);
    };

    const renderContent = () => (
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-slate-800 border-slate-700 text-white">
            <DialogHeader className="p-4 border-b border-slate-700">
                <DialogTitle>Dimensionar com Google Solar</DialogTitle>
                <DialogDescription>
                    Use o mapa para encontrar o endereço e selecionar o telhado para análise.
                </DialogDescription>
            </DialogHeader>
            <div className="p-4 space-y-4">
                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Digite um endereço..."
                        value={address || ''}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="bg-slate-700 border-slate-600"
                    />
                    <Button onClick={handleSearch} disabled={isSearching || !map}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="flex-grow w-full h-full bg-slate-900 relative overflow-hidden">
                <MapComponent onMapLoad={handleMapLoad} onMapClick={handleMapClick} />
                {selectedLocation && (
                    <div className="absolute top-2 left-2 bg-slate-900/80 p-2 rounded-lg text-xs flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>Lat: {selectedLocation.lat.toFixed(4)}, Lon: {selectedLocation.lng.toFixed(4)}</span>
                    </div>
                )}
            </div>
            
            <div className="p-4 overflow-y-auto">
                {analysisPerformed && <SolarDataDisplay data={solarData} address={address} onSave={handleSaveProject} isSaving={isSaving}/>}
            </div>

            <DialogFooter className="p-4 border-t border-slate-700 mt-auto">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleAnalyze} disabled={!selectedLocation || isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Analisar Telhado
                </Button>
            </DialogFooter>
        </DialogContent>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {isOpen && apiKey ? (
                <Wrapper apiKey={apiKey} libraries={['places']}>
                    {renderContent()}
                </Wrapper>
            ) : (
                <DialogContent>
                    <p>Chave de API do Google não fornecida.</p>
                </DialogContent>
            )}
        </Dialog>
    );
};

export default GoogleSolarModal;