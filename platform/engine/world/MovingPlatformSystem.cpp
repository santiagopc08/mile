#include "engine/world/MovingPlatformSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void MovingPlatformSystem::Update(Registry &registry, double dt)
    {
        auto view = registry.GetView<PlatformSettingsComponent, PlatformRuntimeComponent>();
        for (auto entity : view)
        {
            auto *settings = registry.GetComponent<PlatformSettingsComponent>(entity);
            auto *runtime = registry.GetComponent<PlatformRuntimeComponent>(entity);

            if (!settings || !runtime || settings->waypoints.size() < 2) continue;

            glm::vec2 pA = settings->waypoints[runtime->currentWaypoint];
            uint32_t nextWp = (runtime->currentWaypoint + runtime->direction) % settings->waypoints.size();
            glm::vec2 pB = settings->waypoints[nextWp];

            float dist = glm::distance(pA, pB);
            if (dist > 0.001f)
            {
                runtime->progress += (settings->speed * static_cast<float>(dt)) / dist;
            }

            if (runtime->progress >= 1.0f)
            {
                runtime->progress = 0.0f;
                runtime->currentWaypoint = nextWp;

                if (settings->motionMode == PlatformMotionMode::PingPong)
                {
                    if (runtime->currentWaypoint == 0 || runtime->currentWaypoint == settings->waypoints.size() - 1)
                    {
                        runtime->direction *= -1;
                    }
                }
            }

            runtime->currentPosition = glm::mix(pA, pB, runtime->progress);
        }
    }

    glm::vec2 MovingPlatformSystem::position(Registry &registry, EntityID platformEntity) const
    {
        auto *runtime = registry.GetComponent<PlatformRuntimeComponent>(platformEntity);
        return runtime ? runtime->currentPosition : glm::vec2(0.0f);
    }
}
