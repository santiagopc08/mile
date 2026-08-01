#ifndef PLATFORM_ENGINE_UI_ANIMATION_UI_ANIMATOR_HPP
#define PLATFORM_ENGINE_UI_ANIMATION_UI_ANIMATOR_HPP

#include "engine/ui/widgets/Widget.hpp"
#include "engine/ui/animation/UIAnimation.hpp"
#include <vector>
#include <memory>

namespace platform
{
    struct ActiveWidgetAnimation
    {
        std::shared_ptr<Widget> TargetWidget;
        UIAnimation Animation;
    };

    class UIAnimator
    {
    public:
        UIAnimator();

        void Play(std::shared_ptr<Widget> widget, UIAnimation animation);
        void Stop(const std::shared_ptr<Widget> &widget);

        void Update(double dt);

        [[nodiscard]] size_t GetActiveAnimationCount() const { return m_activeAnimations.size(); }
        [[nodiscard]] bool IsPlaying(const std::shared_ptr<Widget> &widget) const;

    private:
        std::vector<ActiveWidgetAnimation> m_activeAnimations;
    };
}

#endif // PLATFORM_ENGINE_UI_ANIMATION_UI_ANIMATOR_HPP
