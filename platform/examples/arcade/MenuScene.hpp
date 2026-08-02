#ifndef PLATFORM_EXAMPLES_ARCADE_MENU_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_MENU_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <array>

namespace platform::arcade
{
    /// Cabinet front-end: pick a game with the arrow keys, launch with Enter.
    class MenuScene final : public ArcadeScene
    {
    public:
        explicit MenuScene(ArcadeSession *session);

        [[nodiscard]] int GetSelectedIndex() const { return m_selected; }
        void MoveSelection(int delta);
        void LaunchSelected();

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnRender(Renderer &renderer) override;

    private:
        struct Entry
        {
            const char *Title;
            const char *Tagline;
            const char *Controls;
            ArcadeScreen Screen;
            glm::vec4 Color;
        };

        static constexpr int kEntryCount = 2;
        std::array<Entry, kEntryCount> m_entries{};

        int m_selected{0};
        float m_time{0.0f};
        bool m_navLatch{false};
        bool m_acceptLatch{true}; // swallow the Enter that launched the menu
        std::array<glm::vec2, 60> m_stars{};
        std::array<float, 60> m_starSpeeds{};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_MENU_SCENE_HPP
