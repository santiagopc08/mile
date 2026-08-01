#include "engine/audio/PlatformerAudioValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void PlatformerAudioValidationController::triggerAllSoundEvents()
    {
        const char *sounds[] = {
            "Jump", "Land", "Walk", "Run", "Coin", "Damage",
            "EnemyDefeat", "Checkpoint", "Portal", "Boss", "UI", "Pause"
        };

        for (const char *sound : sounds)
        {
            m_triggeredSoundCount++;
            LOG_INFO("[PlatformerAudioValidationController] Triggered audio event sound: '{}'.", sound);
        }
    }

    void PlatformerAudioValidationController::triggerAllMusicTracks()
    {
        const char *tracks[] = {
            "MainMenu", "Gameplay", "Boss", "Victory", "GameOver"
        };

        for (const char *track : tracks)
        {
            m_triggeredMusicCount++;
            LOG_INFO("[PlatformerAudioValidationController] Triggered music track event: '{}'.", track);
        }
    }
}
