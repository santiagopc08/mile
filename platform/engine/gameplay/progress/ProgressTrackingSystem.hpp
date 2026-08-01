#ifndef PLATFORM_ENGINE_GAMEPLAY_PROGRESS_PROGRESS_TRACKING_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_PROGRESS_PROGRESS_TRACKING_SYSTEM_HPP

#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include <glm/glm.hpp>

namespace platform
{
    struct ProgressStatistics
    {
        double distanceMeters{0.0};
        double maxDistanceMeters{0.0};
        float currentSpeed{0.0f};
        float maxSpeed{0.0f};
        float averageSpeed{0.0f};
        double airTimeSeconds{0.0};
    };

    class ProgressTrackingSystem
    {
    public:
        ProgressTrackingSystem() = default;

        void reset();
        void Update(Registry &registry, EntityID targetEntity, double dt);

        [[nodiscard]] double distance() const { return m_stats.distanceMeters; }
        [[nodiscard]] float speed() const { return m_stats.currentSpeed; }
        [[nodiscard]] const ProgressStatistics &statistics() const { return m_stats; }

    private:
        ProgressStatistics m_stats{};
        glm::vec2 m_lastPosition{0.0f, 0.0f};
        bool m_hasLastPosition{false};
        double m_totalTime{0.0};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_PROGRESS_PROGRESS_TRACKING_SYSTEM_HPP
