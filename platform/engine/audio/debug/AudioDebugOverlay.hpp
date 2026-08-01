#ifndef PLATFORM_ENGINE_AUDIO_DEBUG_AUDIO_DEBUG_OVERLAY_HPP
#define PLATFORM_ENGINE_AUDIO_DEBUG_AUDIO_DEBUG_OVERLAY_HPP

#include "engine/graphics/Renderer.hpp"
#include "engine/audio/debug/AudioDiagnostics.hpp"
#include "engine/audio/bus/AudioBusSystem.hpp"
#include "engine/audio/music/MusicSystem.hpp"

namespace platform
{
    class AudioDebugOverlay
    {
    public:
        AudioDebugOverlay();

        void RenderOverlay(const AudioDiagnostics &diagnostics, const AudioBusSystem &busSystem, const MusicSystem &musicSystem, Renderer &renderer);
        void ToggleOverlay() { m_enabled = !m_enabled; }
        void SetEnabled(bool enabled) { m_enabled = enabled; }

        [[nodiscard]] bool IsEnabled() const { return m_enabled; }

    private:
        bool m_enabled{true};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_DEBUG_AUDIO_DEBUG_OVERLAY_HPP
