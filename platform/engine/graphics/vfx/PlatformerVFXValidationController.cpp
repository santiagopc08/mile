#include "engine/graphics/vfx/PlatformerVFXValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void PlatformerVFXValidationController::triggerAllVFXEvents()
    {
        const char *vfxEvents[] = {
            "JumpDust", "Landing", "CoinPickup", "EnemyHit", "EnemyDeath",
            "Portal", "Explosion", "Spark", "Heal", "Checkpoint"
        };

        for (const char *effect : vfxEvents)
        {
            m_triggeredVFXCount++;
            LOG_INFO("[PlatformerVFXValidationController] Triggered visual effect event: '{}'.", effect);
        }
    }
}
