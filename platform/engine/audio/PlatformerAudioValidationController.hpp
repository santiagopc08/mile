#ifndef PLATFORM_ENGINE_AUDIO_PLATFORMER_AUDIO_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_AUDIO_PLATFORMER_AUDIO_VALIDATION_CONTROLLER_HPP

#include <string>

namespace platform
{
    class PlatformerAudioValidationController
    {
    public:
        PlatformerAudioValidationController() = default;

        void triggerAllSoundEvents();
        void triggerAllMusicTracks();

        [[nodiscard]] uint32_t triggeredSoundCount() const { return m_triggeredSoundCount; }
        [[nodiscard]] uint32_t triggeredMusicCount() const { return m_triggeredMusicCount; }

    private:
        uint32_t m_triggeredSoundCount{0};
        uint32_t m_triggeredMusicCount{0};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_PLATFORMER_AUDIO_VALIDATION_CONTROLLER_HPP
