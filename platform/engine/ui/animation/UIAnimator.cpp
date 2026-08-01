#include "engine/ui/animation/UIAnimator.hpp"
#include <algorithm>

namespace platform
{
    UIAnimator::UIAnimator() = default;

    void UIAnimator::Play(std::shared_ptr<Widget> widget, UIAnimation animation)
    {
        if (!widget)
        {
            return;
        }

        Stop(widget); // Remove existing animation on same widget
        m_activeAnimations.push_back({std::move(widget), animation});
    }

    void UIAnimator::Stop(const std::shared_ptr<Widget> &widget)
    {
        auto it = std::remove_if(m_activeAnimations.begin(), m_activeAnimations.end(), [&widget](const ActiveWidgetAnimation &anim) {
            return anim.TargetWidget == widget;
        });
        m_activeAnimations.erase(it, m_activeAnimations.end());
    }

    void UIAnimator::Update(double dt)
    {
        for (auto it = m_activeAnimations.begin(); it != m_activeAnimations.end();)
        {
            auto &target = it->TargetWidget;
            auto &anim = it->Animation;

            if (!target)
            {
                it = m_activeAnimations.erase(it);
                continue;
            }

            anim.ElapsedSeconds += dt;
            float progress = anim.CalculateProgress();

            // Apply animation effect based on type
            if (anim.Type == AnimationType::Slide)
            {
                glm::vec2 pos = glm::mix(anim.StartVector, anim.TargetVector, progress);
                target->SetPosition(pos);
            }
            else if (anim.Type == AnimationType::Scale)
            {
                glm::vec2 size = glm::mix(anim.StartVector, anim.TargetVector, progress);
                target->SetSize(size);
            }

            if (anim.ElapsedSeconds >= (anim.DelaySeconds + anim.DurationSeconds))
            {
                if (anim.Loop)
                {
                    anim.ElapsedSeconds = anim.DelaySeconds;
                    if (anim.Reverse)
                    {
                        std::swap(anim.StartVector, anim.TargetVector);
                        std::swap(anim.StartColor, anim.TargetColor);
                    }
                    ++it;
                }
                else
                {
                    it = m_activeAnimations.erase(it);
                }
            }
            else
            {
                ++it;
            }
        }
    }

    bool UIAnimator::IsPlaying(const std::shared_ptr<Widget> &widget) const
    {
        for (const auto &anim : m_activeAnimations)
        {
            if (anim.TargetWidget == widget)
            {
                return true;
            }
        }
        return false;
    }
}
