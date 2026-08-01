#include "engine/gameplay/progress/ProgressTrackingSystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include <algorithm>
#include <cmath>

namespace platform
{
    void ProgressTrackingSystem::reset()
    {
        m_stats = ProgressStatistics{};
        m_lastPosition = {0.0f, 0.0f};
        m_hasLastPosition = false;
        m_totalTime = 0.0;
    }

    void ProgressTrackingSystem::Update(Registry &registry, EntityID targetEntity, double dt)
    {
        auto *tComp = registry.GetComponent<TransformComponent>(targetEntity);
        if (!tComp) return;

        if (!m_hasLastPosition)
        {
            m_lastPosition = tComp->Position;
            m_hasLastPosition = true;
            return;
        }

        float delta = static_cast<float>(dt);
        m_totalTime += dt;

        float distStep = glm::distance(tComp->Position, m_lastPosition);
        m_stats.distanceMeters += distStep;
        m_stats.maxDistanceMeters = std::max(m_stats.maxDistanceMeters, m_stats.distanceMeters);

        auto *rbComp = registry.GetComponent<RigidBodyComponent>(targetEntity);
        if (rbComp)
        {
            m_stats.currentSpeed = glm::length(rbComp->LinearVelocity);
            m_stats.maxSpeed = std::max(m_stats.maxSpeed, m_stats.currentSpeed);
        }
        else if (delta > 0.0f)
        {
            m_stats.currentSpeed = distStep / delta;
            m_stats.maxSpeed = std::max(m_stats.maxSpeed, m_stats.currentSpeed);
        }

        if (m_totalTime > 0.0)
        {
            m_stats.averageSpeed = static_cast<float>(m_stats.distanceMeters / m_totalTime);
        }

        m_lastPosition = tComp->Position;
    }
}
