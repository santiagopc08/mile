#ifndef PLATFORM_ENGINE_PRESENTATION_PRESENTATION_VALIDATION_CONTROLLER_2D_HPP
#define PLATFORM_ENGINE_PRESENTATION_PRESENTATION_VALIDATION_CONTROLLER_2D_HPP

#include "engine/presentation/GameplayHUDViewModel2D.hpp"
#include <string>

namespace platform
{
    enum class Presentation2DStep
    {
        Gameplay,
        Pause,
        Resume,
        GameOver,
        Restart,
        CompleteLevel,
        Repeat
    };

    class PresentationValidationController2D
    {
    public:
        PresentationValidationController2D() = default;

        void Initialize();
        void Update(GameplayHUDViewModel2D &viewModel, double dt);

        [[nodiscard]] Presentation2DStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        Presentation2DStep m_step{Presentation2DStep::Gameplay};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_PRESENTATION_PRESENTATION_VALIDATION_CONTROLLER_2D_HPP
