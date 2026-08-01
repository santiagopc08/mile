#ifndef PLATFORM_ENGINE_GRAPHICS_VFX_PLATFORMER_VFX_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_GRAPHICS_VFX_PLATFORMER_VFX_VALIDATION_CONTROLLER_HPP

#include <cstdint>

namespace platform
{
    class PlatformerVFXValidationController
    {
    public:
        PlatformerVFXValidationController() = default;

        void triggerAllVFXEvents();

        [[nodiscard]] uint32_t triggeredVFXCount() const { return m_triggeredVFXCount; }

    private:
        uint32_t m_triggeredVFXCount{0};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_VFX_PLATFORMER_VFX_VALIDATION_CONTROLLER_HPP
