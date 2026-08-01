#include "engine/ui/screens/ScreenManager.hpp"
#include "engine/ui/events/PresentationEvents.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    ScreenManager::ScreenManager() = default;

    ScreenManager::~ScreenManager()
    {
        if (m_activeScreen)
        {
            m_activeScreen->Exit();
            m_activeScreen->Destroy();
        }
        m_screens.clear();
    }

    void ScreenManager::RegisterScreen(std::unique_ptr<Screen> screen)
    {
        if (!screen)
        {
            return;
        }

        m_screens.push_back(std::move(screen));
    }

    bool ScreenManager::TransitionTo(ScreenType targetType, TransitionType transitionType, double durationSec, EventQueue *eventQueue)
    {
        Screen *target = GetScreen(targetType);
        if (!target)
        {
            LOG_ERROR("[ScreenManager] Target screen not found.");
            return false;
        }

        ScreenType oldType = m_activeScreen ? m_activeScreen->GetType() : ScreenType::Splash;

        if (transitionType == TransitionType::None)
        {
            if (m_activeScreen)
            {
                m_activeScreen->Exit();
            }
            m_activeScreen = target;
            m_activeScreen->Enter();

            if (eventQueue)
            {
                eventQueue->Push(std::make_shared<ScreenChangedEvent>(oldType, targetType));
            }
            return true;
        }

        m_nextScreen = target;
        m_transition.Type = transitionType;
        m_transition.DurationSeconds = durationSec;
        m_transition.ElapsedSeconds = 0.0;
        m_transition.Active = true;

        if (m_activeScreen)
        {
            m_activeScreen->Exit();
        }

        if (eventQueue)
        {
            eventQueue->Push(std::make_shared<ScreenChangedEvent>(oldType, targetType));
        }

        return true;
    }

    void ScreenManager::Update(double dt)
    {
        if (m_transition.Active)
        {
            m_transition.ElapsedSeconds += dt;
            if (m_transition.ElapsedSeconds >= m_transition.DurationSeconds)
            {
                m_transition.Active = false;
                m_activeScreen = m_nextScreen;
                m_nextScreen = nullptr;
                if (m_activeScreen)
                {
                    m_activeScreen->Enter();
                }
            }
        }

        if (m_activeScreen)
        {
            m_activeScreen->Update(dt);
        }
    }

    void ScreenManager::Render(Renderer &renderer)
    {
        if (m_activeScreen)
        {
            m_activeScreen->Render(renderer);
        }
    }

    Screen *ScreenManager::GetScreen(ScreenType type) const
    {
        for (const auto &screen : m_screens)
        {
            if (screen->GetType() == type)
            {
                return screen.get();
            }
        }
        return nullptr;
    }
}
