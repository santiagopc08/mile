#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_EFFECTS_SYSTEM_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_EFFECTS_SYSTEM_HPP

#include "engine/graphics/camera/CameraView.hpp"
#include <glm/glm.hpp>

namespace platform
{
    class CameraEffectsSystem
    {
    public:
        CameraEffectsSystem() = default;

        void shake(float intensity, double duration);
        void impact(const glm::vec2 &dir, float force);
        void zoom(float factor, double duration);
        void flash(const glm::vec4 &color, double duration);

        void ApplyEffects(CameraView &view, double dt);

        [[nodiscard]] bool IsShaking() const { return m_shakeTime > 0.0; }
        [[nodiscard]] bool IsFlashing() const { return m_flashTime > 0.0; }

    private:
        float m_shakeIntensity{0.0f};
        double m_shakeTime{0.0};
        float m_zoomFactor{1.0f};
        double m_zoomTime{0.0};
        glm::vec4 m_flashColor{0.0f};
        double m_flashTime{0.0};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_EFFECTS_SYSTEM_HPP
