import React from 'react';
import MountingAreaPanel from '@/components/pv-design/viewer-3d/MountingAreaPanel';
import ModulePlacementPanel from '@/components/pv-design/viewer-3d/ModulePlacementPanel';
import EditAreaDialog from '@/components/pv-design/viewer-3d/EditAreaDialog';
import ShadingAnalysisPanel from '@/components/pv-design/viewer-3d/ShadingAnalysisPanel';

const ViewerPanels = ({
    activeTool,
    mountingAreas,
    selectedAreaId,
    editingArea,
    handleSelectArea,
    handleDeleteArea,
    setEditingArea,
    setHoveredAreaId,
    handleUpdateAreaLayout,
    setSelectedAreaId,
    handleUpdateAreaName,
    controlsRef,
    onRunShadingAnalysis,
    onCloseShadingPanel,
    project,
}) => {
    const selectedAreaData = mountingAreas.find(a => a.id === selectedAreaId);

    if (activeTool === 'shading') {
        return (
            <ShadingAnalysisPanel
                selectedArea={selectedAreaData}
                project={project}
                onRunAnalysis={onRunShadingAnalysis}
                onClose={onCloseShadingPanel}
            />
        );
    }
    
    return (
        <>
            <MountingAreaPanel
                areas={mountingAreas}
                selectedAreaId={selectedAreaId}
                onSelectArea={(areaId) => handleSelectArea(areaId, controlsRef.current)}
                onDeleteArea={handleDeleteArea}
                onEditArea={(area) => setEditingArea(area)}
                onHoverArea={setHoveredAreaId}
            />
            {selectedAreaData && (
                <ModulePlacementPanel
                    area={selectedAreaData}
                    onUpdateAreaLayout={handleUpdateAreaLayout}
                    onClose={() => setSelectedAreaId(null)}
                />
            )}
            {editingArea && (
                <EditAreaDialog
                    area={editingArea}
                    isOpen={!!editingArea}
                    onClose={() => setEditingArea(null)}
                    onSave={handleUpdateAreaName}
                />
            )}
        </>
    );
};

export default ViewerPanels;