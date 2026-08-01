#ifndef PLATFORM_ENGINE_GAMEPLAY_SCORE_SCORE_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_SCORE_SCORE_SYSTEM_HPP

#include "engine/gameplay/score/ScoreSettingsComponent.hpp"
#include "engine/gameplay/score/ScoreRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include <cstdint>
#include <algorithm>

namespace platform
{
    struct ScoreMetrics
    {
        uint32_t CoinsCollected{0};
        float DistanceTravelled{0.0f};
        uint32_t TotalScore{0};
    };

    class ScoreSystem
    {
    public:
        ScoreSystem() = default;

        void addPoints(ScoreRuntimeComponent &runtime, uint64_t points)
        {
            runtime.score += points;
            runtime.bestScore = std::max(runtime.bestScore, runtime.score);
        }

        void removePoints(ScoreRuntimeComponent &runtime, uint64_t points)
        {
            if (runtime.score >= points) runtime.score -= points;
            else runtime.score = 0;
        }

        void reset(ScoreRuntimeComponent &runtime)
        {
            runtime.score = 0;
        }

        [[nodiscard]] uint64_t score(const ScoreRuntimeComponent &runtime) const
        {
            return runtime.score;
        }

        void AddCoins(uint32_t count) { m_metrics.CoinsCollected += count; UpdateScore(); }
        void UpdateDistance(float distance) { m_metrics.DistanceTravelled = distance; UpdateScore(); }
        void Reset() { m_metrics = ScoreMetrics{}; }

        [[nodiscard]] const ScoreMetrics &GetMetrics() const { return m_metrics; }
        [[nodiscard]] uint32_t GetScore() const { return m_metrics.TotalScore; }

    private:
        void UpdateScore()
        {
            m_metrics.TotalScore = static_cast<uint32_t>(m_metrics.DistanceTravelled * 1.0f) + (m_metrics.CoinsCollected * 100);
        }

        ScoreMetrics m_metrics{};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_SCORE_SCORE_SYSTEM_HPP
