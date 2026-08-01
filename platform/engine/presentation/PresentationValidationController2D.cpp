#include "engine/presentation/PresentationValidationController2D.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void PresentationValidationController2D::Initialize()
    {
        m_step = Presentation2DStep::Gameplay;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[PresentationValidationController2D] Initialized autonomous 2D presentation validation sequence.");
    }

    std::string PresentationValidationController2D::GetStateName() const
    {
        switch (m_step)
        {
        case Presentation2DStep::Gameplay: return "Gameplay";
        case Presentation2DStep::Pause: return "Pause";
        case Presentation2DStep::Resume: return "Resume";
        case Presentation2DStep::GameOver: return "GameOver";
        case Presentation2DStep::Restart: return "Restart";
        case Presentation2DStep::CompleteLevel: return "CompleteLevel";
        case Presentation2DStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void PresentationValidationController2D::Update(GameplayHUDViewModel2D &viewModel, double dt)
    {
        m_stepTimer += dt;

        switch (m_step)
        {
        case Presentation2DStep::Gameplay:
            viewModel.updateHUD(100.0f, 10, 3, 500, 1, 1, 290.0f);
            if (m_stepTimer >= 0.05)
            {
                m_step = Presentation2DStep::Pause;
                m_stepTimer = 0.0;
                LOG_INFO("[PresentationValidationController2D] Transitioned -> Pause");
            }
            break;

        case Presentation2DStep::Pause:
            if (m_stepTimer >= 0.05)
            {
                m_step = Presentation2DStep::Resume;
                m_stepTimer = 0.0;
                LOG_INFO("[PresentationValidationController2D] Transitioned -> Resume");
            }
            break;

        case Presentation2DStep::Resume:
            if (m_stepTimer >= 0.05)
            {
                m_step = Presentation2DStep::GameOver;
                m_stepTimer = 0.0;
                LOG_INFO("[PresentationValidationController2D] Transitioned -> GameOver");
            }
            break;

        case Presentation2DStep::GameOver:
            viewModel.updateHUD(0.0f, 10, 0, 500, 1, 1, 0.0f);
            if (m_stepTimer >= 0.05)
            {
                m_step = Presentation2DStep::Restart;
                m_stepTimer = 0.0;
                LOG_INFO("[PresentationValidationController2D] Transitioned -> Restart");
            }
            break;

        case Presentation2DStep::Restart:
            viewModel.updateHUD(100.0f, 0, 3, 0, 1, 1, 300.0f);
            if (m_stepTimer >= 0.05)
            {
                m_step = Presentation2DStep::CompleteLevel;
                m_stepTimer = 0.0;
                LOG_INFO("[PresentationValidationController2D] Transitioned -> CompleteLevel");
            }
            break;

        case Presentation2DStep::CompleteLevel:
            viewModel.updateHUD(100.0f, 25, 3, 2500, 1, 1, 180.0f);
            m_cycleCount++;
            LOG_INFO("[PresentationValidationController2D] Completed full presentation cycle (Count: {}).", m_cycleCount);
            m_step = Presentation2DStep::Repeat;
            m_stepTimer = 0.0;
            break;

        case Presentation2DStep::Repeat:
            m_step = Presentation2DStep::Gameplay;
            m_stepTimer = 0.0;
            break;
        }
    }
}
