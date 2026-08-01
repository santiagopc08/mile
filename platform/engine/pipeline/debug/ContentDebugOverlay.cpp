#include "engine/pipeline/debug/ContentDebugOverlay.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void ContentDebugOverlay::Initialize(UIManager *uiManager)
    {
        m_uiManager = uiManager;
        LOG_INFO("[ContentDebugOverlay] Content Diagnostics Overlay initialized (Toggle: F8).");
    }

    void ContentDebugOverlay::Update(const ContentDiagnostics &diagnostics, double dt)
    {
        (void)dt;
        if (!m_visible)
        {
            return;
        }

        LOG_INFO("[ContentDebugOverlay] Mounts: {}, Compiled: {}, HitRate: {:.0f}%, PipelineTime: {:.0f}ms",
                 diagnostics.MountedProviders, diagnostics.CompiledResources,
                 diagnostics.CacheHitRate * 100.0f, diagnostics.PipelineTimeMs);
    }
}
