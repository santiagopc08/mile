#ifndef PLATFORM_ENGINE_UI_SCREENS_SCREEN_HPP
#define PLATFORM_ENGINE_UI_SCREENS_SCREEN_HPP

#include "engine/graphics/Renderer.hpp"
#include <string>

namespace platform
{
    enum class ScreenType
    {
        Splash = 0,
        MainMenu,
        Gameplay,
        Pause,
        Loading,
        GameOver
    };

    class Screen
    {
    public:
        explicit Screen(ScreenType type, std::string name = "Screen")
            : m_type(type), m_name(std::move(name)) {}
        virtual ~Screen() = default;

        void Enter() { OnEnter(); m_active = true; }
        void Update(double dt) { if (m_active) OnUpdate(dt); }
        void Render(Renderer &renderer) { if (m_active) OnRender(renderer); }
        void Exit() { m_active = false; OnExit(); }
        void Destroy() { OnDestroy(); }

        [[nodiscard]] ScreenType GetType() const { return m_type; }
        [[nodiscard]] const std::string &GetName() const { return m_name; }
        [[nodiscard]] bool IsActive() const { return m_active; }

    protected:
        virtual void OnEnter() {}
        virtual void OnUpdate(double dt) { (void)dt; }
        virtual void OnRender(Renderer &renderer) { (void)renderer; }
        virtual void OnExit() {}
        virtual void OnDestroy() {}

    private:
        ScreenType m_type;
        std::string m_name;
        bool m_active{false};
    };
}

#endif // PLATFORM_ENGINE_UI_SCREENS_SCREEN_HPP
