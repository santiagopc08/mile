#ifndef PLATFORM_ENGINE_UI_SCREENS_SCREEN_MANAGER_HPP
#define PLATFORM_ENGINE_UI_SCREENS_SCREEN_MANAGER_HPP

#include "engine/ui/screens/Screen.hpp"
#include "engine/ui/screens/ScreenTransition.hpp"
#include "engine/events/EventQueue.hpp"
#include <memory>
#include <vector>

namespace platform
{
    class ScreenManager
    {
    public:
        ScreenManager();
        ~ScreenManager();

        void RegisterScreen(std::unique_ptr<Screen> screen);
        bool TransitionTo(ScreenType targetType, TransitionType transitionType = TransitionType::FadeIn, double durationSec = 0.3, EventQueue *eventQueue = nullptr);

        void Update(double dt);
        void Render(Renderer &renderer);

        Screen *GetActiveScreen() const { return m_activeScreen; }
        Screen *GetScreen(ScreenType type) const;

        [[nodiscard]] const ScreenTransition &GetTransition() const { return m_transition; }
        [[nodiscard]] bool IsTransitioning() const { return m_transition.Active; }

    private:
        std::vector<std::unique_ptr<Screen>> m_screens;
        Screen *m_activeScreen{nullptr};
        Screen *m_nextScreen{nullptr};
        ScreenTransition m_transition{};
    };
}

#endif // PLATFORM_ENGINE_UI_SCREENS_SCREEN_MANAGER_HPP
