#include "engine/graphics/camera/CameraEffectsSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void CameraEffectsSystem::shake(float intensity, double duration)
    {
        m_shakeIntensity = intensity;
        m_shakeTime = duration;
        LOG_INFO("[CameraEffectsSystem] Triggered camera shake (Intensity: {:.1f}, Duration: {:.2f}s).",
                 intensity, duration);
    }

    void CameraEffectsSystem::impact(const glm::vec2 &dir, float force)
    {
        (void)dir;
        shake(force * 0.5f, 0.2);
    }

    void CameraEffectsSystem::zoom(float factor, double duration)
    {
        m_zoomFactor = factor;
        m_zoomTime = duration;
    }

    void CameraEffectsSystem::flash(const glm::vec4 &color, double duration)
    {
        m_flashColor = color;
        m_flashTime = duration;
    }

    void CameraEffectsSystem::ApplyEffects(CameraView &view, double dt)
    {
        if (m_shakeTime > 0.0)
        {
            view.Transform += glm::vec2(m_shakeIntensity, -m_shakeIntensity);
            m_shakeTime = std::max(0.0, m_shakeTime - dt);
        }
        if (m_zoomTime > 0.0)
        {
            m_zoomTime = std::max(0.0, m_zoomTime - dt);
        }
        if (m_flashTime > 0.0)
        {
            m_flashTime = std::max(0.0, m_flashTime - dt);
        }
    }
}
